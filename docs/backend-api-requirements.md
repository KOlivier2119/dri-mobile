# Backend API requirements for the DRI mobile app

What the mobile app (`dri-mobile`) needs from `dri-backend` to run on real data.
Every request and field below is taken from what the app actually sends and
reads (`src/api/endpoints.ts`, `src/api/types.ts` and the screens), checked
against the backend running locally on 2026-10-22.

- **Part 1** — new endpoints to build
- **Part 2** — changes to existing endpoints
- **Part 3** — configuration
- **Part 4** — existing endpoints the app already uses as-is (reference)
- **Part 5** — realtime events the app listens to
- **Part 6** — later / nice to have

All paths are under `/api/v1`. Auth means `Authorization: Bearer <accessToken>`.
Errors keep the existing envelope `{ statusCode, message, error, correlationId }`;
the app shows `message` to the user, so keep it human-readable.

## Priority summary

| # | What | Type | Priority | App behaviour today |
|---|------|------|----------|---------------------|
| 1.1 | `GET /drivers/nearby` | new | **P0** | Map shows no cars |
| 1.2 | `GET /places/autocomplete` | new | **P0** | Falls back to a built-in list of 20 Kigali places |
| 1.3 | `GET /places/:placeId` | new | **P0** | Same fallback |
| 1.4 | `GET /places/reverse` | new | **P0** | GPS pickups are sent as the literal text "Current location" — the driver sees that |
| 2.1 | `POST /auth/register` + `accountType` | change | **P0** | New drivers are stored as riders until they apply |
| 2.2 | Booking `driver` summary | change | **P0** | Already written in your working tree — needs commit |
| 2.3 | Scheduled dispatch (`startAt`) | change | **P0** | Scheduled rides are dispatched immediately |
| 2.4 | `POST /quotes` + `durationHours` | change | **P0** | Private Driver price ignores the hours booked |
| 2.5 | Trip detail includes booking + customer for the driver | change | **P1** | Driver loses pickup details after reinstall; can't call the rider |
| 2.6 | Latest payment on booking detail | change | **P1** | App stores the payment id on the device only |
| 2.7 | Booking list summary fields | change | P2 | App makes one extra request on the home screen |
| 2.8 | `GET /drivers/registration-fee` empty body | change | P2 | Works, but non-standard |
| 3.1 | `MAPS_PROVIDER=google` | config | **P0** | Every quote prices 0 km |
| 3.2 | Public production URL | config | **P0** | App can't be released without it |

---

## Part 1 — New endpoints

### 1.1 `GET /drivers/nearby` — available drivers for the rider's map

Planned in your config already (`DRIVER_MAP_MAX_RESULTS`, `DRIVER_MAP_RADIUS_METERS`, ADR-0027) but not implemented (404).

- **Auth:** required, any signed-in user (riders call it).
- **Query:** `lat` (number, -90..90), `lng` (number, -180..180) — the rider's pickup point.
- **Returns:** drivers with `available = true` and a fresh location heartbeat, within `DRIVER_MAP_RADIUS_METERS`, at most `DRIVER_MAP_MAX_RESULTS`.

```json
[
  { "lat": -1.9402, "lng": 30.0655, "heading": 40, "etaSeconds": 180 },
  { "lat": -1.9478, "lng": 30.0698, "heading": null, "etaSeconds": null }
]
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `lat`, `lng` | number | yes | Driver position |
| `heading` | number \| null | no | Degrees clockwise from north; rotates the car icon |
| `etaSeconds` | number \| null | no | Not shown yet; reserved for "3 min away" |

- **Privacy:** return **no** driver id, name or phone. Consider rounding coordinates (~50 m) or a small random offset so a driver can't be tracked to their door.
- The app calls this every **10 s** while the map is open. Cache per area for a few seconds if load matters.
- The app also accepts `{ "drivers": [...] }`; a bare array is preferred.
- If the endpoint returns 404, the app hides the "N drivers nearby" pill and shows the map without cars.

### 1.2 `GET /places/autocomplete` — place search ("Kigali Heights")

Your `MapsPort.autocomplete()` already exists with a Google adapter; it only needs a controller. Keeping it server-side keeps the Google key off phones.

- **Auth:** required.
- **Query:** `q` (string, min 2 chars), optional `lat` + `lng` to bias results around the rider.
- **Returns:** up to ~8 results.

```json
[
  {
    "placeId": "ChIJ…",
    "label": "Kigali Heights",
    "secondary": "KG 7 Ave, Kimihurura",
    "coords": { "lat": -1.9531, "lng": 30.0927 }
  }
]
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `placeId` | string | yes | Passed to 1.3 when `coords` is missing |
| `label` | string | yes | Main line; also sent as `pickupName` / `destinationName` on the booking |
| `secondary` | string \| null | no | Grey second line (street / area) |
| `coords` | `{ lat, lng }` \| null | no | Include if you have it; saves the app a details call |

