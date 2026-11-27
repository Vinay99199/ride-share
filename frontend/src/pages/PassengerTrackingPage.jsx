import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bookingsApi } from "../api/bookings";
import { errorMessage } from "../api/client";
import { UserAvatar } from "../components/VisualAssets";
import {
  EmptyState,
  Button,
  Notice,
  PageHeading,
  Panel,
  Spinner,
  Status,
  formatDate,
  rideLocation,
} from "../components/UI";

const PassengerTrackingPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    bookingsApi
      .list({ status: "confirmed", page, limit: 20, sort: "newest" })
      .then((result) => {
        if (!active) return;
        setBookings(result.bookings);
        setTotalPages(result.totalPages || 1);
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
  }, [page]);

  const trackableBookings = bookings
    .filter(
      (booking) =>
        booking.ride?.status === "scheduled" &&
        booking.ride.startedAt &&
        booking.ride.trackingActive
    )
    .sort(
      (left, right) =>
        new Date(left.ride.departureTime) - new Date(right.ride.departureTime)
    );
  const otherConfirmedBookings = bookings.filter(
    (booking) =>
      booking.ride?.status === "scheduled" &&
      !trackableBookings.includes(booking)
  );

  return (
    <div className="page">
      <PageHeading
        eyebrow="PASSENGER TOOLS"
        title="Live ride tracking"
        description="Only your confirmed bookings are eligible. Precise driver location appears while the driver is sharing."
        action={<Link className="button button-outline" to="/bookings">My bookings</Link>}
      />
      {error && <Notice>{error}</Notice>}
      {loading ? <Spinner label="Checking your confirmed rides..." /> : (
        <>
          <Panel title="Active rides">
            {trackableBookings.length ? (
              <div className="passenger-tracking-list">
                {trackableBookings.map((booking) => {
                  const ride = booking.ride;
                  return (
                    <article className="passenger-tracking-card" key={booking._id}>
                      <div className="passenger-tracking-heading">
                        <div>
                          <span className="eyebrow">BOOKING · {String(booking._id).slice(-8)}</span>
                          <h2>{rideLocation(ride, "pickup")} → {rideLocation(ride, "drop")}</h2>
                        </div>
                        <Status value="active" />
                      </div>
                      <div className="booking-summary">
                        <span>{formatDate(ride.departureTime)}</span>
                        <span className="tracking-driver-summary">
                          <UserAvatar name={ride.driver?.name} size="small" />
                          Driver {ride.driver?.name || "Driver"}
                        </span>
                        <span>{booking.seatsBooked} seat(s)</span>
                      </div>
                      <Link
                        className="button button-primary"
                        to={`/rides/${ride._id}/tracking`}
                      >
                        Open live map
                      </Link>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                illustration="rides"
                title="No driver is sharing a live location"
                description="When a driver starts a ride and enables sharing for one of your confirmed bookings, it will appear here."
                action={<Link className="text-link" to="/bookings">Check confirmed bookings →</Link>}
              />
            )}
          </Panel>

          {otherConfirmedBookings.length > 0 && (
            <Panel title="Confirmed rides not currently sharing">
              <div className="passenger-tracking-list">
                {otherConfirmedBookings.map((booking) => (
                  <article className="passenger-tracking-card" key={booking._id}>
                    <div className="passenger-tracking-heading">
                      <div>
                        <span className="eyebrow">BOOKING · {String(booking._id).slice(-8)}</span>
                        <h2>{rideLocation(booking.ride, "pickup")} → {rideLocation(booking.ride, "drop")}</h2>
                      </div>
                      <Status value={booking.ride.startedAt ? "paused" : "scheduled"} />
                    </div>
                    <div className="booking-summary">
                      <span>{formatDate(booking.ride.departureTime)}</span>
                      <span className="tracking-driver-summary">
                        <UserAvatar name={booking.ride.driver?.name} size="small" />
                        Driver {booking.ride.driver?.name || "Driver"}
                      </span>
                    </div>
                    <Link className="text-link" to={`/rides/${booking.ride._id}`}>
                      Ride details →
                    </Link>
                  </article>
                ))}
              </div>
            </Panel>
          )}
          {totalPages > 1 && (
            <div className="pagination">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>← Previous</Button>
              <span>Page {page} of {totalPages}</span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next →</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PassengerTrackingPage;
