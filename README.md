# Ride Sharing

A full-stack ride-sharing web application for passengers, approved drivers, and verified organizations.

New accounts choose one of three public roles at registration. Existing records with the legacy `user` role remain supported as passenger accounts; an already-approved legacy driver application can continue to grant driver access.

## Features

### Authentication & Authorization

* User registration and login
* JWT-based authentication
* Bearer tokens held in browser `sessionStorage` by the frontend
* Role- and approval-based access control
* Protected routes for authenticated users

### Passenger

Passengers can:

* View a passenger dashboard with booking, trip, review, and notification summaries
* Search for available rides
* View ride and driver details
* Book available seats
* Cancel bookings
* Filter, search, and page through their booking history
* Track a ride after the driver starts sharing live location
* Review drivers after eligible rides are completed

### Driver

Driver registration collects:

* Driving license number
* Vehicle number
* Vehicle type
* Other required application information

Driver registration creates the existing `DriverApplication` approval record with `pending` status. Identity verification remains a separate status.

Possible application statuses:

* `pending`
* `approved`
* `rejected`

Only accounts with role `driver` (or compatible legacy `user` accounts that already have an approved application) and an approved driver application can create and manage rides. New passenger accounts cannot apply for driver access through passenger APIs or navigation. Legacy `user` accounts without an existing application cannot start a driver application; rejected legacy applications can still be resubmitted.

Drivers can:

* Create rides
* Specify available seats
* Manage their rides
* Manage seat availability
* Handle bookings for their rides

Approved drivers can explicitly start rides and share live location with confirmed passengers.

### Organization

Colleges, universities, companies, and institutions can register a distinct Organization account. The account is linked to an Organization record with an independent `approvalStatus` (`pending`, `approved`, or `rejected`). Organization approval does not grant administrator permissions. A SuperAdmin must separately assign an existing `organizationAdmin` account to the organization; that assignment is audited and is the source of organization-scoped management access.

### Admin

Administrators use a role-scoped admin panel:

* `organizationAdmin` can review records and manage public member accounts in approved organizations assigned through `Organization.adminId`.
* `superAdmin` has platform-wide access, can create/update organizations, review organization verification, and assign audited account roles.
* Both can review driver and identity applications, monitor scoped rides/bookings/reports/reviews, view analytics, and inspect audit history.

Admin access is verified by backend JWT middleware; frontend navigation and route guards are not the authorization boundary.

## How the Application Works

```text
Account
 │
 ├── Register / Login
 │
 ├── Passenger account
 │    ├── Search rides
 │    ├── View ride details
 │    ├── Book seat
 │    └── Cancel booking
 │
 ├── Driver account
      ├── Driver application created at registration
      ├── Admin reviews application
      │
      ├── Approved
      │     ├── Create ride
      │     ├── Manage ride
      │     └── Manage available seats
      │
      └── Rejected / pending: driver status page only
 └── Organization account
      ├── Email OTP verification
      ├── Organization verification review
      └── Admin permissions assigned separately by SuperAdmin
```

## Tech Stack

### Frontend

* React
* Vite
* JavaScript
* REST API integration

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Bearer JWT authentication
* RESTful APIs
* MVC architecture

### Development Tools

* Git
* GitHub
* VS Code
* npm

## Frontend Application

The React/Vite frontend provides separate passenger, driver, and organization status workspaces, map-based ride search, booking history, driver profiles and reviews, admin review, notifications, ratings, and authorized live tracking. Its authenticated shared layout includes a responsive role-aware footer; full-screen tracking and public authentication screens omit it. It uses a shared Axios client, React Router, the existing Socket.IO server, and Leaflet/OpenStreetMap. Use Node.js `^20.19.0` or `>=22.12.0`; run `npm install` and `npm run dev` from `frontend`.

Copy `frontend/.env.example` to `frontend/.env` and set:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL, including `/api` |
| `VITE_SOCKET_URL` | Existing backend Socket.IO server URL |
| `VITE_MAP_TILE_URL` | Optional OpenStreetMap street-tile template; Esri World Imagery is the default layer |

The login token is held in `sessionStorage` and sent as a bearer token; passwords are not persisted. Logout calls the backend to revoke the current token before clearing local state. Only non-secret public URLs belong in `VITE_*` variables. The default OpenStreetMap tile provider receives map-tile requests; deploy with a suitable self-hosted/provider tile URL if your location-privacy or usage requirements need it.

