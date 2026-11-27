import { useEffect, useState } from "react";
import ReviewCard from "../components/ReviewCard";
import { errorMessage } from "../api/client";
import { ratingsApi } from "../api/ratings";
import { useAuth, userId } from "../context/AuthContext";
import { Button, EmptyState, Field, Notice, PageHeading, Panel, Spinner } from "../components/UI";

const RatingsPage = () => {
  const { user } = useAuth();
  const [mine, setMine] = useState([]);
  const [userIdInput, setUserIdInput] = useState("");
  const [rideIdInput, setRideIdInput] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [newRating, setNewRating] = useState("5");
  const [newReview, setNewReview] = useState("");
  const [userResult, setUserResult] = useState(null);
  const [rideReviews, setRideReviews] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editRating, setEditRating] = useState("5");
  const [editReview, setEditReview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadMine = async () => setMine(await ratingsApi.mine());
  useEffect(() => {
    let active = true;
    ratingsApi.mine()
      .then((items) => { if (active) setMine(items); })
      .catch((requestError) => { if (active) setError(errorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const submitReview = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await ratingsApi.create({
        bookingId: bookingId.trim(),
        rating: Number(newRating),
        ...(newReview.trim() ? { review: newReview.trim() } : {}),
      });
      setSuccess(result.message);
      setBookingId("");
      setNewReview("");
      await loadMine();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const viewUser = async (event) => {
    event.preventDefault();
    setError("");
    setUserResult(null);
    try {
      setUserResult(await ratingsApi.forUser(userIdInput.trim()));
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  const viewRide = async (event) => {
    event.preventDefault();
    setError("");
    setRideReviews([]);
    try {
      const result = await ratingsApi.forRide(rideIdInput.trim());
      setRideReviews(result.reviews);
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  const beginEdit = (review) => {
    setEditing(review._id);
    setEditRating(String(review.rating));
    setEditReview(review.review || "");
    setError("");
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await ratingsApi.update(editing, {
        rating: Number(editRating),
        review: editReview,
      });
      setEditing(null);
      setSuccess("Review updated.");
      await loadMine();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review? This will update the recipient's rating.")) return;
    setBusy(true);
    setError("");
    try {
      await ratingsApi.remove(reviewId);
      setSuccess("Review deleted.");
      await loadMine();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <PageHeading eyebrow="COMMUNITY TRUST" title="Ratings & reviews" description="Share fair feedback after completed rides and explore reviews you're authorized to see." />
      {error && <Notice>{error}</Notice>}
      {success && <Notice type="success">{success}</Notice>}
      <div className="content-grid ratings-tools">
        <Panel title="Submit a review">
          <form className="form-stack" onSubmit={submitReview}>
            <Field label="Completed booking ID" required value={bookingId} onChange={(e) => setBookingId(e.target.value)} hint="The backend derives the reviewer, recipient, and ride from this booking." />
            <label className="field"><span>Rating</span><select value={newRating} onChange={(event) => setNewRating(event.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label>
            <label className="field"><span>Review (optional)</span><textarea rows={2} maxLength={1000} value={newReview} onChange={(event) => setNewReview(event.target.value)} /></label>
            <Button type="submit" disabled={busy || !bookingId.trim()}>{busy ? "Submitting..." : "Submit review"}</Button>
          </form>
        </Panel>
        <Panel title="View a user's reviews">
          <form className="inline-form" onSubmit={viewUser}>
            <Field label="User ID" required value={userIdInput} onChange={(e) => setUserIdInput(e.target.value)} />
            <Button type="submit">View</Button>
          </form>
          {userResult && <div className="lookup-result"><strong>{userResult.user.name}</strong><span>{userResult.ratingAverage.toFixed(2)} average · {userResult.reviewCount} reviews</span>{userResult.reviews.map((review) => <ReviewCard key={review._id} review={review} />)}</div>}
        </Panel>
        <Panel title="View ride reviews">
          <form className="inline-form" onSubmit={viewRide}>
            <Field label="Ride ID" required value={rideIdInput} onChange={(e) => setRideIdInput(e.target.value)} />
            <Button type="submit">View</Button>
          </form>
          {rideReviews.map((review) => <ReviewCard key={review._id} review={review} />)}
        </Panel>
      </div>

      <Panel title={`Reviews submitted by ${user?.name || "you"}`}>
        {loading ? <Spinner /> : mine.length ? (
          <div className="review-list">
            {mine.map((review) => (
              <div key={review._id}>
                <ReviewCard
                  review={review}
                  actions={<>
                    <button className="text-button" type="button" disabled={busy} onClick={() => beginEdit(review)}>Edit</button>
                    <button className="text-button danger-text" type="button" disabled={busy} onClick={() => deleteReview(review._id)}>Delete</button>
                  </>}
                />
                {editing === review._id && (
                  <form className="edit-review-form" onSubmit={saveEdit}>
                    <label className="field"><span>Rating</span><select value={editRating} onChange={(e) => setEditRating(e.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label>
                    <label className="field"><span>Review</span><textarea rows={3} maxLength={1000} value={editReview} onChange={(e) => setEditReview(e.target.value)} /></label>
                    <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save review"}</Button>
                    <button className="text-button" type="button" onClick={() => setEditing(null)}>Discard</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        ) : <EmptyState illustration="bookings" title="No reviews submitted" description="Completed rides with confirmed bookings become eligible for feedback." />}
      </Panel>
      <p className="field-note">Signed in as {userId(user)}. The server verifies booking completion and ownership for every review operation.</p>
    </div>
  );
};

export default RatingsPage;
