import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { bookingsApi } from "../api/bookings";
import { errorMessage } from "../api/client";
import { notificationsApi } from "../api/notifications";
import LocationPicker from "../components/LocationPicker";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  Button,
  EmptyState,
  Notice,
  PhotoHero,
  Panel,
  Spinner,
  Status,
  VehicleTypeSelector,
  formatDate,
  rideLocation,
} from "../components/UI";

const DashboardPage = () => {
  const { user } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [seatsRequired, setSeatsRequired] = useState("1");
  const [vehicleType, setVehicleType] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [result, notificationResult] = await Promise.all([
        bookingsApi.dashboard(),
        notificationsApi.list({ page: 1, limit: 5 }),
      ]);
      setDashboard(result);
      setNotifications(notificationResult.notifications);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const refresh = () => loadDashboard();
    window.addEventListener("avonex:notification", refresh);
    return () => window.removeEventListener("avonex:notification", refresh);
  }, [loadDashboard]);

  const stats = dashboard?.stats ?? {};

  const searchRides = (event) => {
    event.preventDefault();
    setSearchError("");
    if (!pickup || !destination) {
      setSearchError("Choose both a pickup and destination on the map.");
      return;
    }
    if (
      pickup.coordinates[0] === destination.coordinates[0] &&
      pickup.coordinates[1] === destination.coordinates[1]
    ) {
      setSearchError("Pickup and destination must be different locations.");
      return;
    }
    if (!Number.isInteger(Number(seatsRequired)) || Number(seatsRequired) < 1) {
      setSearchError("Enter a whole number of seats greater than zero.");
      return;
    }

    const params = new URLSearchParams({
      pickupLng: String(pickup.coordinates[0]),
      pickupLat: String(pickup.coordinates[1]),
      pickupName: pickup.name || "",
      pickupAddress: pickup.address || "",
      dropLng: String(destination.coordinates[0]),
      dropLat: String(destination.coordinates[1]),
      dropName: destination.name || "",
      dropAddress: destination.address || "",
      seatsRequired,
      sort: "distance",
    });
    if (departureDate) params.set("departureDate", departureDate);
    if (vehicleType) params.set("vehicleType", vehicleType);
    navigate(`/rides?${params.toString()}`);
  };

  return (
    <div className="page">
      <PhotoHero
        image="passengerJourney"
        className="passenger-photo-hero"
        eyebrow="PASSENGER WORKSPACE"
        title={`Good day, ${user?.name?.split(" ")[0] || "traveler"}.`}
        description="Your booking requests, upcoming trips, ride history, and community updates in one place."
        action={<Link className="button button-primary" to="/rides">Find a ride <span>→</span></Link>}
      />
      {error && <Notice>{error}</Notice>}
      <section className="ride-discovery-layout" aria-label="Plan a shared ride">
        <div className="discovery-map-card">
          <div className="discovery-map-heading">
            <div>
              <span className="eyebrow">MAP-BASED SEARCH</span>
              <h2>Choose your route</h2>
              <p>Search a place or choose a point directly on its map.</p>
            </div>
          </div>
          <div className="discovery-location-pickers">
            <LocationPicker
              label="Pickup location"
              compact
              value={pickup}
              onChange={(location) => {
                setPickup(location);
                setSearchError("");
              }}
            />
            <LocationPicker
              label="Destination"
              compact
              value={destination}
              onChange={(location) => {
                setDestination(location);
                setSearchError("");
              }}
            />
          </div>
        </div>

        <Panel title="Where are you heading?" className="discovery-search-panel">
          <form className="discovery-search-form" onSubmit={searchRides}>
            <div className="discovery-location-fields">
              <div className="discovery-location-option">
                <span className="discovery-location-dot pickup-dot" aria-hidden="true" />
                <span><small>PICKUP</small><strong>{pickup?.address || pickup?.name || "Choose a pickup place on the map"}</strong></span>
              </div>
              <div className="discovery-location-option">
                <span className="discovery-location-dot destination-dot" aria-hidden="true" />
                <span><small>DESTINATION</small><strong>{destination?.address || destination?.name || "Choose a destination on the map"}</strong></span>
              </div>
            </div>
            <div className="form-row">
              <label className="field">
                <span>Travel date</span>
                <input type="date" value={departureDate} onChange={(event) => setDepartureDate(event.target.value)} />
              </label>
              <label className="field">
                <span>Seats needed</span>
                <input type="number" min="1" step="1" required value={seatsRequired} onChange={(event) => setSeatsRequired(event.target.value)} />
              </label>
            </div>
            <VehicleTypeSelector
              label="Vehicle preference"
              name="homeVehicleType"
              value={vehicleType}
              onChange={(event) => setVehicleType(event.target.value)}
            />
            {searchError && <Notice>{searchError}</Notice>}
            <Button type="submit" className="discovery-submit">
              Search shared rides <span aria-hidden="true">→</span>
            </Button>
          </form>
        </Panel>
      </section>
      {loading ? <Spinner label="Loading your passenger activity..." /> : !dashboard ? (
        <EmptyState
          title="Passenger activity is unavailable"
          description="Try again to load your latest booking and notification information."
          action={<Button type="button" onClick={loadDashboard}>Retry</Button>}
        />
      ) : (
        <>
          <div className="stat-grid passenger-stat-grid">
            <Link className="stat-card stat-card-link" to="/bookings"><span>TOTAL BOOKINGS</span><strong>{stats.totalBookings}</strong><small>All booking statuses <b>→</b></small></Link>
            <Link className="stat-card stat-card-link" to="/bookings?status=pending"><span>PENDING</span><strong>{stats.pendingRequests}</strong><small>Awaiting driver confirmation <b>→</b></small></Link>
            <Link className="stat-card stat-card-link" to="/bookings?status=confirmed"><span>CONFIRMED</span><strong>{stats.confirmedBookings}</strong><small>Seat requests accepted <b>→</b></small></Link>
            <div className="stat-card"><span>UPCOMING RIDES</span><strong>{stats.upcomingRides}</strong><small>Confirmed and not started</small></div>
            <Link className="stat-card stat-card-link" to="/live-tracking"><span>ACTIVE RIDES</span><strong>{stats.activeRides}</strong><small>Track a current trip <b>→</b></small></Link>
            <Link className="stat-card stat-card-link" to="/bookings?status=completed"><span>COMPLETED</span><strong>{stats.completedRides}</strong><small>{stats.totalRidesTravelled} rides travelled <b>→</b></small></Link>
            <Link className="stat-card stat-card-link" to="/bookings?status=cancelled"><span>CANCELLED / REJECTED</span><strong>{stats.cancelledOrRejectedBookings}</strong><small>Booking and ride outcomes <b>→</b></small></Link>
            <Link className="stat-card stat-card-link" to="/ratings"><span>REVIEWS GIVEN</span><strong>{stats.reviewsGiven}</strong><small>Average {Number(stats.averageRatingGiven).toFixed(2)} / 5 <b>→</b></small></Link>
            <Link className="stat-card stat-card-link" to="/notifications"><span>UNREAD UPDATES</span><strong>{unreadCount}</strong><small>View notifications <b>→</b></small></Link>
          </div>

          <div className="passenger-quick-actions">
            <Link to="/rides"><span>⌕</span><b>Search rides</b><small>Compare available journeys</small></Link>
            <Link to="/bookings"><span>▤</span><b>My bookings</b><small>Manage requests and history</small></Link>
            <Link to="/live-tracking"><span>◎</span><b>Track active ride</b><small>See authorized live trips</small></Link>
            <Link to="/rides"><span>★</span><b>View driver reviews</b><small>Browse feedback from ride cards</small></Link>
          </div>

          <div className="content-grid dashboard-grid passenger-dashboard-grid">
            <Panel title="Recent booking activity" action={<Link className="text-link" to="/bookings">All bookings →</Link>}>
              {dashboard?.recentBookings?.length ? (
                <div className="passenger-activity-list">
                  {dashboard.recentBookings.map((booking) => (
                    <article className="passenger-activity-row" key={booking._id}>
                      <div className="passenger-activity-copy">
                        <strong>
                          {booking.ride
                            ? `${rideLocation(booking.ride, "pickup")} → ${rideLocation(booking.ride, "drop")}`
                            : "Ride details unavailable"}
                        </strong>
                        <span>{formatDate(booking.ride?.departureTime)} · {booking.seatsBooked} seat(s){booking.ride?.driver?.name ? ` · Driver ${booking.ride.driver.name}` : ""}</span>
                        <small>Requested {formatDate(booking.createdAt)}</small>
                      </div>
                      <div className="passenger-activity-status">
                        <Status value={booking.status} />
                        {booking.ride?._id && <Link className="text-link" to={`/rides/${booking.ride._id}`}>Details →</Link>}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState illustration="bookings" title="No bookings yet" description="Find a ride and request a seat to see your journey activity here." action={<Link className="text-link" to="/rides">Search rides →</Link>} />
              )}
            </Panel>
            <Panel title="Recent notifications" action={<Link className="text-link" to="/notifications">All updates →</Link>}>
              {notifications.length ? (
                <div className="passenger-notification-list">
                  {notifications.slice(0, 4).map((notification) => (
                    <article className="passenger-notification-row" key={notification._id}>
                      <span className="notification-type">{notification.type?.replaceAll("_", " ")}</span>
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                      <small>{formatDate(notification.createdAt)}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState illustration="notifications" title="No notifications yet" description="Booking and ride updates will appear here." />
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
