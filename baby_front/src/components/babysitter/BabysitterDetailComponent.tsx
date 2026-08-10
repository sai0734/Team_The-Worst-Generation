import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import {
  DAY_OF_WEEK_LABELS,
  GRADE_LABELS,
  TIME_SLOT_LABELS,
} from "../../api/babysitterApi";
import type {
  BabysitterProfile,
  BabysitterRequest,
  BabysitterReview,
  DayOfWeek,
  TimeSlot,
} from "../../api/babysitterApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const DAYS = Object.keys(DAY_OF_WEEK_LABELS) as DayOfWeek[];
const SLOTS = Object.keys(TIME_SLOT_LABELS) as TimeSlot[];

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

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestDate, setRequestDate] = useState("");
  const [requestTimeSlot, setRequestTimeSlot] = useState<TimeSlot>("MORNING");
  const [requestMessage, setRequestMessage] = useState("");

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

  const handleSendRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!requestDate) {
      alert("희망 날짜를 선택해주세요.");
      return;
    }

    try {
      await babysitterApi.registerRequest({
        sitterEmail: email,
        requestDate,
        timeSlot: requestTimeSlot,
        message: requestMessage || undefined,
      });
      alert("선정 요청을 보냈습니다. 시터가 수락하면 알 수 있어요.");
      setShowRequestForm(false);
      setRequestDate("");
      setRequestMessage("");
    } catch (err) {
      console.error(err);
      alert(`요청에 실패했습니다.\n(${describeError(err)})`);
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
      <div className="flex gap-3 items-center">
        {profile.profileImageFileName && (
          <img
            src={babysitterApi.getFileUrl(profile.profileImageFileName)}
            className="w-20 h-20 rounded-full object-cover"
          />
        )}
        <h2 className="text-xl font-bold">
          {profile.name}{" "}
          <span className="text-sm bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
            {GRADE_LABELS[profile.grade]}
          </span>
        </h2>
      </div>

      <div className="my-1">
        픽 {pickCount}명
        {profile.averageRating != null && (
          <> · ★{profile.averageRating.toFixed(1)} (후기 {profile.reviewCount}개)</>
        )}
        {isLogin && !isMine && (
          <button onClick={handleTogglePick} className="ml-2">
            {picked ? "픽 취소" : "픽하기"}
          </button>
        )}
      </div>

      <div>경력 {profile.careerYears}년</div>
      <div>지역: {profile.region ?? "미입력"}</div>

      <div className="my-2">
        가능 요일/시간대:{" "}
        {profile.availability.length === 0 ? (
          "미입력"
        ) : (
          DAYS.filter((day) =>
            profile.availability.some((a) => a.dayOfWeek === day),
          )
            .map(
              (day) =>
                `${DAY_OF_WEEK_LABELS[day]}(${profile.availability
                  .filter((a) => a.dayOfWeek === day)
                  .map((a) => TIME_SLOT_LABELS[a.timeSlot])
                  .join("/")})`,
            )
            .join(", ")
        )}
      </div>

      {profile.availableTime && <div>참고: {profile.availableTime}</div>}
      <div>
        시급: {profile.hourlyRate ? `${profile.hourlyRate.toLocaleString()}원` : "협의"}
      </div>
      <p className="whitespace-pre-wrap">{profile.intro}</p>

      {isLogin && !isMine && (
        <div className="my-3">
          <button onClick={() => setShowRequestForm((v) => !v)}>선정하기</button>

          {showRequestForm && (
            <form onSubmit={handleSendRequest} className="mt-2 flex flex-col gap-2 max-w-xs">
              <label>
                희망 날짜
                <input
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  required
                />
              </label>
              <label>
                시간대
                <select
                  value={requestTimeSlot}
                  onChange={(e) => setRequestTimeSlot(e.target.value as TimeSlot)}
                >
                  {SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {TIME_SLOT_LABELS[slot]}
                    </option>
                  ))}
                </select>
              </label>
              <textarea
                placeholder="시터에게 남길 메시지 (선택)"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
              />
              <button type="submit">요청 보내기</button>
            </form>
          )}
        </div>
      )}

      {isMine && (
        <button onClick={() => navigate("/community/babysitter/me/edit")}>
          내 프로필 수정
        </button>
      )}

      {reviewableRequests.length > 0 && (
        <div className="my-3 border p-2">
          <p className="font-bold">후기 작성 가능한 요청이 있어요</p>
          {reviewableRequests.map((r) => (
            <div key={r.requestNo} className="flex items-center gap-2 my-1">
              <span>{r.requestDate} ({TIME_SLOT_LABELS[r.timeSlot]})</span>
              <button onClick={() => setReviewTargetRequestNo(r.requestNo)}>
                후기 작성
              </button>
            </div>
          ))}
        </div>
      )}

      {reviewTargetRequestNo && (
        <form onSubmit={handleSubmitReview} className="my-3 flex flex-col gap-2 max-w-xs border p-2">
          <label>
            평점
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
          </label>
          <textarea
            placeholder="후기 내용"
            value={reviewContent}
            onChange={(e) => setReviewContent(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="submit">등록</button>
            <button type="button" onClick={() => setReviewTargetRequestNo(null)}>
              취소
            </button>
          </div>
        </form>
      )}

      <h3 className="font-bold mt-5">후기 {reviews.length}</h3>
      <ul>
        {reviews.map((r) => (
          <li key={r.reviewNo} className="border-b py-2">
            <div>
              {r.writerNickname ?? "익명"} · ★{r.rating}
            </div>
            {r.content && <div>{r.content}</div>}
          </li>
        ))}
      </ul>

      <div>
        <button onClick={() => navigate("/community/babysitter")}>목록으로</button>
      </div>
    </div>
  );
};

export default BabysitterDetailComponent;