- Restrict to Rwanda (Google `components=country:rw`) and bias to Kigali.
- The app debounces typing by 300 ms.
- If it returns 404, the app searches its built-in Kigali list instead.

### 1.3 `GET /places/:placeId` — coordinates for a chosen result

Maps to `MapsPort.placeDetails()`.

- **Auth:** required.
- **Returns:**

```json
{ "placeId": "ChIJ…", "label": "Kigali Heights", "secondary": "KG 7 Ave, Kimihurura", "coords": { "lat": -1.9531, "lng": 30.0927 } }
```

`coords` is **required** here.

### 1.4 `GET /places/reverse` — name a GPS position

Needed because the pickup defaults to the rider's GPS position, and today the app has no way to turn coordinates into an address. The booking is created with `pickupName: "Current location"`, which is meaningless to the driver.

- **Auth:** required.
- **Query:** `lat`, `lng`.
- **Returns:**

```json
{ "label": "KG 9 Ave, Nyarutarama", "secondary": "Gasabo, Kigali", "coords": { "lat": -1.9441, "lng": 30.0619 } }
```

- The app will call this when it gets a GPS fix and use `label` as `pickupName`.
- *Alternative:* if `pickupName` is "Current location", the bookings service could reverse-geocode `pickupLat`/`pickupLng` itself and store the address. Either works; tell me which so the app matches.

---

## Part 2 — Changes to existing endpoints

### 2.1 `POST /auth/register` — say whether this is a driver

Today every registration creates a `CUSTOMER` and nothing else. Right after a driver signs up, `GET /onboarding/state` returns `journey: "customer"`, `nextStep: "register_vehicle"`. The app works around this by remembering the portal on the device, but on a new device, or for an admin looking at the account, a driver applicant looks like a rider.

**Add an optional field:**

