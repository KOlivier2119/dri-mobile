import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { Tokens } from '@/api/types';

const KEY = 'dri.auth.tokens';

/**
 * Access + refresh tokens. Kept in memory for every request and mirrored to
 * the Keychain/Keystore (localStorage on web) so a session survives restarts.
 * Refresh tokens rotate, so every refresh must be written back immediately.
 */
let current: Tokens | null = null;

const storage = {
  get: () =>
    Platform.OS === 'web'
      ? Promise.resolve(globalThis.localStorage?.getItem(KEY) ?? null)
      : SecureStore.getItemAsync(KEY),
  set: (value: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(globalThis.localStorage?.setItem(KEY, value))
      : SecureStore.setItemAsync(KEY, value),
  clear: () =>
    Platform.OS === 'web'
      ? Promise.resolve(globalThis.localStorage?.removeItem(KEY))
      : SecureStore.deleteItemAsync(KEY),
};

export function getTokens() {
  return current;
}

export async function loadTokens() {
  try {
    const raw = await storage.get();
    current = raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    current = null;
  }
  return current;
}

export async function saveTokens(tokens: Tokens) {
  current = tokens;
  await storage.set(JSON.stringify(tokens)).catch(() => {});
}

export async function clearTokens() {
  current = null;
  await storage.clear().catch(() => {});
}