The shared location picker uses OpenStreetMap Nominatim through the backend for place search and reverse geocoding. Suggestions are fetched only after a user submits a search; type-ahead autocomplete is disabled because the public Nominatim service [prohibits it](https://operations.osmfoundation.org/policies/nominatim/). Repeated search submissions are debounced, map-selected points and browser geolocation are reverse-geocoded before they can be confirmed, and provider requests are cached and spaced. Search text and chosen coordinates are sent to Nominatim; do not enter sensitive addresses. OpenStreetMap attribution is shown on the map. Browser location access is requested only after the user selects **Use my current location**. Live ride tracking remains a separate GPS workflow. The profile supports one saved home location; a separate saved-address book is not implemented.

Passenger and driver registration use the public organization directory and accept minimal identity verification metadata. Driver signup creates the application in the existing approval workflow. Organization signup captures contact details, address, website, and registration reference, then waits for SuperAdmin review; its contact email is not automatically trusted as an institutional domain. Identity document upload is not implemented; only a legal name, document type, and last four characters are accepted. Do not send full identity numbers or document images.

Account settings use the existing authenticated password-change API, and help content respects account roles. The language option remains English-only; privacy content is a review draft; referral generation, contact-message submission, and self-service account deletion are unavailable until supported backend integrations exist.

## Phase 1: Roles, Driver Eligibility, and Identity Verification

Public `User.role` values are `passenger`, `driver`, and `organization`. Internal roles are `organizationAdmin` and `superAdmin`; public registration rejects them. Existing `user` records are preserved as legacy passenger-compatible accounts. Email verification, identity verification, driver application approval, and organization approval are independent states; one approval never implies another.

| Role/state | Passenger features | Driver features | Organization management | Platform admin |
| --- | --- | --- | --- | --- |
| `passenger` | Yes | No | No | No |
| `driver`, application pending/rejected | No | Status page only | No | No |
| `driver`, application approved | No | Yes | No | No |
| `organization`, approval pending/rejected | No | No | Status/profile only | No |
| `organization`, approved | No | No; approval alone is not admin permission | No until an admin is separately assigned | No |
| `organizationAdmin` | No | No | Only approved assigned organization(s) | No |
| `superAdmin` | No | No | Platform-wide review and explicit role/org assignments | Yes |
| legacy `user` | Passenger-compatible | Only if legacy application approved | No | No |

Frontend route guards and navigation improve usability; backend APIs independently check the authenticated role, resource ownership, organization assignment, and approved driver application. Organization-admin scope is derived from `Organization.adminId`, never request data, and pending/rejected organizations are excluded from admin scope. Organization approval never auto-assigns an admin. Profile updates do not accept role changes; SuperAdmin role changes require a reason and create an audit record. Assign an organization admin by assigning an existing `organizationAdmin` account to an approved organization.

### Registration, approval, and role administration

`POST /api/auth/register` accepts `role: passenger|driver|organization`; `organizationAdmin` and `superAdmin` cannot be self-selected. Passenger/driver registration requires an active, approved organization and an email domain separately verified for that organization. Organizations whose domain status is pending remain listed, but registration is clearly rejected until a SuperAdmin verifies a domain. Common personal email providers cannot be used as institutional domains. Driver signup creates a pending `DriverApplication`; passenger/driver identity metadata is stored pending separate review. Organization signup creates a pending Organization record with no trusted email domains. All account types use the existing email OTP flow.

Organization approval is reviewed by a SuperAdmin by editing `approvalStatus` and `approvalReason` through `PATCH /api/admin/organizations/:organizationId`; rejecting requires a reason. Official email domains are approved separately through the dedicated, audited domain-verification workflow. The organization update endpoint assigns/unassigns `adminId` but does not accept `allowedDomains`; this prevents bypassing domain review. A SuperAdmin can change account roles through `PATCH /api/admin/users/:userId/role` with `{ "role": "...", "reason": "..." }`; self-role changes are rejected, and an organization account cannot be converted into an organization-admin account. Assigning `driver` additionally requires an existing driver application.

### Driver application status

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/driver-applications/me` | Driver account or compatible legacy account; caller's latest application |
| `POST` | `/api/driver-applications/apply` | Driver account; a legacy `user` account may only resubmit an existing rejected application |
| `GET` | `/api/rides/my-rides` | Authenticated approved driver |
| `GET` | `/api/bookings/driver-bookings` | Authenticated approved driver |
| `GET` | `/api/admin/driver-applications/pending` | Organization admin (scoped) or SuperAdmin |
| `PATCH` | `/api/admin/driver-applications/:applicationId/review` | Authorized organization admin or SuperAdmin |

`GET /api/driver-applications/me` returns `{ "success": true, "application": null }` when the user has not applied. Otherwise the application includes its ID, caller user ID, status, vehicle data, dates, rejection reason, and a masked license number (last four only). Application submission accepts `licenseNumber`, `vehicleNumber`, and `vehicleType`; identity/status fields are rejected. Only the latest rejected application can be resubmitted. Pending and approved applications cannot be resubmitted.

```http
POST /api/driver-applications/apply
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "licenseNumber": "LICENSE-ABC1234",
  "vehicleNumber": "CAR-123",
  "vehicleType": "car"
}
```

License numbers must be 2–120 characters, vehicle numbers 2–30 characters, and vehicle type is `car` or `bike`. A pending application or an already approved application returns `409 Conflict`.

```http
GET /api/driver-applications/me
Authorization: Bearer <JWT>
```

```json
{
  "success": true,
  "application": {
    "id": "65a1234567890abcdef12345",
    "userId": "65a1234567890abcdef67890",
    "licenseNumber": "****1234",
    "vehicleNumber": "CAR-123",
    "vehicleType": "car",
    "status": "rejected",
    "rejectionReason": "Please correct the vehicle details.",
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-02T10:00:00.000Z"
  }
}
```

Admin rejection requires a `rejectionReason` between 5 and 500 characters. Example:

```http
PATCH /api/admin/driver-applications/65a1234567890abcdef12345/review
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json
```

```json
{
  "status": "rejected",
  "rejectionReason": "Please provide a clearer vehicle registration."
}
```

### Separate identity verification

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/identity-verifications/me` | Authenticated; caller's status only |
| `POST` | `/api/identity-verifications/submit` | Authenticated; new or rejected submission |
| `GET` | `/api/admin/identity-verifications/pending` | Organization admin (scoped) or SuperAdmin |
| `PATCH` | `/api/admin/identity-verifications/:verificationId/review` | Authorized organization admin or SuperAdmin; cannot review self |

The user status is `not_submitted`, `pending`, `verified`, or `rejected`. Submit only metadata, never a full ID number or document:

```http
POST /api/identity-verifications/submit
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "legalName": "Example Person",
  "documentType": "passport",
  "documentLast4": "A123"
}
```

`documentType` must be `passport`, `national_id`, or `driver_license`; `documentLast4` must contain exactly four alphanumeric characters. A pending submission cannot be changed; a rejected submission may be resubmitted, and a verified account cannot resubmit. The admin queue exposes only the legal name, document type, last four characters, user contact/organization, and submission date. Admin rejection requires a reason between 5 and 500 characters:

```http
PATCH /api/admin/identity-verifications/65a1234567890abcdef12345/review
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json
```

```json
{
  "status": "rejected",
  "rejectionReason": "The submitted name does not match the account."
}
```

The repository has no identity-document upload/storage integration. This phase therefore implements a limited manual-review metadata workflow, not proof-of-identity document inspection. The User record stores only submitted metadata and the latest review status/reason/time/reviewer; it does not preserve a multi-entry review history. A production identity proof workflow should add private encrypted object storage and a dedicated audit/history model before collecting documents.

Run backend regression and Phase 1 tests with `cd backend && npm test`; build the frontend with `cd frontend && npm run build`.

## Phase 2: Admin Panel

The admin panel separates platform-wide SuperAdmin operations from organization-scoped administration. Every endpoint below requires `Authorization: Bearer <ADMIN_JWT>`, except organization creation/update and role assignment, which require a `superAdmin` token. Organization admins can only access users, applications, rides, bookings, reports, reviews, and logs in approved organizations assigned to their account. Organization admins can activate/deactivate public member accounts only; they cannot change roles, their own status, or manage another administrator.

| Method | Endpoint | Purpose / access |
| --- | --- | --- |
| `GET` | `/api/admin/dashboard/stats` | Live counts and received-rating average; scoped |
| `GET` | `/api/admin/analytics` | Monthly registration, ride, booking and organization activity; scoped |
| `GET` | `/api/admin/users` | Search/filter/paginate users; scoped |
| `GET` | `/api/admin/users/:userId` | Scoped user details; excludes credentials and identity-document data |
| `PATCH` | `/api/admin/users/:userId/status` | Activate/deactivate with a required reason; transactionally audited |
| `PATCH` | `/api/admin/users/:userId/role` | Assign a role with a required reason; SuperAdmin only, transactionally audited |
| `GET` | `/api/admin/organizations` | List organizations in scope |
| `GET` | `/api/admin/organizations/:organizationId` | Organization details in scope |
| `POST` | `/api/admin/organizations` | Create organization; SuperAdmin only |
| `PATCH` | `/api/admin/organizations/:organizationId` | Update organization details, approval status, and admin assignment; SuperAdmin only |
| `PATCH` | `/api/admin/organizations/:organizationId/domain-verification` | Approve a unique institutional email domain with an evidence note; SuperAdmin only |
| `GET` | `/api/admin/driver-applications?status=pending&page=1&limit=20` | Filtered driver application queue |
| `GET` | `/api/admin/identity-verifications?status=pending&page=1&limit=20` | Filtered identity verification queue |
| `GET` | `/api/admin/rides` | Ride monitoring; optional `status`, `from`, `to`, `page`, `limit` |
| `GET` | `/api/admin/bookings` | Booking monitoring; optional `status`, `page`, `limit` |
| `GET` | `/api/admin/reports` | Scoped reports; optional `status`, `page`, `limit` |
| `PATCH` | `/api/admin/reports/:reportId` | Set status to `reviewed`, `resolved`, or `rejected`; reason required |
| `GET` | `/api/admin/ratings` | Scoped ratings; optional `rating`, `page`, `limit` |
| `GET` | `/api/admin/audit-logs` | Read-only scoped audit log; optional `entityType`, `page`, `limit` |
| `POST` | `/api/reports` | Authenticated participant submits a report against their booking |

