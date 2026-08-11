import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as marketProfileApi from "../../api/marketProfileApi";
import type { MarketProfile } from "../../api/marketProfileApi";
import * as reviewApi from "../../api/reviewApi";
import type { Review } from "../../api/reviewApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const MarketProfileComponent = () => {
  const { email } = useParams();
  const { isLogin, loginState } = useCustomLogin();

  const [profile, setProfile] = useState<MarketProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");

  const loadAll = async () => {
    if (!email) {
      return;
    }
    setProfile(await marketProfileApi.getProfile(email));
    setReviews(await reviewApi.getReviewList(email));
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  if (!profile || !email) {
    return <div className="card">불러오는 중...</div>;
  }

  const isMine = loginState.email === email;

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      return;
    }

    await reviewApi.registerReview({ targetEmail: email, rating, content });
    setContent("");
    await loadAll();
  };

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h2 style={{ marginTop: 0 }}>{email}</h2>
      <div className="detail-meta">매너온도: {profile.mannerTemp}°C</div>
      <div className="detail-meta">
        동네: {profile.locationName ?? "미인증"}
      </div>

      <h3>받은 후기 {reviews.length}</h3>
      {reviews.map((review) => (
        <div
          className="list-row"
          key={review.reviewNo}
          style={{ display: "block" }}
        >
          <div>{"★".repeat(review.rating)}</div>
          <div>{review.content}</div>
        </div>
      ))}

      {isLogin && !isMine && (
        <form onSubmit={handleSubmitReview} style={{ marginTop: 16 }}>
          <div className="form-field">
            <label>후기 작성</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}점
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
          </div>
          <button type="submit" className="btn">
            등록
          </button>
        </form>
      )}
    </div>
  );
};

export default MarketProfileComponent;
