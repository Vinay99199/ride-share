import { useState } from "react";
import { ratingsApi } from "../api/ratings";
import { errorMessage } from "../api/client";
import { Button, Notice } from "./UI";

const ReviewForm = ({ bookingId, onSubmitted, recipient }) => {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await ratingsApi.create({
        bookingId,
        rating: Number(rating),
        ...(review.trim() ? { review: review.trim() } : {}),
      });
      setSuccess(result.message);
      await onSubmitted?.(result.rating);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="review-form" onSubmit={submit}>
      <div className="review-form-title">
        <strong>Rate {recipient || "this trip"}</strong>
        <span>Only available after the ride is completed.</span>
      </div>
      <label className="field compact-field">
        <span>Rating</span>
        <select value={rating} onChange={(event) => setRating(event.target.value)}>
          {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}
        </select>
      </label>
      <label className="field compact-field">
        <span>Review (optional)</span>
        <textarea maxLength={1000} rows={2} value={review} onChange={(event) => setReview(event.target.value)} placeholder="Share a helpful note..." />
      </label>
      <Notice>{error}</Notice>
      <Notice type="success">{success}</Notice>
      <Button type="submit" disabled={busy}>{busy ? "Submitting..." : "Submit review"}</Button>
    </form>
  );
};

export default ReviewForm;