List endpoints accept `page` (default `1`) and `limit` (default `20`, maximum `100`). User filters include `search`, `organizationId` (SuperAdmin), `role`, `verificationStatus`, and `isActive`. Organization filters include `search` and `isActive`. Invalid IDs, filters, pagination, or request fields return `400`; unauthenticated requests return `401`; role/scope violations return `403`; missing records return `404`; stale state transitions return `409`.

Example user deactivation request (the same shape activates by setting `isActive` to `true`):

```http
PATCH /api/admin/users/65a1234567890abcdef12345/status
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json
```

```json
{
  "isActive": false,
  "reason": "Repeated safety complaints"
}
```

Success response:

```json
{
  "success": true,
  "message": "User account deactivated",
  "user": {
    "_id": "65a1234567890abcdef12345",
    "isActive": false,
    "role": "user"
  }
}
```

Example participant report:

```http
POST /api/reports
Authorization: Bearer <USER_JWT>
Content-Type: application/json
```

```json
{
  "bookingId": "65a1234567890abcdef12345",
  "type": "safety",
  "description": "Unsafe behavior during this ride."
}
```

The `type` must be `safety`, `behavior`, `payment`, or `other`; the description must contain 10–5000 characters. The authenticated user must be the booking passenger or that ride's driver. The server derives the reporter from the token; caller-supplied user IDs are rejected.

Example dashboard response:

```json
{
  "success": true,
  "scope": "organization",
  "stats": {
    "totalUsers": 120,
    "verifiedUsers": 42,
    "driverApplications": 15,
    "identityVerifications": 20,
    "organizations": 1,
    "rides": 57,
    "bookings": 93,
    "ratings": 28,
    "averageRating": 4.46
  }
}
```

Sensitive user activation, organization changes, driver application decisions, identity verification decisions, and report reviews write an audit entry in the same MongoDB transaction as the state change. MongoDB must support transactions (replica set or sharded deployment); if the audit write fails, the associated state change is rolled back. Audit logs include administrator, organization scope, action, entity, status transition, reason when supplied, and timestamp. Organization activity scopes bookings and rides to organization members. Admin list responses expose only the fields needed for administration; identity queues continue to show only the submitted legal name, document type, and last four characters.

**Postman checks**

1. Authenticate as an organization admin and request `/api/admin/dashboard/stats`; verify totals are limited to its assigned organization. Repeat with an unassigned organization or a different organization ID; expect `403`.
2. Register a public organization and verify it starts pending with no admin assignment. As SuperAdmin, approve it through `PATCH /api/admin/organizations/:organizationId`, then separately assign an existing `organizationAdmin` account. An organization-admin token must receive `403` for either mutation.
3. Search and paginate `/api/admin/users`, then deactivate an in-scope regular account with a 5–500 character reason. Verify the account cannot log in or use protected APIs. Attempt self-deactivation and cross-organization deactivation; expect `403`.
4. Review driver and identity queues using `status` and pagination, then approve/reject through the existing review endpoints. Confirm each decision appears in `/api/admin/audit-logs` and never changes the other workflow's status.
5. Submit a report as a booking passenger or ride driver. Submit the same request as an unrelated user; expect `403`. Review the report as an authorized admin and confirm the audit event is visible in that admin's scope.
6. Try an unauthenticated admin request (`401`), a passenger token (`403`), malformed IDs/filters (`400`), and a valid but inaccessible record (`403` or `404` as documented).

Run the backend regression and module tests with `cd backend && npm test`; create a production frontend bundle with `cd frontend && npm run build`. The automated tests use controller/middleware mocks and do not replace manual end-to-end testing against a transaction-enabled MongoDB deployment.

## Phase 4: Passenger Experience

The passenger workspace at `/app` is separate from `/driver/dashboard`; new passenger and driver accounts use separate role-specific layouts and routes. The passenger dashboard loads its statistics from MongoDB through `GET /api/bookings/passenger-dashboard` and shows recent bookings and notifications. It includes total, pending, and confirmed bookings; upcoming, active, and completed trips; cancelled/rejected outcomes; completed trips travelled; and the average score the user has given.

### Passenger APIs

All passenger endpoints require `Authorization: Bearer <USER_JWT>`. The backend rejects administrator roles for passenger search and booking operations. The authenticated user ID is taken from the JWT; request bodies cannot set passenger, driver, or final price.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/bookings/passenger-dashboard` | Authenticated passenger dashboard totals and five most recent bookings |
| `GET` | `/api/rides/search` | Search future, scheduled rides; caller's own rides are excluded |
| `GET` | `/api/rides/:rideId` | Ride details and public driver summary |
| `POST` | `/api/bookings` | Create a pending seat request |
| `GET` | `/api/bookings/my-bookings` | Search, filter, sort, and paginate only the caller's bookings |
| `GET` | `/api/bookings/:bookingId` | Booking details for its passenger or ride driver |
| `PATCH` | `/api/bookings/:bookingId/cancel` | Cancel the caller's pending or confirmed booking when the ride has not started |
| `GET` | `/api/notifications?page=1&limit=5` | Recent notifications belonging to the caller |
| `GET` | `/api/rides/:rideId/tracking` | Latest unexpired location for an authorized ride participant |
| `GET` | `/api/ratings/user/:userId` | Driver rating summary and received reviews |
| `POST` | `/api/ratings` | Submit a review for an eligible completed booking |

Ride search query parameters include `pickupLng`, `pickupLat`, `dropLng`, `dropLat`, `departureDate`, `timezoneOffsetMinutes`, `seatsRequired`, `vehicleType`, `maxPrice`, `radiusKm`, `sort`, `page`, and `limit`. The passenger chooses pickup and destination through place search or the map; the interface does not ask users to type coordinates. Coordinates are passed internally and stored in GeoJSON order `[longitude, latitude]`. A date is interpreted in the selected browser timezone using `timezoneOffsetMinutes`. Sort values are `departure`, `price_asc`, `price_desc`, and `distance`; distance sorting requires a selected pickup. Search results are paginated (default 20, maximum 100), include only future scheduled rides with enough available seats, and include a public driver name, average rating, and rating count.

Example ride search:

```http
GET /api/rides/search?pickupLng=77.5946&pickupLat=12.9716&dropLng=77.60&dropLat=12.98&departureDate=2026-11-27&timezoneOffsetMinutes=-330&seatsRequired=1&vehicleType=car&maxPrice=500&radiusKm=10&sort=distance&page=1&limit=10
Authorization: Bearer <USER_JWT>
```

### Place search and location selection

The frontend's shared location picker calls these public, rate-limited backend endpoints. Both return `{ "success": true, ... }`; search returns up to five place suggestions with a readable name, full address, and coordinates in `[longitude, latitude]` order. Reverse geocoding returns one readable place for a point. Invalid query text or coordinate ranges return `400`; provider errors and rate limits return a clear service error instead of fabricated suggestions.

| Method | Endpoint | Query | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/geocoding/search?q=Kanpur%20Central` | `q`: 3–120 characters | Find place suggestions |
| `GET` | `/api/geocoding/reverse?lon=80.3319&lat=26.4499` | `lon`: -180–180; `lat`: -90–90 | Resolve a selected point to a readable place |

