import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import * as babysitterChatApi from "../../api/babysitterChatApi";
import {
  DAY_OF_WEEK_LABELS,
  gradeLevelBadgeClass,
  gradeLevelLabel,
  TIME_SLOT_LABELS,
} from "../../api/babysitterApi";
import type {
  BabysitterProfile,
  BabysitterRequest,
  BabysitterReview,
  DayOfWeek,
} from "../../api/babysitterApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const DAYS = Object.keys(DAY_OF_WEEK_LABELS) as DayOfWeek[];

const describeError = (err: any): string =>
  err?.response?.data?.error ||
  err?.response?.data?.msg ||
  err?.message ||
  "알 수 없는 오류";

const BabysitterDetailComponent = () => {
  const { email } = useParams();
  const navigate = useNavigate();
  const { isLogin, loginState } = useCustomLogin();

  const [profile, setProfile] = useState<BabysitterProfile | null>(null);
  const [picked, setPicked] = useState(false);
  const [pickCount, setPickCount] = useState(0);
  const [reviews, setReviews] = useState<BabysitterReview[]>([]);
  const [reviewableRequests, setReviewableRequests] = useState<BabysitterRequest[]>([]);

  const [reviewTargetRequestNo, setReviewTargetRequestNo] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");

  const loadReviews = () => {
    if (!email) {
      return;
    }
    babysitterApi.getReviewsBySitter(email).then(setReviews);
  };

  useEffect(() => {
    if (!email) {
      return;
    }

    babysitterApi.getOne(email).then((p) => {
      setProfile(p);
      setPickCount(p.pickCount);
    });

    loadReviews();

    if (isLogin && loginState.email !== email) {
      babysitterApi.isPicked(email).then(setPicked);
      babysitterApi.getSentRequests().then((list) => {
        setReviewableRequests(
          list.filter(
            (r) => r.sitterEmail === email && r.status === "ACCEPTED" && !r.reviewed,
          ),
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  if (!profile || !email) {
    return <div>불러오는 중...</div>;
  }

  const isMine = loginState.email === profile.email;

  const handleTogglePick = async () => {
    try {
      const res = await babysitterApi.togglePick(email);
      setPicked(res.picked);
      setPickCount((prev) => prev + (res.picked ? 1 : -1));
    } catch (err) {
      console.error(err);
      alert(describeError(err));
    }
  };

  const handleStartChat = async () => {
    try {
      const room = await babysitterChatApi.getOrCreateRoom(email);
      navigate(`/community/babysitter/chat/${room.roomNo}`);
    } catch (err) {
      console.error(err);
      alert(describeError(err));
    }
  };

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!reviewTargetRequestNo) {
      return;
    }

    try {
      await babysitterApi.registerReview({
        requestNo: reviewTargetRequestNo,
        rating: reviewRating,
        content: reviewContent || undefined,
      });
      alert("후기를 등록했습니다.");
      setReviewTargetRequestNo(null);
      setReviewContent("");
      setReviewRating(5);
      setReviewableRequests((prev) =>
        prev.filter((r) => r.requestNo !== reviewTargetRequestNo),
      );
      loadReviews();
    } catch (err) {
      console.error(err);
      alert(`후기 등록에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  return (
    <div>
      <div className="card sitter-detail-card">
        <div className="sitter-detail-header">
          {profile.profileImageFileName && (
            <img
              src={babysitterApi.getFileUrl(profile.profileImageFileName)}
              className="sitter-avatar-lg"
            />
          )}
          <div>
            <h2>
              {profile.name}
              <span className={`community-badge ${gradeLevelBadgeClass(profile.gradeLevel)}`}>
                {gradeLevelLabel(profile.gradeLevel)}
              </span>
            </h2>
            <div className="sitter-detail-stats">
              <span className="badge safe">찜 {pickCount}명</span>
              <span className="badge pending">선정 {profile.selectionCount}회</span>
              {profile.averageRating != null && (
                <span className="badge pending">
                  ★{profile.averageRating.toFixed(1)} (후기 {profile.reviewCount}개)
                </span>
              )}
            </div>
          </div>
        </div>

        <dl className="detail-list" style={{ marginTop: 14 }}>
          <dt>경력</dt>
          <dd>{profile.careerYears}년</dd>

          <dt>지역</dt>
          <dd>{profile.region ?? "미입력"}</dd>

          <dt>가능시간</dt>
          <dd>
            {profile.availability.length === 0
              ? "미입력"
              : DAYS.filter((day) =>
                  profile.availability.some((a) => a.dayOfWeek === day),
                )
                  .map(
                    (day) =>
                      `${DAY_OF_WEEK_LABELS[day]}(${profile.availability
                        .filter((a) => a.dayOfWeek === day)
                        .map((a) => TIME_SLOT_LABELS[a.timeSlot])
                        .join("/")})`,
                  )
                  .join(", ")}
          </dd>

          {profile.availableTime && (
            <>
              <dt>참고</dt>
              <dd>{profile.availableTime}</dd>
            </>
          )}

          <dt>시급</dt>
          <dd>{profile.hourlyRate ? `${profile.hourlyRate.toLocaleString()}원` : "협의"}</dd>
        </dl>

        {profile.intro && <p className="sitter-detail-intro">{profile.intro}</p>}

        {isLogin && !isMine && (
          <div className="sitter-actions">
            <button type="button" className="btn ghost" onClick={handleTogglePick}>
              {picked ? "찜 취소" : "찜하기"}
            </button>
            <button type="button" className="btn ghost" onClick={handleStartChat}>
              채팅하기
            </button>
          </div>
        )}

        {isMine && (
          <div className="sitter-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => navigate("/community/babysitter/me/edit")}
            >
              내 프로필 수정
            </button>
          </div>
        )}
      </div>

      {reviewableRequests.length > 0 && (
        <div className="card" style={{ margin: "14px 0" }}>
          <p style={{ fontWeight: 800, margin: "0 0 8px" }}>후기 작성 가능한 요청이 있어요</p>
          {reviewableRequests.map((r) => (
            <div key={r.requestNo} className="sitter-actions" style={{ margin: "4px 0" }}>
              <span className="meta">{r.requestDate} ({TIME_SLOT_LABELS[r.timeSlot]})</span>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setReviewTargetRequestNo(r.requestNo)}
              >
                후기 작성
              </button>
            </div>
          ))}
        </div>
      )}

      {reviewTargetRequestNo && (
        <form onSubmit={handleSubmitReview} className="card recall-form" style={{ margin: "14px 0", maxWidth: 360 }}>
          <div className="field">
            <label>평점</label>
            <select
              value={reviewRating}
              onChange={(e) => setReviewRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}점
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>후기 내용</label>
            <textarea
              className="bulk-input"
              style={{ minHeight: 80 }}
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
            />
          </div>
          <div className="sitter-actions">
            <button type="submit" className="btn">
              등록
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setReviewTargetRequestNo(null)}
            >
              취소
            </button>
          </div>
        </form>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 10px" }}>
          후기 {reviews.length}
        </h3>
        <div className="sitter-review-list">
          {reviews.map((r) => (
            <div key={r.reviewNo} className="sitter-review">
              <div className="head">
                <span>{r.writerNickname ?? "익명"}</span>
                <span className="rating">★{r.rating}</span>
              </div>
              {r.content && <div className="content">{r.content}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="sitter-back-link">
        <button type="button" className="btn ghost" onClick={() => navigate("/community/babysitter")}>
          목록으로
        </button>
      </div>
    </div>
  );
};

export default BabysitterDetailComponent;
