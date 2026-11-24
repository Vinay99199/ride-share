# Ride Sharing

A full-stack ride-sharing web application that connects drivers who have available seats with passengers traveling on the same or similar routes.

The platform allows users to register and log in, apply as drivers, create and manage rides after approval, search for available rides, and book seats. A user can also be both a driver and a passenger depending on their needs.

## Features

### Authentication & Authorization

* User registration and login
* JWT-based authentication
* HTTP-only cookies for secure token handling
* Role-based access control
* Protected routes for authenticated users

### Passenger

Passengers can:

* Search for available rides
* View ride and driver details
* Book available seats
* Cancel bookings
* Check their ride/booking information

A user does not have to be permanently a passenger. The same user can apply to become a driver and can still book rides as a passenger whenever they need to travel without their own vehicle.

### Driver

Users who want to offer rides can apply as drivers by providing:

* Driving license number
* Vehicle number
* Vehicle type
* Other required application information

Driver applications initially have a `pending` status and are reviewed by an administrator.

Possible application statuses:

* `pending`
* `approved`
* `rejected`

Only approved drivers can create and manage rides.

Drivers can:

* Create rides
* Specify available seats
* Manage their rides
* Manage seat availability
* Handle bookings for their rides

### Admin

Administrators can:

* Review driver applications
* Approve or reject driver applications
* Manage users
* Manage rides
* Handle basic platform management

## How the Application Works

```text
User
 │
 ├── Register / Login
 │
 ├── Passenger
 │    ├── Search rides
 │    ├── View ride details
 │    ├── Book seat
 │    └── Cancel booking
 │
 └── Driver
      ├── Submit driver application
      ├── Admin reviews application
      │
      ├── Approved
      │     ├── Create ride
      │     ├── Manage ride
      │     └── Manage available seats
      │
      └── Rejected
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
* HTTP-only Cookies
* RESTful APIs
* MVC architecture

### Development Tools

* Git
* GitHub
* VS Code
* npm

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

Ride search and details are public. Creating a ride requires a bearer token from an authenticated user with an approved driver application. Only the authenticated ride driver can cancel a scheduled ride.

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/rides` | Authenticated, approved driver |
| `GET` | `/api/rides` | Public |
| `GET` | `/api/rides/:rideId` | Public |
| `PATCH` | `/api/rides/:rideId/cancel` | Authenticated ride driver |

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

`GET /api/rides/search` is public and accepts any combination of these query parameters:

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
HTTP-only Cookie
  │
  ▼
Authenticated Requests
```

JWT is used to identify authenticated users, while HTTP-only cookies help prevent client-side JavaScript from directly accessing the authentication token.

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

Sensitive configuration is stored in environment variables and should not be committed to GitHub.

Example:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

Create a `.env` file inside the backend according to the environment variables required by the application.

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

Create the required `.env` file and configure the environment variables.

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

The frontend will run using the Vite development server.

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
* Admin approval workflow
* Ride creation and management
* Seat booking
* Booking cancellation
* Role-based access control
* MongoDB database integration
* REST API architecture

## Future Improvements

Possible future enhancements include:

* Location-based ride matching
* Map integration
* Route optimization
* Real-time ride tracking
* Notifications
* Online payment integration
* Driver and passenger ratings
* Improved admin dashboard

## Author

**Vinay**

GitHub: [Vinay99199](https://github.com/Vinay99199)
