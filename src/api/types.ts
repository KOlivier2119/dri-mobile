/**
 * Response shapes of the DRI API (`/api/v1`). The OpenAPI document only
 * describes request bodies, so these mirror what the service actually returns.
 * Money is a decimal string in RWF.
 */

export type Role = 'CUSTOMER' | 'DRIVER' | 'ADMIN';
export type ServiceCode = 'BOB_NIGHT' | 'PRIVATE_DRIVER';
export type Transmission = 'MANUAL' | 'AUTOMATIC';
export type DocType = 'NATIONAL_ID' | 'DRIVERS_LICENSE' | 'PROFILE_PHOTO';
/** `SCHEDULED` is the planned ADR-0026 state for future departures (not yet produced by the API). */
export type BookingStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'SEARCHING'
  | 'DRIVER_ASSIGNED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'COMPLETED';
export type TripStatus =
  | 'NOT_STARTED'
  | 'DRIVER_EN_ROUTE'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'INTERRUPTED';
export type AttemptStatus = 'CREATED' | 'PENDING_PROVIDER' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN';
export type Settlement = 'UNSETTLED' | 'SETTLED' | 'REFUND_INITIATED' | 'REFUNDED';

export type Tokens = { accessToken: string; refreshToken: string };

export type User = {
  id: string;
  email: string;
  phone: string | null;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED';
  displayName: string | null;
};

export type AuthResult = { user: User; tokens: Tokens };

/** Registration and reset requests; `devCode` appears only on a local mock-mail backend. */
export type CodeSent = { expiresIn: number; retryAfterSeconds: number; devCode?: string };

export type OnboardingStep =
  | 'set_display_name'
  | 'register_vehicle'
  | 'ready_to_book'
  | 'submit_driver_application'
  | 'upload_required_documents'
  | 'await_admin_review'
  | 'driver_rejected'
  | 'driver_approved';

export type OnboardingState = {
  role: Role;
  journey: 'customer' | 'driver';
  customer: { hasName: boolean; hasVehicle: boolean; canBook: boolean };
  driver: {
    profileStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null;
    applicationStatus: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | null;
    decisionReason: string | null;
    missingDocs: DocType[];
    canWork: boolean;
  };
  nextStep: OnboardingStep;
};

export type CatalogService = {
  code: ServiceCode;
  name: string;
  nightlyOnly: boolean;
  requiresVehicle: boolean;
  pricing: { currency: string; baseAmount: string; perKmAmount: number; quoteExpiryMinutes: number } | null;
};

export type Vehicle = {
  id: string;
  plate: string;
  make: string | null;
  model: string | null;
  transmission: Transmission;
};

export type Quote = {
  id: string;
  serviceCode: ServiceCode;
  currency: string;
  amount: string;
  expiresAt: string;
  expired: boolean;
};

export type BookingDriver = { id: string; displayName: string | null; phone: string | null };

export type Booking = {
  id: string;
  status: BookingStatus;
  serviceCode: ServiceCode;
  vehiclePlate: string;
  vehicleTransmission: Transmission;
  tripId: string | null;
  tripStatus: TripStatus | null;
  amount: string;
  currency: string;
  pickupName: string;
  pickupLng: number;
  pickupLat: number;
  destinationName: string | null;
  durationHours: number | null;
  /** requested departure; null means as soon as possible */
  startAt: string | null;
  assignedDriverId: string | null;
  driver?: BookingDriver | null;
  /** latest payment attempt, or null — lets the app resume a pending MoMo payment on any device */
  payment?: { id: string; status: AttemptStatus; settlement: Settlement } | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
};

/** GET /bookings returns this summary; read one booking for the full detail. */
export type BookingSummary = Pick<
  Booking,
  | 'id'
  | 'status'
  | 'serviceCode'
  | 'amount'
  | 'currency'
  | 'pickupName'
  | 'destinationName'
  | 'startAt'
  | 'tripStatus'
  | 'driver'
  | 'createdAt'
>;

export type Trip = {
  id: string;
  bookingId: string;
  status: TripStatus;
  enRouteAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  pickupCode: { active: boolean; expiresAt: string | null };
  /** the job itself, so the driver's trip screen survives a reinstall */
  booking?: TripBooking | null;
  /** driver only, while the trip is live; `phone` is null once it ends */
  customer?: { displayName: string | null; phone: string | null } | null;
};

export type TripBooking = {
  serviceCode: ServiceCode;
  pickupName: string;
  pickupLat: number;
  pickupLng: number;
  destinationName: string | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  vehiclePlate: string;
  vehicleTransmission: Transmission;
  amount: string;
  currency: string;
  startAt: string | null;
  durationHours: number | null;
};

export type PickupCode = { code: string; expiresAt: string };

export type Offer = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CLOSED';
  expiresAt: string;
  booking: {
    id: string;
    pickupName: string;
    pickupLng: number;
    pickupLat: number;
    vehicleTransmission: Transmission;
    serviceType: { code: ServiceCode; name: string };
  };
};

export type Payment = {
  id: string;
  bookingId?: string;
  status: AttemptStatus;
  settlement: Settlement;
  amount: string;
  currency: string;
  providerCode: string;
  simulated: boolean;
  settledAt: string | null;
  paid?: boolean;
};

export type DriverApplication = {
  id: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  decidedAt: string | null;
  decisionReason: string | null;
  documents: { id: string; docType: string; createdAt: string }[];
};

export type ApplicationForm = {
  legalName: string;
  licenseNumber: string;
  nationalIdNumber: string;
  licenseExpiry?: string;
  yearsDriving: number;
  languages: string[];
  addressNote?: string;
  drivesManual: boolean;
};

export type LngLat = { lng: number; lat: number };

/**
 * PROPOSED — `GET /places/autocomplete` and `GET /places/:placeId`, exposing the
 * backend's existing MapsPort (`GeocodedPlace`) so the Google key stays server-side.
 */
export type PlaceResult = {
  placeId: string;
  label: string;
  /** secondary line, e.g. neighbourhood or street */
  secondary?: string | null;
  /** present on details; autocomplete may omit it */
  coords?: { lat: number; lng: number } | null;
};

/** PROPOSED — `GET /drivers/nearby` (ADR-0027): available drivers around a point, position only. */
export type NearbyDriver = {
  lat: number;
  lng: number;
  /** degrees clockwise from north, when known */
  heading?: number | null;
  etaSeconds?: number | null;
};