```json
{
  "displayName": "Eric Habimana",
  "email": "eric@example.com",
  "phone": "+250788123499",
  "password": "at-least-10-chars",
  "accountType": "driver"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `accountType` | `"rider"` \| `"driver"` | no, default `"rider"` | |

**Behaviour for `"driver"`:**
- Still create the user with role `CUSTOMER`. The `DRIVER` role must still only come from admin approval (ADR-0020); this changes nothing about who may drive.
- Create a `DriverProfile` with status `PENDING` (no application yet). Then `GET /onboarding/state` returns `journey: "driver"` and `nextStep: "submit_driver_application"` from the first moment.
- `POST /drivers/applications` must accept a profile created this way.

The app will send `accountType` from the "I'm a driver" / "I'm booking rides" choice.

### 2.2 Booking detail — include the assigned driver *(already written)*

The app shows the driver's name and a call button. This change is **already in your `dri-backend` working tree** (uncommitted): `src/bookings/bookings.service.ts` +12 lines and `test/bookings-dispatch.e2e-spec.ts` +9 lines. All 244 unit and 117 e2e tests passed with it. Please review and commit.

Added to every booking response (`POST /bookings`, `GET /bookings/:id`, confirm, cancel, offer accept):

```json
"driver": { "id": "6f81…", "displayName": "Demo Driver Bosco", "phone": "+250788222001" }
```

`null` until a driver is assigned.

### 2.3 Scheduled rides — honour `startAt`

`POST /bookings` accepts and stores `startAt`, but `POST /bookings/:id/confirm` always starts the search immediately. A ride scheduled for tomorrow 07:30 gets dispatched now. Your config already describes the intended behaviour (`BOOKING_DISPATCH_LEAD_SECONDS`, ADR-0026); it isn't implemented.

**What the app sends** (only for scheduled rides):

```json
{ "startAt": "2026-10-23T05:30:00.000Z", "durationHours": 3 }
```

**Needed:**
1. New `BookingStatus` value `SCHEDULED`. On confirm, if `startAt` is further away than the lead time, go to `SCHEDULED` instead of `SEARCHING`.
2. A delayed job moves it to `SEARCHING` at `startAt − BOOKING_DISPATCH_LEAD_SECONDS`.
3. Validation: reject `startAt` in the past or less than ~30 min ahead (the app enforces 30 min) and more than 7 days ahead (the app's date picker range). Return 400 with a readable message.
4. `POST /bookings/:id/cancel` must work while `SCHEDULED`.
5. Emit `booking.status_changed` on `SCHEDULED → SEARCHING`.
6. Return `startAt` and `durationHours` in booking responses (already returned; keep them).

The app already handles `SCHEDULED`: status label, "Pick-up Tomorrow, 07:30" line, cancel button.

### 2.4 `POST /quotes` — price Private Driver by the hour

The app asks "How long?" (1–24 h) for Private Driver and sends `durationHours` on the **booking**, but the **quote** never sees it. The price shown and paid is base + distance regardless of hours.

**Add to the quote request:**

```json
{
  "serviceCode": "PRIVATE_DRIVER",
  "origin": { "lat": -1.9441, "lng": 30.0619 },
  "destination": { "lat": -1.9531, "lng": 30.0927 },
  "durationHours": 3
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `durationHours` | integer 1–24 | for `PRIVATE_DRIVER` | Ignored for `BOB_NIGHT` |

- Pricing rule needs an hourly component (e.g. `perHourAmount`); this is a product decision.
- Pin `durationHours` on the quote, and reject a booking whose `durationHours` differs from its quote.
- *Optional:* `startAt` on the quote, if night rates should apply to scheduled `BOB_NIGHT` rides. Today a `BOB_NIGHT` quote requested at 2 pm for a 10 pm pickup is judged by the request time.

### 2.5 Trip detail for the driver — pickup and rider contact

Bookings are customer-scoped, so a driver only sees pickup details in the response to `POST /drivers/offers/:id/accept`. The app caches that on the device. After a reinstall or on another phone, the driver's trip screen has no pickup address, and the driver has no way to call the rider.

**Add to `GET /trips/:tripId` and each item of `GET /trips/active`, when the caller is the assigned driver:**

```json
{
  "id": "e608…",
  "bookingId": "84d4…",
  "status": "DRIVER_EN_ROUTE",
  "booking": {
    "serviceCode": "PRIVATE_DRIVER",
    "pickupName": "Kacyiru",
    "pickupLat": -1.9441,
    "pickupLng": 30.0619,
    "destinationName": "Kigali Heights",
    "vehiclePlate": "RAD123C",
    "vehicleTransmission": "AUTOMATIC",
    "amount": "25000",
    "currency": "RWF",
    "startAt": null,
    "durationHours": null
  },
  "customer": { "displayName": "Aline", "phone": "+250788111001" }
}
```

- Only show `customer.phone` while the trip is active (not `COMPLETED`/`CANCELLED`).
- The app reads `pickupName`, `pickupLat/Lng` (for the "Navigate" button), `destinationName`, `vehiclePlate`, `vehicleTransmission`, `amount`, `serviceCode`.

### 2.6 Payments — let the app find a booking's payment

There's no payment list, so the app saves the `paymentId` from `POST /payments` on the device to resume "waiting for MoMo approval". Reinstall or a second phone loses it.

**Pick one:**
- **(preferred)** Add `payment` to booking detail: `"payment": { "id": "6d60…", "status": "PENDING_PROVIDER", "settlement": "UNSETTLED" }`, latest attempt or `null`.
- or `GET /payments?bookingId=…` returning the attempts newest first.

Also: make `POST /payments` **idempotent** while an attempt is pending (return the existing attempt instead of a 409 or a second MoMo request), since the app may retry.

### 2.7 `GET /bookings` — richer summary *(optional)*

Each item today is `{ id, status, pickupName, createdAt }`. The home screen then calls `GET /bookings/:id` for the open one. Adding these lets it skip that call:

`serviceCode`, `amount`, `currency`, `destinationName`, `startAt`, `tripStatus`, `driver` (as in 2.2).

### 2.8 `GET /drivers/registration-fee` with no attempt *(optional)*

Returns HTTP 200 with an **empty body**. The app handles it, but standard clients don't. Return `null` as JSON, or 404.

---

## Part 3 — Configuration

| # | Setting | Why |
|---|---|---|
| 3.1 | `MAPS_PROVIDER=google` in your backend `.env` (currently `mock`) | With `mock`, quotes are priced from 0 km. A Kacyiru → Nyarutarama quote returned base fare only (`distance: "0"`, `routeSimulated: true`) |
| 3.2 | A reachable production URL | `fly.toml` names `getdri-backend-vmxucq-billowing-wildflower-380`; `https://getdri-backend-vmxucq-billowing-wildflower-380.fly.dev` did not resolve. The app needs it as `EXPO_PUBLIC_API_URL` |
| 3.3 | `CORS_ORIGINS` | Only matters for the web preview; native apps aren't affected |
| 3.4 | Payment provider (not mock) in production | The mock never settles on its own (it needs a signed webhook), so trips stay "Payment due" |

---

## Part 4 — Existing endpoints the app uses as-is

No change needed. Listed with the fields the app depends on, so they aren't removed or renamed by accident.

### Auth

| Endpoint | Sends | Reads |
|---|---|---|
| `POST /auth/register` | `displayName`, `email`, `phone` (E.164 `+250…`), `password` (10–200) | `retryAfterSeconds`, `devCode` (dev builds only) |
| `POST /auth/register/verify` | `email`, `code` | `user`, `tokens.accessToken`, `tokens.refreshToken` |
| `POST /auth/verification/request` | `email` | `retryAfterSeconds`, `devCode` |
| `POST /auth/login` | `email`, `password` | `user`, `tokens` |
| `POST /auth/password-reset/request` | `email` | `devCode` |
| `POST /auth/password-reset/confirm` | `email`, `code`, `password` | `user`, `tokens` |
| `POST /auth/refresh` | `refreshToken` | `tokens` (both rotated; the app stores the new pair immediately) |
| `POST /auth/logout` | `refreshToken` | — |
| `GET /auth/me` | — | `id`, `email`, `phone`, `role`, `status`, `displayName` |

Note: `docs/api-integration.md` says `tokens` includes `expiresIn`; the API doesn't return it. The app doesn't need it (it refreshes on 401), so just fix the doc.

### Onboarding

`GET /onboarding/state` — the app reads `journey`, `driver.applicationStatus`, `driver.missingDocs`, `driver.canWork`, `driver.decisionReason`.

### Vehicles

| Endpoint | Sends | Reads |
|---|---|---|
| `GET /vehicles` | — | `id`, `plate`, `make`, `model`, `transmission` |
| `POST /vehicles` | `plate`, `transmission`, optional `make`/`model` | `id` (on 409 "plate exists", the app re-reads the list and uses the matching plate) |

### Quotes and bookings

| Endpoint | Sends | Reads |
|---|---|---|
| `POST /quotes` | `serviceCode`, `origin {lat,lng}`, `destination {lat,lng}` (+ `durationHours`, see 2.4) | `id`, `amount`, `expiresAt` |
| `POST /bookings` | `quoteId`, `vehicleId`, `pickupName`, `pickupLat`, `pickupLng`, `destinationName`, `destinationLat`, `destinationLng`, optional `startAt`, `durationHours` | `id` |
| `POST /bookings/:id/confirm` | — | — |
| `POST /bookings/:id/cancel` | `{}` | — |
| `GET /bookings` | — | `id`, `status` |
| `GET /bookings/:id` | — | `id`, `status`, `serviceCode`, `vehiclePlate`, `tripId`, `tripStatus`, `amount`, `pickupName`, `destinationName`, `startAt`, `durationHours`, `driver`, `cancelReason` |

### Trips

| Endpoint | Who | Sends / reads |
|---|---|---|
| `GET /trips/:id` | driver | reads `status` |
| `GET /trips/active` | driver | reads `id`, `status` |
| `POST /trips/:id/en-route`, `/arrived`, `/complete` | driver | — |
| `POST /trips/:id/start` | driver | sends `code` (6 digits from the rider) |
| `POST /trips/:id/locations` | driver | sends `samples: [{ lat, lng, sampledAt }]`, one every 20 s while `IN_PROGRESS` |
| `POST /trips/:id/pickup-code` | rider | reads `code`; drawn when the trip is `ARRIVED` |
| `POST /trips/:id/cancel` | rider | `{}` |

### Payments

| Endpoint | Sends | Reads |
|---|---|---|
| `POST /payments` | `bookingId` | `id`, `status`, `settlement` |
| `GET /payments/:id` | — | `status` (`FAILED` ends the wait), `settlement` (`SETTLED` = paid); polled every 3 s |

### Driver onboarding and work

| Endpoint | Sends | Reads |
|---|---|---|
| `GET /drivers/applications` | — | `id`, `status`, `decidedAt`, `documents[].docType` |
| `POST /drivers/applications` | `legalName`, `licenseNumber`, `nationalIdNumber` (16 digits), `licenseExpiry` (`YYYY-MM-DD`), `yearsDriving`, `languages[]`, optional `addressNote`, `drivesManual` | `id`, `status` |
| `POST /drivers/applications/:id/documents` | multipart: `docType` (`NATIONAL_ID`, `DRIVERS_LICENSE`, `PROFILE_PHOTO`), `file` (JPEG/PNG) | — |
| `POST /drivers/registration-fee` | `phone` (E.164) | `id`, `status`, `settlement`, `paid`, `amount` |
| `GET /drivers/registration-fee` | — | same as above |
| `PATCH /drivers/location` | `lat`, `lng`, `available` — every 15 s while online; one `available: false` when going offline | — |
| `GET /drivers/offers` | — | `id`, `status`, `expiresAt`, `booking.pickupName`, `booking.vehicleTransmission`, `booking.serviceType.{code,name}` |
| `POST /drivers/offers/:id/accept` | — | full booking (cached on the device for the trip screen until 2.5 lands) |
| `POST /drivers/offers/:id/decline` | — | — |

Defined in the app but not called by any screen right now: `GET /catalog/services`, `PATCH /auth/me/profile`.

---

## Part 5 — Realtime (`/realtime` socket)

The app connects with `auth: { token }`, waits for `authenticated`, rejoins rooms after every reconnect, and treats every event as "refetch over REST". It also polls as a fallback.

| Room the app joins | Events it listens to |
|---|---|
| `booking:<id>` (rider) | `booking.status_changed`, `booking.driver_assigned` |
| `trip:<id>` (rider and driver) | `trip.driver_en_route`, `trip.driver_arrived`, `trip.started`, `trip.completed`, `trip.pickup_code_rotated` |
| own `user:<id>` (automatic) | `dispatch.offer`, `dispatch.offer_withdrawn` (driver) |

With 2.3, also emit `booking.status_changed` for `SCHEDULED → SEARCHING`.

---

## Part 6 — Later / nice to have

| What | Why |
|---|---|
| Push notifications (`POST /devices` already exists) | Drivers with the app in the background miss offers (they expire in ~30 s). Needs `expo-notifications` and an EAS project in the app |
| Ratings (`POST /trips/:id/rating`, rating on driver summary) | Nothing exists in the backend; the app doesn't show ratings |
| Vehicle delete (`DELETE /vehicles/:id`) | Riders can't remove an old car |
| Driver earnings (`GET /drivers/earnings?period=day\|week`) | The driver home has no earnings section until this exists |
| Trip history for riders and drivers | Only the current trip is visible today |