Requests are cached in-process for up to 24 hours, limited to 30 per client per minute, and outbound provider calls are serialized with at least 1.1 seconds between calls per backend process. For horizontally scaled deployments, use a shared cache and coordinate provider quotas across instances. Nominatim settings are `NOMINATIM_BASE_URL`, `NOMINATIM_USER_AGENT`, and optional `NOMINATIM_EMAIL`; set a descriptive application identifier and contact email according to the provider's current [usage policy](https://operations.osmfoundation.org/policies/nominatim/).

Ride creation accepts location names and addresses with numeric coordinates; the backend validates ranges and converts them to GeoJSON:

```json
{
  "pickupLocation": {
    "longitude": 80.3319,
    "latitude": 26.4499,
    "name": "Kanpur Central",
    "address": "Kanpur Central, Kanpur, Uttar Pradesh, India"
  },
  "dropLocation": {
    "longitude": 80.347,
    "latitude": 26.472,
    "name": "IIT Kanpur",
    "address": "IIT Kanpur, Kalyanpur, Kanpur, Uttar Pradesh, India"
  }
}
```

Existing GeoJSON ride-creation payloads and records remain supported. Profile home locations retain GeoJSON plus a readable name/address. Organization signup and SuperAdmin address editing store the resolved address string in the existing schema; organization coordinates are not persisted because the current Organization schema has no point field.

Booking creation accepts only `rideId` and `seatsBooked`. The server derives the passenger and calculates `totalPrice` from the ride's price; pending requests do not reserve seats. The driver's confirmation transaction conditionally decrements available seats, so simultaneous confirmations cannot overbook. An active booking for the same passenger and ride is unique. The passenger history accepts `status=all|upcoming|pending|confirmed|rejected|cancelled|completed`, `search` (booking ID, ride ID, or driver name), `sort=newest|oldest`, `page`, and `limit` (default 10, maximum 50). `upcoming` includes pending or confirmed bookings for future scheduled rides that have not started; `completed` is based on the associated ride status; `cancelled` includes cancelled bookings and bookings for cancelled rides.

Example booking request:

```http
POST /api/bookings
Authorization: Bearer <USER_JWT>
Content-Type: application/json
```

```json
{
  "rideId": "65a1234567890abcdef12345",
  "seatsBooked": 2
}
```

Expect `201` with the new booking ID, server-calculated total, and `pending` status. Invalid data returns `400`; own-ride, duplicate, unavailable, or stale requests return `403` or `409`. `PATCH /api/bookings/:bookingId/cancel` requires the booking passenger. Pending requests can be cancelled without changing seat totals; confirmed cancellations restore seats in a MongoDB transaction. Cancellation is blocked once the trip starts or completes. A ride cancelled before starting can still have its passenger booking cancelled.

### Live tracking and reviews

Passenger tracking is listed at `/live-tracking`; a ride's map is at `/rides/:rideId/tracking`. The page lists only the caller's confirmed bookings. The existing authenticated Socket.IO server is reused: passengers emit `tracking:join` and `tracking:leave` and receive `tracking:location` and `tracking:stopped`. Only the approved ride owner can emit `tracking:location:update`. Room membership, booking eligibility, and location expiry are enforced by the backend; stale locations are not displayed. Review/profile pages are available from a ride card at `/drivers/:userId/reviews`. The existing rating API enforces confirmed booking, completed ride, participant identity, integer rating values, and duplicate prevention; the frontend never submits reviewer or reviewee IDs.

### Passenger and role permission matrix

| Account | Search/book rides | View own booking history | Join eligible tracking | Review eligible completed rides | Driver tools |
| --- | --- | --- | --- | --- | --- |
| `passenger` | Yes | Yes | Confirmed bookings only | Yes | No |
| `driver`, pending/rejected application | No | No | No | No | Status page only |
| `driver`, approved application | No | No | Driver-owned tracking only | Yes, for eligible ride participation | Yes |
| `organization` | No | No | No | No | Organization verification/profile only |
| `organizationAdmin` | No passenger API access | No passenger API access | No | No | No |
| `superAdmin` | No passenger API access | No passenger API access | No | No | No |
| legacy `user` | Passenger-compatible | Passenger-compatible | Confirmed bookings only | Yes | Only with approved legacy application |

### Manual passenger testing

1. Start the backend with a transaction-capable MongoDB deployment and the frontend; register or sign in as a Passenger. Check `/app` for zero-safe dashboard statistics and empty states.
2. Open **Find rides**, search for pickup/drop places or choose them on the map, confirm both readable locations, set date/seats/vehicle/price/radius/sort, and search. Confirm the results exclude the signed-in user's rides, have enough seats, are scheduled and future, and show driver rating/count. Try clear, refresh, sorting, and pagination.
3. Open a ride, verify the driver profile/reviews link and seat-price breakdown, request seats, and confirm the response shows booking ID and `pending`. Attempt a duplicate request, own ride, invalid seat count, unavailable ride, and administrator token; expect the documented errors.
4. Open **My bookings**. Search by driver name/booking ID/ride ID; test each status filter, date sort, and pagination. Cancel a pending booking and confirm the UI refreshes. Confirm a booking as its driver and verify seat counts change only on the backend; cancel before start and verify seats are restored.
5. As the driver, start the confirmed ride and share location. As the passenger, open **Live tracking** and verify only that confirmed ride is listed, the map updates, and updates stop/expire when sharing stops or the ride completes. Try an unrelated passenger token against the tracking socket/REST endpoint and expect denial.
6. Complete the ride and submit a passenger review. Verify it appears in the driver's profile, the summary/distribution updates, and repeat submission is rejected. Try editing/deleting another user's review and verify denial.
7. Test a pending/rejected Driver (only the application status page is available), a Passenger (driver-application endpoints and driver pages are denied), an Organization account (organization verification status only), and an organization administrator (approved assigned scope only).

Run automated tests with `cd backend && npm test` and the frontend production build with `cd frontend && npm run build`. Automated controller/service tests do not replace the MongoDB, Socket.IO, browser-geolocation, or Postman checks above. Place search and reverse geocoding are provided by Nominatim as described above; payments are not implemented.

## Phase 5: Accounts, Organizations, Driver Rides, and Notifications

Phase 5 extends the existing authenticated ride and notification APIs. It does not create a second Socket.IO server or duplicate the SuperAdmin organization-management endpoints.

### Driver's My Rides

`GET /api/rides/my-rides` requires an authenticated user with an approved `DriverApplication`. The driver identity always comes from the JWT; unknown query parameters, including a caller-supplied driver ID, are rejected.

| Query | Values / default |
| --- | --- |
| `page` | Positive integer; default `1` |
| `limit` | `1`–`100`; default `20` |
| `status` | `all` (default), `scheduled`, `cancelled`, or `completed` |
| `departureFrom`, `departureTo` | Optional UTC date strings in `YYYY-MM-DD` form |
| `sort` | `departure_asc` (default), `departure_desc`, `created_asc`, or `created_desc` |

The response contains the paginated `rides`, `total`, `page`, `limit`, `totalPages`, aggregate ride `summary`, up to ten `activeRides`, and each page ride's pending/confirmed booking summary. Invalid filters return `400`; missing authentication returns `401`; an unapproved driver receives `403`.

```http
GET /api/rides/my-rides?status=scheduled&departureFrom=2026-11-01&page=1&limit=10&sort=departure_asc
Authorization: Bearer <DRIVER_JWT>
```

