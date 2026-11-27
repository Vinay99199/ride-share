import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { bookingsApi } from "../api/bookings";
import { errorMessage } from "../api/client";
import { ratingsApi } from "../api/ratings";
import { ridesApi } from "../api/rides";
import ReviewCard from "../components/ReviewCard";
import {
  Button,
  EmptyState,
  Notice,
  PhotoHero,
  Panel,
  RideCard,
  Spinner,
  formatDate,
} from "../components/UI";
import { useAuth, userId } from "../context/AuthContext";

const DriverDashboardPage = () => {
  const { user } = useAuth();
  const currentUserId = userId(user);
  const [rides, setRides] = useState([]);
  const [rideSummary, setRideSummary] = useState(null);
  const [activeRides, setActiveRides] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    Promise.all([
      ridesApi.mine({ limit: 100, sort: "departure_asc" }),
      bookingsApi.driverMine(),
      ratingsApi.forUser(currentUserId),
    ])
      .then(([driverRides, driverBookings, ratingSummary]) => {
        if (!active) return;
        setRides(driverRides.rides);
        setRideSummary(driverRides.summary);
        setActiveRides(driverRides.activeRides || []);
        setBookings(driverBookings);
        setReceivedReviews(ratingSummary);
      })
      .catch((requestError) => {
        if (active) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUserId]);

  const metrics = useMemo(() => ({
    totalRides: rideSummary?.total ?? 0,
    upcomingRides: rideSummary?.upcoming ?? 0,
    activeRides: rideSummary?.active ?? 0,
    completedRides: rideSummary?.completed ?? 0,
    pendingRequests: bookings.filter((booking) => booking.status === "pending").length,
  }), [bookings, rideSummary]);

  const upcomingRides = rides
    .filter(
      (ride) =>
        ride.status === "scheduled" &&
        new Date(ride.departureTime).getTime() > Date.now()
    )
    .sort(
      (left, right) =>
        new Date(left.departureTime) - new Date(right.departureTime)
    )
    .slice(0, 3);
  const activeRide = activeRides[0];
  const ratingAverage =
    receivedReviews?.ratingAverage ?? Number(user?.rating || 0);
  const ratingCount =
    receivedReviews?.reviewCount ?? Number(user?.ratingCount || 0);

  return (
    <div className="page">
      <PhotoHero
        image="driver"
        className="driver-photo-hero"
        eyebrow="DRIVER WORKSPACE"
        title={`Welcome back, ${user?.name?.split(" ")[0] || "driver"}.`}
        description="A dedicated view of your rides, passenger requests, live trips, and driver feedback."
        action={<Link className="button button-primary" to="/rides/create">Create a ride</Link>}
      />
      {error && <Notice>{error}</Notice>}

      <div className="driver-dashboard-actions">
        <Link className="driver-action-card" to="/rides/create">
          <span className="driver-action-icon">＋</span>
          <span><strong>Create a ride</strong><small>Offer seats on a new journey</small></span>
          <b>→</b>
        </Link>
        <Link className="driver-action-card" to="/my-rides">
          <span className="driver-action-icon">↗</span>
          <span><strong>Manage my rides</strong><small>View status and ride controls</small></span>
          <b>→</b>
        </Link>
        <Link className="driver-action-card" to="/driver/bookings">
          <span className="driver-action-icon">⌁</span>
          <span><strong>Booking requests</strong><small>Review passenger requests</small></span>
          <b>→</b>
        </Link>
        <Link className="driver-action-card" to="/ratings">
          <span className="driver-action-icon">★</span>
          <span><strong>Ratings & reviews</strong><small>{ratingCount} reviews · {Number(ratingAverage).toFixed(1)} average</small></span>
          <b>→</b>
        </Link>
      </div>

      <div className="stat-grid driver-stat-grid">
        <div className="stat-card"><span>TOTAL RIDES</span><strong>{loading ? "—" : metrics.totalRides}</strong><small>All statuses</small></div>
        <div className="stat-card"><span>UPCOMING</span><strong>{loading ? "—" : metrics.upcomingRides}</strong><small>Scheduled and not started</small></div>
        <div className="stat-card"><span>ACTIVE</span><strong>{loading ? "—" : metrics.activeRides}</strong><small>Started rides</small></div>
        <div className="stat-card"><span>PENDING REQUESTS</span><strong>{loading ? "—" : metrics.pendingRequests}</strong><small>Awaiting your decision</small></div>
        <div className="stat-card"><span>COMPLETED</span><strong>{loading ? "—" : metrics.completedRides}</strong><small>Ride history</small></div>
        <div className="stat-card"><span>DRIVER RATING</span><strong>{Number(ratingAverage).toFixed(1)}<small className="stat-suffix"> / 5</small></strong><small>{ratingCount} received reviews</small></div>
      </div>

      <div className="content-grid dashboard-grid driver-dashboard-grid">
        <Panel
          title="Upcoming rides"
          action={<Link className="text-link" to="/my-rides">All rides →</Link>}
        >
          {loading ? <Spinner label="Loading your driver summary..." /> : upcomingRides.length ? (
            <div className="ride-list compact-list">
              {upcomingRides.map((ride) => (
                <div className="driver-ride-card" key={ride._id}>
                  <RideCard ride={ride} />
                  <div className="driver-ride-actions">
                    <span className="muted">{formatDate(ride.departureTime)}</span>
                    <Link className="button button-outline button-small" to={`/rides/${ride._id}/tracking`}>
                      Start / track
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              illustration="rides"
              title="No upcoming rides"
              description="Create a ride to start sharing seats with your community."
              action={<Link className="text-link" to="/rides/create">Create a ride →</Link>}
            />
          )}
        </Panel>

        <div className="driver-dashboard-side">
          <Panel title="Active ride">
            {loading ? <Spinner /> : activeRide ? (
              <>
                <div className="profile-facts">
                  <div><span>Departure</span><b>{formatDate(activeRide.departureTime)}</b></div>
                  <div><span>Seats available</span><b>{activeRide.availableSeats} / {activeRide.totalSeats}</b></div>
                  <div><span>Location sharing</span><b>{activeRide.trackingActive ? "On" : "Paused"}</b></div>
                </div>
                <Link className="button button-outline driver-dashboard-button" to={`/rides/${activeRide._id}/tracking`}>
                  Open tracking controls
                </Link>
              </>
            ) : (
              <p className="muted">No ride is currently in progress.</p>
            )}
          </Panel>

          <Panel
            title="Recent driver feedback"
            action={<Link className="text-link" to="/ratings">All reviews →</Link>}
          >
            {loading ? <Spinner /> : receivedReviews?.reviews?.length ? (
              <div className="review-list">
                {receivedReviews.reviews.slice(0, 3).map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>
            ) : (
              <EmptyState
                illustration="bookings"
                title="No driver reviews yet"
                description="Feedback from completed rides will appear here."
              />
            )}
          </Panel>
        </div>
      </div>
      <p className="field-note">
        Driver access is based on your approved driver application. You can still use passenger pages to find rides and manage your bookings.
      </p>
    </div>
  );
};

export default DriverDashboardPage;
