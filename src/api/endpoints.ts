import { api } from '@/api/client';
import type {
  ApplicationForm,
  AuthResult,
  Booking,
  BookingSummary,
  CatalogService,
  CodeSent,
  DocType,
  DriverApplication,
  LngLat,
  NearbyDriver,
  OnboardingState,
  Offer,
  Payment,
  PickupCode,
  PlaceResult,
  Quote,
  ServiceCode,
  Transmission,
  Trip,
  TripStatus,
  User,
  Vehicle,
} from '@/api/types';

type Ack = { tripId: string; status: TripStatus };

export const Auth = {
  register: (body: {
    displayName: string;
    email: string;
    phone: string;
    password: string;
    /** opens the driver journey on the server; the role stays CUSTOMER until admin approval */
    accountType: 'rider' | 'driver';
  }) =>
    api<CodeSent>('/auth/register', { method: 'POST', body, auth: false }),
  verify: (email: string, code: string) =>
    api<AuthResult>('/auth/register/verify', { method: 'POST', body: { email, code }, auth: false }),
  resendVerification: (email: string) =>
    api<CodeSent>('/auth/verification/request', { method: 'POST', body: { email }, auth: false }),
  login: (email: string, password: string) =>
    api<AuthResult>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  requestReset: (email: string) =>
    api<CodeSent>('/auth/password-reset/request', { method: 'POST', body: { email }, auth: false }),
  confirmReset: (email: string, code: string, password: string) =>
    api<AuthResult>('/auth/password-reset/confirm', {
      method: 'POST',
      body: { email, code, password },
      auth: false,
    }),
  logout: (refreshToken: string) =>
    api<void>('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }),
  me: () => api<User>('/auth/me'),
  updateProfile: (displayName: string) =>
    api<User>('/auth/me/profile', { method: 'PATCH', body: { displayName } }),
};

export const Onboarding = {
  state: () => api<OnboardingState>('/onboarding/state'),
};

export const Catalog = {
  services: () => api<CatalogService[]>('/catalog/services', { auth: false }),
};

export const Vehicles = {
  list: () => api<Vehicle[]>('/vehicles'),
  create: (body: { plate: string; make?: string; model?: string; transmission: Transmission }) =>
    api<Vehicle>('/vehicles', { method: 'POST', body }),
};

export const Quotes = {
  /** `durationHours` is required for PRIVATE_DRIVER (priced by the hour) and ignored for BOB_NIGHT. */
  create: (serviceCode: ServiceCode, origin: LngLat, destination: LngLat, durationHours?: number) =>
    api<Quote>('/quotes', {
      method: 'POST',
      body: { serviceCode, origin, destination, ...(serviceCode === 'PRIVATE_DRIVER' ? { durationHours } : {}) },
    }),
};

export const Bookings = {
  list: () => api<BookingSummary[]>('/bookings'),
  get: (id: string) => api<Booking>(`/bookings/${id}`),
  create: (body: {
    quoteId: string;
    vehicleId: string;
    pickupName: string;
    pickupLng: number;
    pickupLat: number;
    destinationName?: string;
    destinationLng?: number;
    destinationLat?: number;
    /** ISO time for a scheduled departure; omit for now */
    startAt?: string;
    durationHours?: number;
  }) => api<Booking>('/bookings', { method: 'POST', body }),
  confirm: (id: string) => api<Booking>(`/bookings/${id}/confirm`, { method: 'POST' }),
  cancel: (id: string) => api<Booking>(`/bookings/${id}/cancel`, { method: 'POST', body: {} }),
};

export const Trips = {
  get: (id: string) => api<Trip>(`/trips/${id}`),
  active: () => api<Trip[]>('/trips/active'),
  enRoute: (id: string) => api<Ack>(`/trips/${id}/en-route`, { method: 'POST' }),
  arrived: (id: string) => api<Ack>(`/trips/${id}/arrived`, { method: 'POST' }),
  start: (id: string, code: string) => api<Ack>(`/trips/${id}/start`, { method: 'POST', body: { code } }),
  complete: (id: string) => api<Ack>(`/trips/${id}/complete`, { method: 'POST' }),
  cancel: (id: string) => api<Ack>(`/trips/${id}/cancel`, { method: 'POST', body: {} }),
  pickupCode: (id: string) => api<PickupCode>(`/trips/${id}/pickup-code`, { method: 'POST' }),
  sendLocations: (id: string, samples: { lng: number; lat: number; sampledAt: string }[]) =>
    api<unknown>(`/trips/${id}/locations`, { method: 'POST', body: { samples } }),
};

/** PROPOSED endpoints — see `PlaceResult`. Callers fall back when they 404. */
export const Places = {
  autocomplete: (q: string, near?: LngLat) =>
    api<PlaceResult[]>(
      `/places/autocomplete?q=${encodeURIComponent(q)}${near ? `&lat=${near.lat}&lng=${near.lng}` : ''}`,
    ),
  details: (placeId: string) => api<PlaceResult>(`/places/${encodeURIComponent(placeId)}`),
  /** Address for a GPS fix — sent as `pickupName`, which is what the driver reads. */
  reverse: (at: LngLat) => api<PlaceResult>(`/places/reverse?lat=${at.lat}&lng=${at.lng}`),
};

export const Payments = {
  collect: (bookingId: string) => api<Payment>('/payments', { method: 'POST', body: { bookingId } }),
  get: (id: string) => api<Payment>(`/payments/${id}`),
};

export const Drivers = {
  applications: () => api<DriverApplication[]>('/drivers/applications'),
  apply: (form: ApplicationForm) =>
    api<DriverApplication>('/drivers/applications', { method: 'POST', body: form }),
  uploadDocument: (applicationId: string, docType: DocType, file: Blob) => {
    const form = new FormData();
    form.append('docType', docType);
    form.append('file', file);
    return api<{ id: string; docType: DocType }>(`/drivers/applications/${applicationId}/documents`, {
      method: 'POST',
      body: form,
    });
  },
  payFee: (phone: string) => api<Payment>('/drivers/registration-fee', { method: 'POST', body: { phone } }),
  /** `null` until a fee attempt exists (the API answers with an empty body). */
  fee: () => api<Payment | null>('/drivers/registration-fee'),
  /** PROPOSED — see `NearbyDriver`. Accepts a bare array or `{ drivers: [...] }`. */
  nearby: async (at: LngLat) => {
    const res = await api<NearbyDriver[] | { drivers: NearbyDriver[] }>(
      `/drivers/nearby?lat=${at.lat}&lng=${at.lng}`,
    );
    return Array.isArray(res) ? res : (res?.drivers ?? []);
  },
  heartbeat: (position: LngLat, available: boolean, heading?: number | null) =>
    api<{ recorded: boolean }>('/drivers/location', {
      method: 'PATCH',
      body: { ...position, available, ...(heading != null && heading >= 0 ? { heading } : {}) },
    }),
  offers: () => api<Offer[]>('/drivers/offers'),
  accept: (offerId: string) => api<Booking>(`/drivers/offers/${offerId}/accept`, { method: 'POST' }),
  decline: (offerId: string) => api<unknown>(`/drivers/offers/${offerId}/decline`, { method: 'POST' }),
};