### Organization discovery and registration

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/organizations?q=example&type=company&page=1&limit=20` | Public; active, approved organizations only |
| `GET` | `/api/organizations/:organizationId` | Public; active, approved organization details only |
| `GET` | `/api/organizations/me` | Authenticated; organization derived from the caller |

The public list supports `q` (name, short name, or city), the supported organization types, `page`, and `limit` (maximum `100`). Results include organization name, city, and `domainVerificationStatus` (`verified` or `pending`) so registration can distinguish catalog listing from email-domain approval. Public records do not expose allowed/verified domain values or admin assignments. The `/me` endpoint derives the caller's organization and returns its verification state. It never accepts a user or organization ID to choose the caller's scope.

The initial Uttar Pradesh catalog is seeded with:

```powershell
cd backend
npm run seed:organizations
```

The script in `backend/scripts/seedOrganizations.js` is add-only and idempotent. It matches normalized organization name and city, preserves existing IDs, domain assignments, administrators, and user references, and fills only missing catalog metadata on matches. New catalog records are active/approved for discovery but have empty email-domain allowlists and pending domain verification, except KIT's explicitly specified `kit.ac.in` domain. Organization names and cities come from the requested initial catalog; their inclusion does not attest to current affiliation or accreditation.

To approve an organization's domain, a SuperAdmin must review official institutional evidence and submit an audit reason:

```http
PATCH /api/admin/organizations/:organizationId/domain-verification
Authorization: Bearer <SUPERADMIN_JWT>
Content-Type: application/json

{
  "domain": "example.ac.in",
  "reason": "Matched to the institution's official website contact domain."
}
```

The endpoint rejects common personal email providers and domains already associated with another organization. Only the SuperAdmin workflow can add a domain to the verified allowlist; domain evidence is reviewed manually outside the platform and recorded in the audit log.

### Logout, session revocation, and account settings

All account-management endpoints below require `Authorization: Bearer <USER_JWT>`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/logout` | Revoke this bearer token and disconnect its authenticated socket session; repeatable |
| `PATCH` | `/api/auth/profile` | Update only `name`, `phone`, and/or validated GeoJSON `homeLocation` |
| `PATCH` | `/api/auth/change-password` | Verify current password, set a strong new password, and invalidate older sessions |
| `POST` | `/api/auth/email-change` | Request a verification code for a new organization-approved email |
| `GET` | `/api/auth/email-change` | Read the caller's pending email request and expiry |
| `POST` | `/api/auth/email-change/confirm` | Confirm a six-digit code sent to the pending address |

Logout example:

```http
POST /api/auth/logout
Authorization: Bearer <USER_JWT>
```

```json
{ "success": true, "message": "Signed out successfully" }
```

Password-change example:

```http
PATCH /api/auth/change-password
Authorization: Bearer <USER_JWT>
Content-Type: application/json
```

```json
{
  "currentPassword": "Old-Password1!",
  "newPassword": "New-Password2!"
}
```

Passwords must be at least eight characters with uppercase, lowercase, a number, and a special character; the new password must differ from the current password. A successful password or email change returns a replacement token, increments the account authentication version, disconnects old user sockets, and invalidates earlier sessions. Logout stores only a hash of the token until its expiry; the revocation collection has a TTL index. Do not reuse the previous token after logout.

Email updates are not applied until an OTP sent to the new address is confirmed. The new address must be unique and satisfy the caller's organization's allowed-domain policy. OTPs are hashed before storage and are not returned by the API. Profile changes reject unknown fields, so clients cannot set roles, organization, password, or verification state through that endpoint.

