import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';

import { ApiError, setSessionLostHandler } from '@/api/client';
import { Auth, Drivers, Onboarding } from '@/api/endpoints';
import { disconnectRealtime } from '@/api/realtime';
import { clearTokens, getTokens, loadTokens, saveTokens } from '@/api/tokens';
import { tr } from '@/i18n';
import type { AuthResult, CodeSent, OnboardingState, Payment, User } from '@/api/types';

export type Journey = 'customer' | 'driver';

/**
 * Client session. The server is the authority for identity, role and
 * onboarding progress (`/auth/me`, `/onboarding/state`); the only things kept
 * locally are UI preferences the server has no notion of: whether the intro
 * was seen, which portal the person is looking at, and the email awaiting a
 * verification code.
 */
export type Session = {
  hydrated: boolean;
  onboarded: boolean;
  /** portal the person chose — a view, never a grant */
  journey: Journey | null;
  /** registration started but the emailed code not yet entered */
  pendingEmail: string | null;
  user: User | null;
  state: OnboardingState | null;
  /** driver registration fee attempt, once one exists */
  fee: Payment | null;
};

type Prefs = Pick<Session, 'onboarded' | 'journey' | 'pendingEmail'> & {
  /** last known server state, so a cold start without network still opens the right screen */
  user: User | null;
  state: OnboardingState | null;
};

const PREFS_KEY = 'dri.prefs.v1';

const INITIAL: Session = {
  hydrated: false,
  onboarded: false,
  journey: null,
  pendingEmail: null,
  user: null,
  state: null,
  fee: null,
};

type Actions = {
  completeOnboarding: () => Promise<void>;
  chooseJourney: (journey: Journey) => Promise<void>;
  register: (input: { displayName: string; email: string; phone: string; password: string }) => Promise<CodeSent>;
  verify: (code: string) => Promise<void>;
  resendCode: () => Promise<CodeSent>;
  login: (email: string, password: string) => Promise<void>;
  completeReset: (result: AuthResult) => Promise<void>;
  /** re-read user, onboarding state and fee from the API */
  refresh: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = React.createContext<{ session: Session } & Actions>(null as never);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session>(INITIAL);
  const ref = React.useRef(session);
  React.useEffect(() => {
    ref.current = session;
  }, [session]);

  const patch = React.useCallback((next: Partial<Session>) => {
    setSession((prev) => {
      const merged = { ...prev, ...next };
      const prefs: Prefs = {
        onboarded: merged.onboarded,
        journey: merged.journey,
        pendingEmail: merged.pendingEmail,
        user: merged.user,
        state: merged.state,
      };
      void AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
      return merged;
    });
  }, []);

  const signedOut = React.useCallback(() => {
    disconnectRealtime();
    patch({ user: null, state: null, fee: null });
  }, [patch]);

  const refresh = React.useCallback(async () => {
    if (!getTokens()) return;
    try {
      const [user, state] = await Promise.all([Auth.me(), Onboarding.state()]);
      // the fee only exists once there is an application to pay it for
      const fee = state.driver.applicationStatus ? await Drivers.fee().catch(() => null) : null;
      patch({ user, state, fee });
    } catch (error) {
      // offline: keep the cached session; a rejected refresh token already signed us out
      if (error instanceof ApiError && error.status === 0) return;
      throw error;
    }
  }, [patch]);

  React.useEffect(() => {
    setSessionLostHandler(signedOut);
    void (async () => {
      let prefs: Partial<Prefs> = {};
      try {
        const raw = await AsyncStorage.getItem(PREFS_KEY);
        if (raw) prefs = JSON.parse(raw) as Prefs;
      } catch {
        // unreadable prefs behave like a fresh install
      }
      const tokens = await loadTokens();
      setSession({
        ...INITIAL,
        onboarded: prefs.onboarded ?? false,
        journey: prefs.journey ?? null,
        pendingEmail: prefs.pendingEmail ?? null,
        user: tokens ? (prefs.user ?? null) : null,
        state: tokens ? (prefs.state ?? null) : null,
      });
      if (tokens) await refresh().catch(() => {});
      setSession((prev) => ({ ...prev, hydrated: true }));
    })();
  }, [refresh, signedOut]);

  const startSession = React.useCallback(
    async ({ user, tokens }: AuthResult) => {
      await saveTokens(tokens);
      patch({ user, pendingEmail: null });
      await refresh();
    },
    [patch, refresh],
  );

  const actions = React.useMemo<Actions>(
    () => ({
      completeOnboarding: async () => patch({ onboarded: true }),
      chooseJourney: async (journey) => {
        patch({ journey });
        await refresh().catch(() => {});
      },
      register: async (input) => {
        const email = input.email.trim().toLowerCase();
        // the portal chosen on the first screen decides the account type; a driver
        // sign-up opens the driver journey but never grants the DRIVER role
        const accountType = ref.current.journey === 'driver' ? 'driver' : 'rider';
        const sent = await Auth.register({ ...input, email, accountType });
        patch({ pendingEmail: email });
        return sent;
      },
      verify: async (code) => {
        const email = ref.current.pendingEmail;
        if (!email) throw new ApiError(400, tr('auth.verify.noAccount'));
        await startSession(await Auth.verify(email, code));
      },
      resendCode: async () => {
        const email = ref.current.pendingEmail;
        if (!email) throw new ApiError(400, tr('auth.verify.noAccount'));
        return Auth.resendVerification(email);
      },
      login: async (email, password) => {
        await startSession(await Auth.login(email.trim().toLowerCase(), password));
      },
      completeReset: startSession,
      refresh,
      updateDisplayName: async (name) => {
        const user = await Auth.updateProfile(name.trim());
        patch({ user });
        await refresh();
      },
      signOut: async () => {
        const refreshToken = getTokens()?.refreshToken;
        if (refreshToken) await Auth.logout(refreshToken).catch(() => {});
        await clearTokens();
        signedOut();
      },
    }),
    [patch, refresh, signedOut, startSession],
  );

  return <SessionContext.Provider value={{ session, ...actions }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return React.useContext(SessionContext);
}

/** The portal on screen: what the person picked, else what the server knows them as. */
export function portalOf(session: Session): Journey {
  return session.journey ?? session.state?.journey ?? 'customer';
}

export const canBook = (s: Session) => Boolean(s.state?.customer.canBook);
export const canWork = (s: Session) => Boolean(s.state?.driver.canWork);
export const feePaid = (s: Session) => Boolean(s.fee?.paid || s.fee?.settlement === 'SETTLED');
