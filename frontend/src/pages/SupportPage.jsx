import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { bookingsApi } from "../api/bookings";
import { errorMessage } from "../api/client";
import { reportsApi } from "../api/reports";
import {
  Button,
  EmptyState,
  Notice,
  PageHeading,
  Panel,
  SelectField,
  Spinner,
  Status,
  formatDate,
  rideLocation,
} from "../components/UI";
import { useAuth } from "../context/AuthContext";

const SupportPage = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "";
  const { user, driverApplication } = useAuth();
  const [booking, setBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(Boolean(bookingId));
  const [bookingError, setBookingError] = useState("");
  const [type, setType] = useState("safety");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedReport, setSubmittedReport] = useState(null);

  useEffect(() => {
    let active = true;
    if (!bookingId) {
      setBooking(null);
      setBookingLoading(false);
      setBookingError("");
      return () => { active = false; };
    }

    setBookingLoading(true);
    setBookingError("");
    bookingsApi.get(bookingId)
      .then((result) => {
        if (active) setBooking(result);
      })
      .catch((requestError) => {
        if (active) setBookingError(errorMessage(requestError));
      })
      .finally(() => {
        if (active) setBookingLoading(false);
      });
    return () => { active = false; };
  }, [bookingId]);

  const submitReport = async (event) => {
    event.preventDefault();
    setError("");
    if (description.trim().length < 10) {
      setError("Describe the issue in at least 10 characters.");
      return;
    }
    if (!bookingId || !booking) {
      setError("Choose a booking from your ride history before submitting a report.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await reportsApi.create({
        bookingId,
        type,
        description: description.trim(),
      });
      if (!result?.report?.id) {
        throw new Error("The report was submitted without a reference ID. Contact support before resubmitting.");
      }
      setSubmittedReport(result.report);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const isApprovedDriver =
    ["user", "driver"].includes(user?.role) &&
    driverApplication?.status === "approved";
  const historyPath = isApprovedDriver ? "/my-rides" : "/bookings";
  const homePath = isApprovedDriver ? "/driver/dashboard" : "/app";

  return (
    <div className="page">
      <PageHeading
        eyebrow="HELP & SUPPORT"
        title={submittedReport ? "Report received" : "Report a ride issue"}
        description={submittedReport
          ? "Your report was saved and is awaiting administrator review."
          : "Send a report about a booking you participated in. AVONEX verifies booking access before accepting it."}
        action={!submittedReport && <Link className="button button-outline" to={historyPath}>Ride history</Link>}
      />

      {bookingLoading ? (
        <Spinner label="Checking booking access..." />
      ) : submittedReport ? (
        <Panel className="report-success-panel">
          <span className="report-success-icon" aria-hidden="true">✓</span>
          <h2 aria-live="polite">Thanks for letting us know.</h2>
          <p>Your report has been submitted for review.</p>
          <div className="profile-facts">
            <div><span>Reference</span><b>{submittedReport.id}</b></div>
            <div><span>Status</span><Status value={submittedReport.status} /></div>
          </div>
          <Link className="button button-primary" to={homePath}>Back to home</Link>
        </Panel>
      ) : !bookingId ? (
        <EmptyState
          title="Select a booking first"
          description="Reports must be tied to a ride you booked or drove. Open a booking or a driver's ride details and choose Report an issue."
          action={<Link className="button button-primary" to={historyPath}>Open ride history</Link>}
        />
      ) : bookingError ? (
        <Notice>{bookingError}</Notice>
      ) : booking ? (
        <>
          {error && <Notice>{error}</Notice>}
          <Panel title="Selected booking" className="report-booking-panel">
            <div className="report-booking-summary">
              <div>
                <strong>{rideLocation(booking.ride, "pickup")} → {rideLocation(booking.ride, "drop")}</strong>
                <span>Departure · {formatDate(booking.ride?.departureTime)}</span>
              </div>
              <Status value={booking.status} />
            </div>
          </Panel>
          <Panel title="Issue details">
            <form className="form-stack" onSubmit={submitReport}>
              <SelectField label="Issue category" value={type} onChange={(event) => setType(event.target.value)}>
                <option value="safety">Safety concern</option>
                <option value="behavior">Driver or passenger behaviour</option>
                <option value="payment">Payment issue</option>
                <option value="other">Other ride issue</option>
              </SelectField>
              <label className="field">
                <span>What happened?</span>
                <textarea
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={6}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Share relevant details about this ride."
                  aria-describedby="report-description-note"
                />
                <small id="report-description-note">10–5000 characters. Don't include passwords or payment credentials.</small>
              </label>
              <Button type="submit" disabled={submitting || !booking}>
                {submitting ? "Submitting report..." : "Submit report"}
              </Button>
            </form>
          </Panel>
        </>
      ) : (
        <Notice>The selected booking could not be loaded.</Notice>
      )}
    </div>
  );
};

export default SupportPage;
