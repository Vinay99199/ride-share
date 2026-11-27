import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { errorMessage } from "../api/client";
import { ratingsApi } from "../api/ratings";
import ReviewCard from "../components/ReviewCard";
import {
  EmptyState,
  Notice,
  PageHeading,
  Panel,
  Spinner,
  Stars,
  formatDate,
} from "../components/UI";

const DriverReviewsPage = () => {
  const { userId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    ratingsApi
      .forUser(userId)
      .then((profile) => {
        if (active) setResult(profile);
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
  }, [userId]);

  const distribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: result?.reviews?.filter((review) => review.rating === rating).length ?? 0,
      })),
    [result]
  );

  return (
    <div className="page">
      <PageHeading
        eyebrow="DRIVER PROFILE"
        title={result?.user?.name ? `${result.user.name}'s reviews` : "Driver reviews"}
        description="Read verified feedback from completed rides in the AVONEX community."
        action={<Link className="button button-outline" to="/rides">Find rides</Link>}
      />
      {error && <Notice>{error}</Notice>}
      {loading ? <Spinner label="Loading driver reviews..." /> : result ? (
        <>
          <div className="driver-review-summary">
            <Panel title="Average rating">
              <div className="driver-review-average">
                <strong>{Number(result.ratingAverage).toFixed(2)}</strong>
                <Stars value={result.ratingAverage} />
                <span>{result.reviewCount} received review{result.reviewCount === 1 ? "" : "s"}</span>
              </div>
            </Panel>
            <Panel title="Rating distribution">
              <div className="rating-distribution">
                {distribution.map(({ rating, count }) => (
                  <div className="rating-distribution-row" key={rating}>
                    <span>{rating} stars</span>
                    <span className="rating-distribution-track">
                      <span
                        style={{
                          width: `${result.reviewCount ? (count / result.reviewCount) * 100 : 0}%`,
                        }}
                      />
                    </span>
                    <b>{count}</b>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          <Panel title="Passenger feedback">
            {result.reviews.length ? (
              <div className="review-list">
                {result.reviews.map((review) => (
                  <div className="driver-review-item" key={review._id}>
                    <ReviewCard review={review} />
                    {review.ride && (
                      <Link className="text-link" to={`/rides/${review.ride}`}>
                        Related ride · {formatDate(review.createdAt)} →
                      </Link>
                    )}
                  </div>
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
        </>
      ) : (
        <EmptyState illustration="verification" title="Driver profile unavailable" description={error || "No review profile was found for this account."} />
      )}
    </div>
  );
};

export default DriverReviewsPage;
