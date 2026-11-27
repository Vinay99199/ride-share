import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bookingsApi } from "../api/bookings";
import { errorMessage } from "../api/client";
import { UserAvatar } from "../components/VisualAssets";
import {
  Button,
  EmptyState,
  Notice,
  PageHeading,
  Panel,
  Spinner,
  Status,
  formatDate,
} from "../components/UI";

const DriverBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    bookingsApi.driverMine()
      .then((items) => { if (active) setBookings(items); })
      .catch((requestError) => { if (active) setError(errorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const review = async (bookingId, status) => {
    setWorkingId(bookingId);
    setError("");
    setSuccess("");
    try {
      const result = await bookingsApi.review(bookingId, status);
      if (status === "rejected") {
        setBookings((current) => current.filter((booking) => booking._id !== bookingId));
      } else {
        setBookings((current) =>
          current.map((booking) =>
            booking._id === bookingId ? result.booking : booking
          )
        );
      }
      setSuccess(result.message);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setWorkingId("");
    }
  };

  const cancel = async (bookingId) => {
    if (!window.confirm("Cancel this confirmed passenger booking? The passenger will be notified.")) {
      return;
    }
    setWorkingId(bookingId);
    setError("");
    setSuccess("");
    try {
      const result = await bookingsApi.cancelByDriver(bookingId);
      setBookings((current) => current.filter((booking) => booking._id !== bookingId));
      setSuccess(result.message);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setWorkingId("");
    }
  };

  return (
    <div className="page">
      <PageHeading
        eyebrow="DRIVER TOOLS"
        title="Booking requests"
        description="Review pending seat requests and manage your confirmed passengers."
      />
      {error && <Notice>{error}</Notice>}
      {success && <Notice type="success">{success}</Notice>}
      {loading ? <Spinner label="Loading your booking requests..." /> : bookings.length ? (
        <div className="driver-booking-list">
          {bookings.map((booking) => (
            <Panel key={booking._id} className="driver-booking-card">
              <div className="driver-booking-heading">
                <div>
                  <UserAvatar name={booking.passenger?.name} />
                  <span className="eyebrow">PASSENGER</span>
                  <h2>{booking.passenger?.name || "Passenger"}</h2>
                </div>
                <Status value={booking.status} />
              </div>
              <div className="profile-facts">
                <div><span>Seats requested</span><b>{booking.seatsBooked}</b></div>
                <div><span>Total price</span><b>{Number(booking.totalPrice).toFixed(2)}</b></div>
                <div><span>Ride departure</span><b>{formatDate(booking.ride?.departureTime)}</b></div>
                <div><span>Request received</span><b>{formatDate(booking.createdAt)}</b></div>
              </div>
              {booking.ride?._id && (
                <Link className="text-link" to={`/rides/${booking.ride._id}`}>
                  Open ride details →
                </Link>
              )}
              <Link className="text-link" to={`/support?bookingId=${encodeURIComponent(booking._id)}`}>
                Report an issue →
              </Link>
              {booking.status === "pending" && (
                <div className="inline-actions">
                  <Button
                    type="button"
                    disabled={workingId === booking._id}
                    onClick={() => review(booking._id, "confirmed")}
                  >
                    Confirm
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={workingId === booking._id}
                    onClick={() => review(booking._id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              )}
              {booking.status === "confirmed" && (
                !booking.ride?.startedAt &&
                booking.ride?.status !== "completed" && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={workingId === booking._id}
                    onClick={() => cancel(booking._id)}
                  >
                    Cancel booking
                  </Button>
                )
              )}
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState
          illustration="bookings"
          title="No active booking requests"
          description="Pending requests and confirmed passengers for your rides will appear here."
        />
      )}
    </div>
  );
};

export default DriverBookingsPage;
