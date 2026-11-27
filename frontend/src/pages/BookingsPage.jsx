import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { bookingsApi } from "../api/bookings";
import { errorMessage } from "../api/client";
import { ratingsApi } from "../api/ratings";
import { UserAvatar } from "../components/VisualAssets";
import ReviewCard from "../components/ReviewCard";
import ReviewForm from "../components/ReviewForm";
import {
  Button,
  EmptyState,
  Field,
  HistoryTabs,
  Notice,
  PageHeading,
  Panel,
  SelectField,
  Spinner,
  Status,
  formatDate,
  rideLocation,
} from "../components/UI";

const idOf = (value) => String(value?._id || value?.id || value || "");
const bookingStatuses = ["all", "upcoming", "pending", "confirmed", "rejected", "cancelled", "completed"];

const BookingsPage = () => {
  const [searchParams] = useSearchParams();
  const requestedStatus = searchParams.get("status");
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState(
    bookingStatuses.includes(requestedStatus) ? requestedStatus : "upcoming"
  );
  const [historyTab, setHistoryTab] = useState(() => {
    if (["completed", "cancelled"].includes(requestedStatus)) return requestedStatus;
    if (requestedStatus === undefined || ["upcoming", "pending", "confirmed"].includes(requestedStatus)) {
      return "upcoming";
    }
    return "";
  });
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async (pageNumber = page) => {
    setLoading(true);
    setError("");
    try {
      const result = await bookingsApi.list({
        page: pageNumber,
        limit: 8,
        status,
        sort,
        ...(appliedSearch ? { search: appliedSearch } : {}),
      });
      setBookings(result.bookings);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (result.page !== pageNumber) setPage(result.page);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, page, sort, status]);

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      setReviews(await ratingsApi.mine());
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const cancel = async (bookingId) => {
    if (!window.confirm("Cancel this booking? The driver will be notified.")) return;
    setWorkingId(bookingId);
    setError("");
    setSuccess("");
    try {
      const result = await bookingsApi.cancel(bookingId);
      setSuccess(result.message);
      await load(page);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setWorkingId("");
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(searchText.trim());
  };

  const clearFilters = () => {
    setStatus("upcoming");
    setHistoryTab("upcoming");
    setSearchText("");
    setAppliedSearch("");
    setSort("newest");
    setPage(1);
  };

  return (
    <div className="page">
      <PageHeading
        eyebrow="TRAVEL ACTIVITY"
        title="Ride history"
        description="Review upcoming bookings, completed journeys and cancelled trips."
        action={<Link className="button button-outline" to="/rides">Find another ride</Link>}
      />
      {error && <Notice>{error}</Notice>}
      {success && <Notice type="success">{success}</Notice>}

      <HistoryTabs
        value={historyTab}
        onChange={(value) => {
          setHistoryTab(value);
          setStatus(value);
          setPage(1);
        }}
        label="Passenger ride history"
      />

      <Panel className="booking-filter-panel">
        <form className="booking-filters" onSubmit={submitSearch}>
          <Field
            label="Search bookings"
            placeholder="Driver, booking ID, or ride ID"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            maxLength={100}
          />
          <SelectField label="Booking status" value={status} onChange={(event) => {
            const nextStatus = event.target.value;
            setStatus(nextStatus);
            setHistoryTab(["completed", "cancelled"].includes(nextStatus) ? nextStatus : ["all", "rejected"].includes(nextStatus) ? "" : "upcoming");
            setPage(1);
          }}>
            <option value="all">All bookings</option>
            <option value="upcoming">Upcoming rides</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed rides</option>
          </SelectField>
          <SelectField label="Booking date" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </SelectField>
          <div className="booking-filter-actions">
            <Button type="submit" disabled={loading}>Search</Button>
            <Button type="button" variant="outline" disabled={loading} onClick={clearFilters}>Clear filters</Button>
          </div>
        </form>
      </Panel>

      <div className="results-heading">
        <div><h2>{total} booking{total === 1 ? "" : "s"}</h2><p>Completed ride status is derived from the associated ride record.</p></div>
        <Button type="button" variant="outline" disabled={loading} onClick={() => load(page)}>Refresh</Button>
      </div>

      {loading ? <Spinner label="Loading your bookings..." /> : bookings.length ? (
        <>
          <div className="booking-list booking-list-page">
            {bookings.map((booking) => {
              const ride = booking.ride;
              const driverId = idOf(ride?.driver);
              const existingReview = reviews.find(
                (review) => idOf(review.booking) === idOf(booking._id)
              );
              const canReview =
                booking.status === "confirmed" && ride?.status === "completed";
              const canCancel =
                ["pending", "confirmed"].includes(booking.status) &&
                !ride?.startedAt &&
                ride?.status !== "completed";
              const canTrack =
                booking.status === "confirmed" &&
                ride?.status === "scheduled" &&
                ride.startedAt &&
                ride.trackingActive;

              return (
                <Panel key={booking._id} className="booking-card">
                  <div className="booking-card-heading">
                    <div>
                      <span className="eyebrow">BOOKING · {booking._id}</span>
                      <h2>{ride ? `${rideLocation(ride, "pickup")} → ${rideLocation(ride, "drop")}` : "Ride details unavailable"}</h2>
                    </div>
                    <Status value={booking.status} />
                  </div>
                  {ride?.status && ride.status !== "scheduled" && (
                    <div className="booking-ride-status"><span>Ride status</span><Status value={ride.status} /></div>
                  )}
                  <div className="booking-summary">
                    <span>Departure {formatDate(ride?.departureTime)}</span>
                    <span>Booked {formatDate(booking.createdAt)}</span>
                    <span>{booking.seatsBooked} seat(s)</span>
                    <span>Total {Number(booking.totalPrice).toFixed(2)}</span>
                    {ride?.driver?.name && (
                      <span className="booking-driver-line">
                        <UserAvatar name={ride.driver.name} size="small" />
                        Driver{" "}
                        {driverId ? (
                          <Link to={`/drivers/${driverId}/reviews`}>{ride.driver.name}</Link>
                        ) : ride.driver.name}
                        {ride.driver.rating !== undefined &&
                          ` · ${Number(ride.driver.rating).toFixed(1)} / 5`}
                        {Number.isFinite(ride.driver.ratingCount) &&
                          ` · ${ride.driver.ratingCount} reviews`}
                      </span>
                    )}
                  </div>
                  <div className="booking-actions">
                    {ride?._id && <Link className="button button-outline button-small" to={`/rides/${ride._id}`}>View ride details</Link>}
                    <Link className="button button-outline button-small" to={`/support?bookingId=${encodeURIComponent(booking._id)}`}>Report an issue</Link>
                    {canCancel && (
                      <Button
                        type="button"
                        variant="outline"
                        className="button-small"
                        disabled={workingId === booking._id}
                        onClick={() => cancel(booking._id)}
                      >
                        {workingId === booking._id ? "Cancelling..." : "Cancel booking"}
                      </Button>
                    )}
                    {canTrack && (
                      <Link className="button button-primary button-small" to={`/rides/${ride._id}/tracking`}>Live tracking</Link>
                    )}
                    {booking.status === "confirmed" &&
                      ride?.startedAt &&
                      ride.status === "scheduled" &&
                      !ride.trackingActive && (
                        <span className="muted">Driver location sharing is paused.</span>
                      )}
                  </div>
                  {canReview && existingReview && (
                    <div className="review-existing">
                      <ReviewCard review={existingReview} />
                      <Link className="text-link" to="/ratings">Manage your review →</Link>
                    </div>
                  )}
                  {canReview && !existingReview && (
                    reviewsLoading ? (
                      <Spinner label="Checking your submitted review..." />
                    ) : (
                      <ReviewForm
                        bookingId={booking._id}
                        recipient={ride.driver?.name}
                        onSubmitted={async () => {
                          await loadReviews();
                          await load(page);
                        }}
                      />
                    )
                  )}
                </Panel>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>← Previous</Button>
              <span>Page {page} of {totalPages}</span>
              <Button variant="outline" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>Next →</Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          illustration="bookings"
          title={total ? "No bookings on this page" : "No bookings found"}
          description={status !== "all" || appliedSearch ? "Try clearing or changing your filters." : "Search for a ride and request a seat to see it here."}
          action={status !== "all" || appliedSearch
            ? <button className="text-button" type="button" onClick={clearFilters}>Clear filters</button>
            : <Link className="button button-primary" to="/rides">Find a ride</Link>}
        />
      )}
    </div>
  );
};

export default BookingsPage;
