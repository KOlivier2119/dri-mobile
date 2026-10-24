import { Platform } from 'react-native';

import { API_URL } from '@/api/config';
import { clearTokens, getTokens, saveTokens } from '@/api/tokens';
import { currentLocale, tr } from '@/i18n';
import type { Tokens } from '@/api/types';

/** The API's error envelope, plus status 0 for "never reached the server". */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly correlationId?: string,
  ) {
    super(message);
  }

  /** The route doesn't exist on this backend yet (a proposed endpoint). */
  get missing() {
    return this.status === 404 || this.status === 405;
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** send the bearer token (default true) */
  auth?: boolean;
};

let onSessionLost: () => void = () => {};

/** Called when the refresh token is rejected: the user has to sign in again. */
export function setSessionLostHandler(handler: () => void) {
  onSessionLost = handler;
}

export function api<T>(path: string, options: Options = {}): Promise<T> {
  return send<T>(path, options, true);
}

async function send<T>(path: string, { method = 'GET', body, auth = true }: Options, retry: boolean): Promise<T> {
  // lets the API answer in the person's language once it localizes its messages
  const headers: Record<string, string> = { accept: 'application/json', 'accept-language': currentLocale() };
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isForm) headers['content-type'] = 'application/json';
  const token = auth ? getTokens()?.accessToken : undefined;
  if (token) headers.authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch (e) {
    // only a failed connection is a connection problem; a request the app couldn't even
    // build (e.g. an unsupported body) must not tell the person to check their Wi-Fi
    if (isNetworkFailure(e)) throw new ApiError(0, tr('errors.network'));
    console.error(`${method} ${path} could not be sent`, e);
    throw new ApiError(0, tr('errors.generic'));
  }

  if (res.status === 401 && auth && retry && getTokens()?.refreshToken) {
    if (await refreshTokens()) return send<T>(path, { method, body, auth }, false);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const envelope = (data ?? {}) as { message?: string | string[]; correlationId?: string };
    const message = Array.isArray(envelope.message) ? envelope.message[0] : envelope.message;
    throw new ApiError(res.status, humanize(message, res.status), envelope.correlationId);
  }
  return data as T;
}

/**
 * Refresh tokens rotate and replaying a spent one revokes the whole family,
 * so concurrent 401s must share ONE refresh call rather than racing.
 */
let inflight: Promise<boolean> | null = null;

function refreshTokens(): Promise<boolean> {
  inflight ??= (async () => {
    const refreshToken = getTokens()?.refreshToken;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { tokens } = (await res.json()) as { tokens: Tokens };
      await saveTokens(tokens);
      return true;
    } catch {
      await clearTokens();
      onSessionLost();
      return false;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/**
 * expo/fetch (native) reports connection failures as `fetch failed: …` and throws
 * plain errors for bodies it can't encode; browsers throw a TypeError for both
 * offline and CORS, and encode any body we build themselves.
 */
function isNetworkFailure(e: unknown) {
  if (!(e instanceof Error)) return false;
  return e.message.startsWith('fetch failed') || (Platform.OS === 'web' && e instanceof TypeError);
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Validation messages arrive as `field: detail`; users only need the detail. */
function humanize(message: string | undefined, status: number) {
  // these read the same everywhere, so show our translation, not the server's English
  if (status === 429) return tr('errors.tooMany');
  if (status >= 500) return tr('errors.server');
  if (message) {
    const detail = message.includes(': ') ? message.slice(message.indexOf(': ') + 2) : message;
    return detail.charAt(0).toUpperCase() + detail.slice(1);
  }
  return tr('errors.generic');
}
