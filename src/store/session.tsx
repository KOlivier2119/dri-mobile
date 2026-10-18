import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';

/**
 * UI-only demo state. Nothing here is a real authenticated session —
 * it is local persistence so the prototype behaves coherently across restarts.
 */

export type Role = 'client' | 'driver';

export type DriverStatus = 'unsubmitted' | 'submitted' | 'review' | 'changes' | 'approved' | 'rejected';

export type Session = {
  hydrated: boolean;
  onboarded: boolean;
  role: Role | null;
  /** mock "signed in" flag for the current role */
  authed: boolean;
  phone: string | null;
  driverStatus: DriverStatus;
};

const INITIAL: Session = {
  hydrated: false,
  onboarded: false,
  role: null,
  authed: false,
  phone: null,
  driverStatus: 'unsubmitted',
};

const STORAGE_KEY = 'dri.demo.session.v1';

/** Centralized mock backend configuration — never a real SMS provider. */
export const MOCK = {
  otpCode: '246810',
  otpResendSeconds: 30,
  verifyDelayMs: 900,
  submitDelayMs: 1400,
  uploadDelayMs: 1800,
  demoPhone: '78 123 4567',
} as const;

type Actions = {
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  chooseRole: (role: Role) => Promise<void>;
  authenticate: (phone: string) => Promise<void>;
  setDriverStatus: (status: DriverStatus) => Promise<void>;
  resetDemo: () => Promise<void>;
};

const SessionContext = React.createContext<{ session: Session } & Actions>({
  session: INITIAL,
  hydrate: async () => {},
  completeOnboarding: async () => {},
  chooseRole: async () => {},
  authenticate: async () => {},
  setDriverStatus: async () => {},
  resetDemo: async () => {},
});

async function persist(session: Session) {
  const { hydrated: _hydrated, ...stored } = session;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored)).catch(() => {});
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session>(INITIAL);

  const update = React.useCallback(async (patch: Partial<Session>) => {
    setSession((prev) => {
      const next = { ...prev, ...patch };
      void persist(next);
      return next;
    });
  }, []);

  const hydrate = React.useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSession({ ...INITIAL, hydrated: true, ...JSON.parse(raw) });
        return;
      }
    } catch {
      // fresh install on read failure — fall through
    }
    setSession((prev) => ({ ...prev, hydrated: true }));
  }, []);

  const actions = React.useMemo<Actions>(
    () => ({
      hydrate,
      completeOnboarding: () => update({ onboarded: true }),
      chooseRole: (role) => update({ role, authed: false }),
      authenticate: (phone) => update({ phone, authed: true }),
      setDriverStatus: (driverStatus) => update({ driverStatus }),
      resetDemo: async () => {
        await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        setSession({ ...INITIAL, hydrated: true });
      },
    }),
    [hydrate, update],
  );

  return (
    <SessionContext.Provider value={{ session, ...actions }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  return React.useContext(SessionContext);
}

/** Simulated network latency for mock service calls. */
export function mockDelay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
