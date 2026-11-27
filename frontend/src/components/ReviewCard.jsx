import { formatDate, Stars } from "./UI";
import { UserAvatar } from "./VisualAssets";

const ReviewCard = ({ review, actions }) => (
  <article className="review-card">
    <UserAvatar name={review.reviewer?.name || review.reviewee?.name} />
    <div className="review-content">
      <div className="review-topline">
        <strong>{review.reviewer?.name || review.reviewee?.name || "Community member"}</strong>
        <span className="muted">{formatDate(review.createdAt)}</span>
      </div>
      <Stars value={review.rating} />
      {review.review && <p>{review.review}</p>}
      {actions && <div className="review-actions">{actions}</div>}
    </div>
  </article>
);

export default ReviewCard;
