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
