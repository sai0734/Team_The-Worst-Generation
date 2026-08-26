import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as marketProfileApi from "../../api/marketProfileApi";
import type { MarketProfile } from "../../api/marketProfileApi";
import * as reviewApi from "../../api/reviewApi";
import type { Review } from "../../api/reviewApi";
import "../../styles/market.css";

const MarketProfileComponent = () => {
  const { email } = useParams();

  const [profile, setProfile] = useState<MarketProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!email) {
      return;
    }
    marketProfileApi.getProfile(email).then(setProfile);
    reviewApi.getReviewList(email).then(setReviews);
  }, [email]);

  if (!profile || !email) {
    return <div className="card">불러오는 중...</div>;
  }

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h2 style={{ marginTop: 0 }}>{profile.nickname || email}</h2>
      <div className="detail-meta">매너온도: {profile.mannerTemp}°C</div>
      <div className="detail-meta">
        동네: {profile.locationName ?? "미인증"}
      </div>

      <h3>받은 평가 {reviews.length}</h3>
      {reviews.map((review) => (
        <div
          className="list-row"
          key={review.reviewNo}
          style={{ display: "block" }}
        >
          {review.tempDelta != null && (
            <div>
              온도 {review.tempDelta > 0 ? "+" : ""}
              {review.tempDelta.toFixed(1)}°C
            </div>
          )}
          {review.rating != null && <div>{"★".repeat(review.rating)}</div>}
          {review.content && <div>{review.content}</div>}
        </div>
      ))}
    </div>
  );
};

export default MarketProfileComponent;