### Notification delivery and preferences

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/notifications?page=1&limit=20&read=all&type=booking_confirmed` | List caller-owned notifications; supports read/type filters |
| `GET` | `/api/notifications/unread-count` | Caller-owned unread count |
| `PATCH` | `/api/notifications/:notificationId/read` | Mark one caller-owned notification read |
| `PATCH` | `/api/notifications/read-all` | Mark all caller-owned notifications read |
| `DELETE` | `/api/notifications/:notificationId` | Delete one caller-owned notification |

`read` accepts `all`, `read`, or `unread`; `type` must be a supported event type (booking, ride, driver application, identity verification, or account security). Pagination defaults to page `1` and limit `20` (maximum `100`). Every operation scopes to the authenticated recipient; an inaccessible notification is returned as `404`.

Notifications are persisted before the `notification:new` Socket.IO event is emitted. A unique event key prevents duplicate records when the same business event is retried. Socket authentication checks token expiry/revocation, account status, and authentication version; a socket joins only its own private user room and the existing authorized ride-tracking rooms. Booking/ride events target the relevant participants, while account-security events target the account holder.

This implementation does not include a transactional outbox. Notification creation occurs after the relevant business state change/transaction; a process failure between the state commit and notification persistence can delay or omit that notification. The persisted notification list is the durable in-app source when Socket.IO is unavailable, but the outbox limitation should be addressed before claiming guaranteed delivery for high-assurance use cases.

### Phase 5 manual checks and validation

1. Register using an active organization returned by `GET /api/organizations`; confirm the public response omits allowed domains and admin assignment data. Try invalid filters and inactive/unknown IDs.
2. Authenticate as an approved driver; request `GET /api/rides/my-rides` with each status/sort/date filter, then invalid filters and a forged `driverId`. Confirm only the token owner's rides are returned and pagination/booking summaries match the database.
3. Sign in, call `POST /api/auth/logout`, then retry a protected endpoint using the same bearer token; expect `401`. Repeat logout and confirm it remains successful. Verify that the token hash, not the raw token, is stored.
4. Update profile fields; attempt to submit `role`, `organization`, password, or verification fields and expect `400`. Change the password and email; confirm the old token stops working, the replacement token works, and the email remains unchanged until OTP confirmation.
5. Request notifications with read/type filters. Confirm unread counts, mark-read/delete behavior, and that another account cannot access a notification ID. Validate authorized socket delivery and tracking room access in an authenticated client.
6. Confirm notifications are created only after successful state changes, and exercise socket reconnect with stored notifications. For transactional paths, use a MongoDB replica set or sharded deployment.

Run all backend automated tests with `cd backend && npm test`; build the frontend with `cd frontend && npm run build`. Tests use controller/service/middleware mocks and do not replace live MongoDB, Postman, browser, or authenticated Socket.IO validation. MongoDB transactions require a replica set or sharded deployment.

## Phase 6: Quality and Production Readiness

The final audit added bounded JSON parsing, Helmet security headers, explicit API 404/error responses, a database-aware `/healthz` endpoint, production environment validation, CORS allowlisting, startup-after-database-connect behavior, and graceful Socket.IO shutdown. Development CORS permits local Vite origins; production requires explicit HTTPS origins in `CLIENT_URL`. `CLIENT_URL` accepts a comma-separated origin list without paths or wildcards. No deployment was performed.

JSON request bodies are limited to 1 MB. Malformed JSON returns `400`, oversized bodies return `413`, rejected browser origins return `403`, unknown `/api` routes return JSON `404`, and unexpected errors return a generic `500` without stack details. The backend disables `X-Powered-By`; Helmet adds standard security headers.

Registration and OTP verification/resend/change endpoints are limited to five requests per IP per 15 minutes; login allows five attempts per IP per five minutes. These limiters use the package's in-memory store, so production deployments with multiple backend instances should configure a shared rate-limit store and correct trusted-proxy settings.

### Backend environment setup

If you do not already have a local environment file, copy `backend/.env.example` to `backend/.env` and set values privately:

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | No | Set `production` for deployment |
| `PORT` | No | Defaults to `5000`; must be `1`-`65535` |
| `MONGO_URI` | Yes | MongoDB connection string; transactions require a replica set or sharded deployment |
| `JWT_SECRET` | Yes | In production, use a randomly generated secret of at least 32 characters |
| `CLIENT_URL` | Production | One or more HTTPS frontend origins, comma-separated |
| `EMAIL_USER` | Production | Gmail account used to send OTP messages |
| `EMAIL_PASS` | Production | Gmail App Password; never commit it |
| `NOMINATIM_BASE_URL` | No | Nominatim API base URL; defaults to the OpenStreetMap public service |
| `NOMINATIM_USER_AGENT` | Recommended | Descriptive application identifier sent with provider requests |
| `NOMINATIM_EMAIL` | No | Optional provider contact email; do not use a personal address without approval |

Use `frontend/.env.example` for `VITE_API_BASE_URL`, `VITE_SOCKET_URL`, and optional `VITE_MAP_TILE_URL`. Maps default to Esri World Imagery and provide an OpenStreetMap street-layer toggle; required tile attribution is displayed on the map. Before production deployment, review the [World Imagery service details](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9), [Esri's current terms](https://www.esri.com/en-us/legal/terms/full-master-agreement), and the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/). Public `VITE_` values must never contain secrets. Both `.env` files are ignored by Git; commit neither credentials nor real identity/user data. The example files contain placeholders, not deployable secrets.

### Run, health-check, and build

```powershell
if (!(Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
if (!(Test-Path frontend\.env)) { Copy-Item frontend\.env.example frontend\.env }
cd backend
npm install
npm run dev
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

The backend validates required configuration and connects to MongoDB before listening. `GET /healthz` returns `200` with database status when MongoDB is connected, otherwise `503`. Production start command is `npm start`; frontend production output is built with `npm run build` in `frontend`. Configure TLS/HTTPS, MongoDB network access, frontend API/socket URLs, `CLIENT_URL`, and SMTP secrets in the hosting provider. The frontend hosting provider must also supply document security headers (including a CSP compatible with the configured map/API/socket origins). Deployment and Atlas connectivity have not been tested here.

### Quality checks and measured responsive coverage

Run backend tests, both dependency audits, and the frontend build:

```powershell
cd backend
npm test
npm audit
cd ..\frontend
npm audit
npm run build
```

The automated backend suite covers controller/service/middleware behavior, including public-role registration, denied passenger-to-driver application access, organization approval scoping, audited role changes, and simulated concurrent final-seat confirmation. It does not replace transaction integration tests on MongoDB. The current task validation ran `npm test` successfully (74 tests) and `npm run build` successfully. No live browser session or production database was available.

### Audit findings and known limitations

* The production dependency audits were clean after updating the backend lockfile. The reviewed versions included Mongoose 9.13.1 and Nodemailer 10.6.1; the frontend audit reported no advisories.
* Identity verification collects limited metadata only; private document upload/storage and identity proof review are not implemented.
* The Organization dashboard currently supports profile/approval status and a real member count. Organization member search/invitations/requests, direct settings management, and organization-specific reporting pages are not implemented; assigned organization admins continue to use the existing scoped admin pages for available member, ride, booking, report, and analytics workflows.
* Notifications are persisted after the related business transaction, but there is no transactional outbox; guaranteed delivery across process failure is not provided.
* Real account workflows, organization isolation against a live database, transaction rollback/concurrency against MongoDB, Socket.IO reconnects, and deployment were not manually exercised. See the Phase 1–5 Postman steps above for repeatable test flows.
* Responsive browser checks covered the three unauthenticated auth pages only. Other page layouts were source-audited and production-built but not visually checked at each viewport.

## Project Structure

```text
ride-share/
│
├── frontend/
│   └── React + Vite application
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── models/
│   │   │   └── User.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

## Backend Architecture

The backend follows the **MVC (Model-View-Controller)** architecture.

### Model

Mongoose models define the structure of data stored in MongoDB.

Examples include:

* User
* Driver Application
* Ride
* Booking

### Controller

Controllers contain the application's business logic, such as:

* User registration and login
* Driver application handling
* Ride creation
* Ride searching
* Booking management

### Routes

Routes define the REST API endpoints and connect incoming requests to the appropriate controllers.

### Ride Management API

The general ride listing and ride details are public. The passenger ride-search endpoint requires an authenticated passenger or compatible legacy account. Creating a ride requires a driver account with an approved driver application. Only the ride owner can cancel, and cancellation is denied after a ride starts.

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/rides` | Authenticated, approved driver |
| `GET` | `/api/rides` | Public |
| `GET` | `/api/rides/search` | Authenticated passenger or compatible legacy account; excludes the caller's rides |
| `GET` | `/api/rides/:rideId` | Public |
| `PATCH` | `/api/rides/:rideId/cancel` | Authenticated ride driver |
| `POST` | `/api/rides/:rideId/start` | Authenticated, approved ride owner; requires a confirmed passenger |
| `POST` | `/api/rides/:rideId/tracking/start` | Authenticated, approved ride owner; resumes sharing on a started ride |
| `POST` | `/api/rides/:rideId/tracking/stop` | Authenticated, approved ride owner |
| `POST` | `/api/rides/:rideId/complete` | Authenticated, approved ride owner; ride must have started |
| `GET` | `/api/rides/:rideId/tracking` | Ride owner or passenger with a confirmed booking |

#### Live ride tracking

Ride creation does not start the ride. The approved ride owner explicitly starts it using `POST /api/rides/:rideId/start`; this sets `startedAt` and enables location sharing. A confirmed booking must exist before tracking can start. Stopping sharing does not complete the ride; the owner can resume sharing on a started ride with `POST /api/rides/:rideId/tracking/start`. Completing or cancelling the ride disables tracking and removes its latest location.

All REST requests below use `Authorization: Bearer <JWT>`. The tracking GET endpoint is protected and returns only the latest location to the ride owner or a passenger whose booking is confirmed. Ride listing and search APIs never return live coordinates.

Driver location updates use Socket.IO. Connect to the backend with the JWT in the Socket.IO auth payload:

```js
const socket = io("http://localhost:5000", {
  auth: { token: "<JWT>" }
});
```

| Socket event | Direction | Payload / behavior |
| --- | --- | --- |
| `tracking:join` | Client → server | `{ "rideId": "<ride id>" }`; allowed for the approved ride owner or a passenger with a confirmed booking. Acknowledges `{ success, location }` with the latest unexpired location if one exists. |
| `tracking:location:update` | Driver → server | `{ "rideId": "<ride id>", "latitude": 12.9716, "longitude": 77.5946, "timestamp": "2026-11-25T10:00:00.000Z" }`; only the approved owner of a started ride with sharing enabled can send it. |
| `tracking:location` | Server → authorized room | Latest validated coordinates and timestamp; emitted only after an authorized driver update. |
| `tracking:leave` | Client → server | `{ "rideId": "<ride id>" }`; leaves that socket's tracking room. |
| `tracking:stopped` | Server → tracking room | `{ "rideId": "<ride id>", "reason": "sharing_stopped" \| "ride_completed" \| "ride_cancelled" }`; members are removed from the room. |
| `tracking:error` | Server → client | Error result when a client omits the optional acknowledgement callback. |

Location updates must contain numeric latitude/longitude within geographic ranges and an ISO timestamp no more than five minutes old or 30 seconds in the future. Updates are limited to one every two seconds per ride. Only the latest precise location is stored; it expires after 90 seconds, and stopping/cancelling/completing a ride deletes it. A disconnected socket loses room membership and must re-authorize with `tracking:join` after reconnecting. Cancelling a confirmed booking removes that passenger's active sockets from the tracking room.

**Postman testing**

1. Start MongoDB and the backend (`cd backend`, then `npm run dev`). Log in as an approved driver and a passenger to obtain their JWTs.
2. Create a ride, create a passenger booking, and have the driver confirm the booking using the Booking API. Before starting the ride, `POST /api/rides/:rideId/tracking/start` and a passenger's `GET /api/rides/:rideId/tracking` should return `409`.
3. As the driver, send `POST /api/rides/:rideId/start`. Then connect in Postman's Socket.IO request mode to `http://localhost:5000` with connection auth `{ "token": "<driver JWT>" }`. Emit `tracking:location:update` with valid coordinates and timestamp.
4. Connect another Postman Socket.IO request with the passenger JWT. Emit `tracking:join` for the ride and listen for `tracking:location`. A driver joining another driver's ride or an unbooked/pending-booking user should receive an acknowledgement with `success: false`; the protected REST tracking endpoint returns `403` for those users. A malformed/expired JWT should fail the Socket.IO connection.
5. Try invalid latitude/longitude, a stale timestamp, and two updates less than two seconds apart; expect rejected acknowledgements. Stop sharing with the REST endpoint and verify subsequent updates fail. Restart sharing to test resume, then complete or cancel the ride and verify tracking cannot be joined or updated.

Focused automated tests run with `npm test` from `backend`; they cover driver/passenger authorization, invalid JWTs and coordinates, throttling, room access, broadcasts, and terminal ride states.

Create a ride with GeoJSON locations. Coordinates are `[longitude, latitude]`; available seats start at the submitted total seats. The driver is always taken from the authentication token.

```json
{
  "pickupLocation": {
    "type": "Point",
    "coordinates": [77.5946, 12.9716]
  },
  "dropLocation": {
    "type": "Point",
    "coordinates": [77.6412, 12.9756]
  },
  "departureTime": "2027-01-15T09:30:00.000Z",
  "totalSeats": 3,
  "pricePerSeat": 120,
  "vehicleType": "car"
}
```

`GET /api/rides` optionally accepts `pickupLng`/`pickupLat`, `destinationLng`/`destinationLat`, `departureDate` (`YYYY-MM-DD`, UTC), and `radiusKm` (greater than 0 and at most 100; defaults to 5 km). Location filters use the same radius around each supplied location. Results include at most 100 upcoming scheduled rides with available seats. Driver details are limited to name and rating.

#### Ride search

`GET /api/rides/search` requires an authenticated regular-user account and accepts any combination of these query parameters:

| Parameter | Description | Validation/default |
| --- | --- | --- |
| `pickupLng`, `pickupLat` | Pickup point; must be supplied together | Longitude `-180..180`, latitude `-90..90` |
| `dropLng`, `dropLat` | Destination point; must be supplied together | Longitude `-180..180`, latitude `-90..90` |
| `radiusKm` | Proximity threshold applied to each supplied point | Greater than 0 and at most 100; default `5` |
| `departureDate` | Departure date in UTC | Valid `YYYY-MM-DD` |
| `seatsRequired` | Minimum ride seats available | Positive integer; default `1` |
| `vehicleType` | Vehicle filter | `car` or `bike` |
| `maxPrice` | Maximum price per seat | Non-negative number |
| `page`, `limit` | Result pagination | Positive integers; default `1` and `20`; `limit` max `100` |

Examples (each query parameter can also be combined with the others):

```text
GET /api/rides/search?pickupLng=77.5946&pickupLat=12.9716
GET /api/rides/search?dropLng=77.6412&dropLat=12.9756&radiusKm=8
GET /api/rides/search?departureDate=2027-01-15
GET /api/rides/search?seatsRequired=2
GET /api/rides/search?vehicleType=car
GET /api/rides/search?maxPrice=200
GET /api/rides/search?page=2&limit=10
```

Only future scheduled rides with sufficient available seats are returned. With pickup coordinates, results are sorted by proximity and include `pickupDistanceKm`; otherwise they are sorted by departure time. The response is `200` with pagination metadata and a `rides` array. Each ride includes only the driver's public `name` and `rating`. Invalid filters return `400`; a valid search with no matches returns `200` with `count: 0`, `total: 0`, and an empty array.

Example successful response (pickup-distance field is included when pickup coordinates are supplied):

```json
{
  "success": true,
  "count": 1,
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "rides": [
    {
      "_id": "65a1234567890abcdef12345",
      "driver": {
        "_id": "65a1234567890abcdef67890",
        "name": "Alex",
        "rating": 4.8
      },
      "pickupLocation": {
        "type": "Point",
        "coordinates": [77.5946, 12.9716]
      },
      "dropLocation": {
        "type": "Point",
        "coordinates": [77.6412, 12.9756]
      },
      "departureTime": "2027-01-15T09:30:00.000Z",
      "totalSeats": 3,
      "availableSeats": 2,
      "pricePerSeat": 120,
      "vehicleType": "car",
      "status": "scheduled",
      "pickupDistanceKm": 0.42
    }
  ]
}
```

Postman validation cases: an unpaired coordinate, longitude outside `-180..180`, latitude outside `-90..90`, `radiusKm=101`, `seatsRequired=0`, invalid `departureDate`, unsupported `vehicleType`, negative `maxPrice`, or non-positive/non-integer `page`/`limit` should each return `400`. Search for a location/date/vehicle/price combination with no rides (or request more seats than any ride has) to verify the successful empty-result response.

### Booking API

All booking endpoints require a bearer token. A passenger may create one active booking per ride. Booking requests are pending until the ride owner reviews them; available seats are atomically decremented on confirmation and restored when a confirmed booking is cancelled.

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/bookings` | Authenticated passenger |
| `GET` | `/api/bookings/my-bookings` | Authenticated passenger |
| `GET` | `/api/bookings/:bookingId` | Passenger or ride driver |
| `PATCH` | `/api/bookings/:bookingId/cancel` | Booking passenger |
| `PATCH` | `/api/bookings/:bookingId/driver-cancel` | Authenticated, approved ride owner; confirmed booking |
| `GET` | `/api/bookings/ride/:rideId` | Authenticated, approved ride owner |
| `PATCH` | `/api/bookings/:bookingId/review` | Authenticated, approved ride owner |

Create a booking with:

```json
{
  "rideId": "65a1234567890abcdef12345",
  "seatsBooked": 2
}
```

The server calculates `totalPrice` from the ride price and does not accept a client-supplied price. Review a booking with `{"status":"confirmed"}` or `{"status":"rejected"}`.

### Ratings & Reviews

Ratings require a bearer token. Only the passenger with an active, confirmed booking or the ride's driver can review the other participant, and only after the ride has `completed` status. The server derives the ride and both review participants from the booking; client-supplied reviewer, reviewee, or ride fields are rejected. Each participant can submit one review per booking. Ratings must be integer values from 1 to 5; review text is optional and limited to 1000 characters.

Owners may update or delete their own review at any time. A user cannot update or delete another user's review. The recipient's average and review count are recalculated from actual received reviews in the same database transaction as each create, update, or delete. A user with no reviews has `rating: 0` and `ratingCount: 0`. MongoDB must support transactions (a replica set or sharded cluster), as is already required by booking operations.

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/ratings` | Authenticated ride participant |
| `GET` | `/api/ratings/user/:userId` | Authenticated; returns public name, reviews, average, and count |
| `GET` | `/api/ratings/ride/:rideId` | Authenticated ride driver or passenger with a confirmed booking |
| `GET` | `/api/ratings/my-reviews` | Authenticated reviewer |
| `PATCH` | `/api/ratings/:ratingId` | Review owner |
| `DELETE` | `/api/ratings/:ratingId` | Review owner |

Submit a review using the booking ID only; do not send user or ride identities:

```http
POST /api/ratings
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "bookingId": "65a1234567890abcdef12345",
  "rating": 5,
  "review": "Friendly and punctual."
}
```

Update a review with one or both editable fields:

```json
{
  "rating": 4,
  "review": "Updated after the trip."
}
```

Successful submission returns `201`:

```json
{
  "success": true,
  "message": "Review submitted successfully",
  "rating": {
    "_id": "65a1234567890abcdef67890",
    "ride": "65a1234567890abcdef22222",
    "booking": "65a1234567890abcdef12345",
    "reviewer": "65a1234567890abcdef33333",
    "reviewee": "65a1234567890abcdef44444",
    "rating": 5,
    "review": "Friendly and punctual."
  }
}
```

The received-review endpoint includes a summary calculated from the review records:

```json
{
  "success": true,
  "user": { "_id": "65a1234567890abcdef44444", "name": "Alex" },
  "ratingAverage": 4.5,
  "reviewCount": 2,
  "reviews": []
}
```

Invalid input returns `400`; missing resources return `404`; an ineligible or incomplete booking returns `409`; a non-participant or non-owner receives `403`; unauthenticated requests receive `401`; duplicate reviews return `409`. Error response shape:

```json
{
  "success": false,
  "message": "Reviews are allowed only after ride completion"
}
```

Run the automated backend suite with `npm test` from `backend`. Postman checks: log in as the passenger and driver, complete a ride with an active confirmed booking, submit one review as each participant, and verify both directions in `GET /api/ratings/ride/:rideId`. Verify the summary/count with `GET /api/ratings/user/:userId`; change a rating and delete it to check the recalculated average/count. Try submitting before completion, with a pending booking, as an unrelated user, with a repeated booking ID, with a non-integer or out-of-range rating, and attempt an update/delete with the other participant's token; each should receive an error status as described above.

### Notifications

All notification endpoints require `Authorization: Bearer <JWT>` and only return or modify the authenticated user's notifications.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/notifications?page=1&limit=20` | List notifications, newest first; limit is 1–100 |
| `GET` | `/api/notifications/unread-count` | Get unread count |
| `PATCH` | `/api/notifications/:notificationId/read` | Mark one owned notification as read |
| `PATCH` | `/api/notifications/read-all` | Mark all owned notifications as read |
| `DELETE` | `/api/notifications/:notificationId` | Delete one owned notification |

Supported notification types and recipients:

| Type | Recipient / event |
| --- | --- |
| `booking_requested` | Ride driver, after a passenger's booking request is created |
| `booking_confirmed` | Passenger, after the driver confirms the booking transaction |
| `booking_rejected` | Passenger, after the driver rejects the request |
| `booking_cancelled_by_passenger` | Ride driver, after a passenger cancellation commits |
| `booking_cancelled_by_driver` | Passenger, after the driver cancels a confirmed booking and seats are restored |
| `ride_started` | Passengers with confirmed bookings, after the owner starts the ride |
| `ride_completed` | Passengers with confirmed bookings, after completion commits |
| `ride_cancelled` | Passengers with confirmed bookings, after cancellation commits |
| `driver_application_approved` | Applicant, after admin approval commits |
| `driver_application_rejected` | Applicant, after admin rejection commits |

Notifications are persisted before emitting `notification:new` to the recipient's private Socket.IO room. The room is joined server-side after JWT authentication; clients cannot subscribe to another user's room. Multiple authenticated connections for the same user receive the event, and reconnecting sockets re-authenticate and rejoin. Unique event keys prevent duplicate notifications when a business transition is retried. The notifications API remains the durable source if a client is offline.

Listen on an already authenticated Socket.IO connection:

```js
socket.on("notification:new", (notification) => {
  console.log(notification.type, notification.title);
});
```

Postman checks: create a booking and verify the driver's unread count increases; confirm or reject it as the driver and verify the passenger receives a notification; try listing, marking, and deleting with a different user's JWT and verify another user's notification is not returned or changed. Connect two Socket.IO clients with the same user's JWT and verify both receive `notification:new`. Complete or cancel a ride with multiple confirmed passengers and verify only those passengers receive ride events. Driver application approvals/rejections can be tested using the admin review endpoint. Run automated notification and tracking coverage with `npm test` from `backend`.

### Database

MongoDB is used as the primary database, with Mongoose providing schema definitions, validation, and database interaction.

## Authentication Flow

```text
Client
  │
  │ Login / Register
  ▼
Express API
  │
  ├── Validate user
  ├── Check credentials
  ├── Generate JWT
  │
  ▼
Bearer JWT
  │
  ▼
Authenticated Requests
```

The frontend stores the bearer token in `sessionStorage` and attaches it to API requests. Passwords are never stored in the browser. The backend re-reads the user and role from MongoDB for protected requests.

## Driver Application Flow

```text
User submits driver application
            │
            ▼
         Pending
            │
       Admin Review
        /          \
       /            \
  Approved        Rejected
      │
      ▼
Driver can create
and manage rides
```

## Seat Booking Flow

```text
Passenger searches for ride
            │
            ▼
      Selects a ride
            │
            ▼
     Checks available seats
            │
            ▼
       Books a seat
            │
            ▼
Available seats are updated
```

The application keeps track of seat availability so that bookings cannot exceed the available capacity of a ride.

## Environment Variables

Sensitive configuration is stored in environment variables and should not be committed to GitHub. Copy `backend/.env.example` and `frontend/.env.example` to their corresponding `.env` files; see [Backend environment setup](#backend-environment-setup) for required values and production constraints.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Vinay99199/ride-share.git
cd ride-share
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and configure the backend values before starting the server.

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run using the Vite development server. Copy `frontend/.env.example` to `frontend/.env` and set the API and Socket.IO base URLs when they differ from localhost.

## Development

The project is divided into two independent applications:

```text
Frontend
React + Vite
     │
     │ REST API
     ▼
Backend
Node.js + Express
     │
     ▼
MongoDB
```

This separation keeps the frontend UI and backend business logic independent and makes the application easier to develop and maintain.

## Current Project Status

The project is being developed as a full-stack ride-sharing platform with:

* Authentication
* Passenger functionality
* Driver application workflow
* Organization-scoped driver and identity review
* Ride creation and management
* Passenger booking and driver booking management
* Seat-safe booking confirmation and cancellation
* Role- and approved-application-based access control
* Identity verification metadata workflow
* Live ride tracking and notifications
* Ratings, reviews, and reports
* Organization-scoped administration and audit logs
* Session revocation and account settings
* MongoDB database integration
* REST API architecture

## Future Improvements

Possible future enhancements include:

* Route optimization
* Online payment integration
* Private identity-document storage and verification review history
* Transactional outbox for guaranteed notification delivery
* Live MongoDB, browser, and Socket.IO end-to-end testing in CI

## Author

**Vinay**

GitHub: [Vinay99199](https://github.com/Vinay99199)
