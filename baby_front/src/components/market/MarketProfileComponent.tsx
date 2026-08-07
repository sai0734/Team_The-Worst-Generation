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
    return <div>불러오는 중...</div>;
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
    <div>
      <h2>{email}</h2>
      <div>매너온도: {profile.mannerTemp}°C</div>
      <div>동네: {profile.locationName ?? "미인증"}</div>

      <h3>받은 후기 {reviews.length}</h3>
      <ul>
        {reviews.map((review) => (
          <li key={review.reviewNo}>
            <div>{"★".repeat(review.rating)}</div>
            <div>{review.content}</div>
          </li>
        ))}
      </ul>

      {isLogin && !isMine && (
        <form onSubmit={handleSubmitReview}>
          <p>후기 작성</p>
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
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button type="submit">등록</button>
        </form>
      )}
    </div>
  );
};

export default MarketProfileComponent;
