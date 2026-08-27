import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import {
  DAY_OF_WEEK_LABELS,
  JOB_APPLICATION_STATUS_BADGE_CLASS,
  JOB_APPLICATION_STATUS_LABELS,
  JOB_STATUS_BADGE_CLASS,
  JOB_STATUS_LABELS,
  TIME_SLOT_LABELS,
} from "../../api/babysitterApi";
import type {
  BabysitterJobApplication,
  BabysitterJobPost,
} from "../../api/babysitterApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const describeError = (err: any): string =>
  err?.response?.data?.error ||
  err?.response?.data?.msg ||
  err?.message ||
  "알 수 없는 오류";

const BabysitterJobDetailComponent = () => {
  const { jobNo } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLogin, loginState } = useCustomLogin();

  // 지원내역 목록에서 들어온 경우 - 재지원 유도 없이, 그때 그 지원 건의 결과만 그대로 보여주는 읽기 전용 화면
  const navState = location.state as
    | { fromApplications?: boolean; applicationNo?: number }
    | null;
  const cameFromApplications = Boolean(navState?.fromApplications);

  const [job, setJob] = useState<BabysitterJobPost | null>(null);
  const [applications, setApplications] = useState<BabysitterJobApplication[]>([]);
  const [myApplication, setMyApplication] = useState<BabysitterJobApplication | null>(null);
  const [applyMessage, setApplyMessage] = useState("");

  const isMine = job != null && loginState.email === job.parentEmail;

  const load = async () => {
    if (!jobNo) {
      return;
    }

    const jobData = await babysitterApi.getJobOne(Number(jobNo));
    setJob(jobData);

    if (!isLogin) {
      return;
    }

    if (loginState.email === jobData.parentEmail) {
      babysitterApi.getJobApplications(Number(jobNo)).then(setApplications);
    } else {
      babysitterApi.getMyApplications().then((list) => {
        if (cameFromApplications) {
          // 지원내역에서 클릭한 그 지원 건 그대로 보여줌 (취소됐어도 재지원 폼으로 안 바꿈)
          setMyApplication(
            list.find((a) => a.applicationNo === navState?.applicationNo) ??
              list.find((a) => a.jobNo === Number(jobNo)) ??
              null,
          );
        } else {
          // 구인글 목록 등에서 들어온 경우 - 취소된(CANCELED) 지원은 없는 셈 치고 재지원 폼을 보여줌
          setMyApplication(
            list.find((a) => a.jobNo === Number(jobNo) && a.status !== "CANCELED") ?? null,
          );
        }
      });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobNo]);

  if (!job || !jobNo) {
    return <div>불러오는 중...</div>;
  }

  const handleApply = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await babysitterApi.applyToJob(Number(jobNo), applyMessage || undefined);
      alert("지원했습니다.");
      setApplyMessage("");
      load();
    } catch (err) {
      console.error(err);
      alert(`지원에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  const handleCancelJob = async () => {
    if (!confirm("구인글을 취소할까요?")) {
      return;
    }
    try {
      await babysitterApi.cancelJobPost(Number(jobNo));
      load();
    } catch (err) {
      console.error(err);
      alert(`취소에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  const handleAccept = async (applicationNo: number) => {
    try {
      await babysitterApi.acceptJobApplication(Number(jobNo), applicationNo);
      load();
    } catch (err) {
      console.error(err);
      alert(`수락에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  const handleReject = async (applicationNo: number) => {
    try {
      await babysitterApi.rejectJobApplication(Number(jobNo), applicationNo);
      load();
    } catch (err) {
      console.error(err);
      alert(`거절에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  return (
    <div>
      <span className={`badge ${JOB_STATUS_BADGE_CLASS[job.status]}`} style={{ marginBottom: 6, display: "inline-flex" }}>
        {JOB_STATUS_LABELS[job.status]}
      </span>
      <h2 className="community-detail-title">{job.title}</h2>
      <div className="community-detail-meta">{job.parentNickname ?? "익명"}</div>

      <div className="sitter-detail-meta" style={{ margin: "0 0 14px" }}>
        {job.desiredDays.map((d) => DAY_OF_WEEK_LABELS[d]).join(", ")} ({TIME_SLOT_LABELS[job.timeSlot]}) · {job.region ?? "지역 미입력"}
        <br />
        {job.hourlyRate ? `시급 ${job.hourlyRate.toLocaleString()}원` : "시급 협의"}
      </div>
      {job.message && <p className="sitter-detail-intro">{job.message}</p>}

      {isMine && job.status === "OPEN" && (
        <button type="button" className="btn ghost" style={{ marginBottom: 8 }} onClick={handleCancelJob}>
          구인글 취소
        </button>
      )}

      {isLogin && !isMine && job.status === "OPEN" && (
        <div className="card" style={{ margin: "14px 0" }}>
          {myApplication ? (
            <div className="meta">
              내 지원 상태:{" "}
              <span className={`badge ${JOB_APPLICATION_STATUS_BADGE_CLASS[myApplication.status]}`}>
                {JOB_APPLICATION_STATUS_LABELS[myApplication.status]}
              </span>
            </div>
          ) : (
            <form onSubmit={handleApply} className="recall-form">
              <div className="field">
                <label>지원 메시지 (선택)</label>
                <textarea
                  className="bulk-input"
                  style={{ minHeight: 80 }}
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                />
              </div>
              <button type="submit" className="btn">
                지원하기
              </button>
            </form>
          )}
        </div>
      )}

      {isMine && (
        <div className="card" style={{ margin: "14px 0" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 10px" }}>
            지원자 {applications.length}명
          </h3>
          <div className="sitter-review-list">
            {applications.map((a) => (
              <div key={a.applicationNo} className="sitter-review">
                <div className="head">
                  <span>{a.sitterName ?? "탈퇴한 시터"}</span>
                  <span className={`badge ${JOB_APPLICATION_STATUS_BADGE_CLASS[a.status]}`}>
                    {JOB_APPLICATION_STATUS_LABELS[a.status]}
                  </span>
                </div>
                {a.message && <div className="content">{a.message}</div>}
                {a.status === "PENDING" && job.status === "OPEN" && (
                  <div className="sitter-actions" style={{ margin: "6px 0 0" }}>
                    <button type="button" className="btn" onClick={() => handleAccept(a.applicationNo)}>
                      수락
                    </button>
                    <button type="button" className="btn ghost" onClick={() => handleReject(a.applicationNo)}>
                      거절
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sitter-back-link">
        <button type="button" className="btn ghost" onClick={() => navigate(-1)}>
          ← 이전으로
        </button>
      </div>
    </div>
  );
};

export default BabysitterJobDetailComponent;
