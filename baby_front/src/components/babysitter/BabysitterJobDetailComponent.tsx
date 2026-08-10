import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import {
  JOB_APPLICATION_STATUS_LABELS,
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
  const { isLogin, loginState } = useCustomLogin();

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
        setMyApplication(list.find((a) => a.jobNo === Number(jobNo)) ?? null);
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
      <h2 className="text-xl font-bold">{job.title}</h2>
      <div className="text-sm text-gray-500">
        {job.parentNickname ?? "익명"} · {JOB_STATUS_LABELS[job.status]}
      </div>

      <div className="my-2">
        {job.desiredDate} ({TIME_SLOT_LABELS[job.timeSlot]}) · {job.region ?? "지역 미입력"}
      </div>
      <div>{job.hourlyRate ? `시급 ${job.hourlyRate.toLocaleString()}원` : "시급 협의"}</div>
      {job.message && <p className="whitespace-pre-wrap my-2">{job.message}</p>}

      {isMine && job.status === "OPEN" && (
        <button onClick={handleCancelJob} className="my-2">
          구인글 취소
        </button>
      )}

      {isLogin && !isMine && job.status === "OPEN" && (
        <div className="my-3">
          {myApplication ? (
            <div>
              내 지원 상태: {JOB_APPLICATION_STATUS_LABELS[myApplication.status]}
            </div>
          ) : (
            <form onSubmit={handleApply} className="flex flex-col gap-2 max-w-xs">
              <textarea
                placeholder="지원 메시지 (선택)"
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
              />
              <button type="submit">지원하기</button>
            </form>
          )}
        </div>
      )}

      {isMine && (
        <div className="my-3">
          <h3 className="font-bold">지원자 {applications.length}명</h3>
          <ul>
            {applications.map((a) => (
              <li key={a.applicationNo} className="border-b py-2">
                <div className="font-bold">
                  {a.sitterName ?? "탈퇴한 시터"} · {JOB_APPLICATION_STATUS_LABELS[a.status]}
                </div>
                {a.message && <div>{a.message}</div>}
                {a.status === "PENDING" && job.status === "OPEN" && (
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => handleAccept(a.applicationNo)}>수락</button>
                    <button onClick={() => handleReject(a.applicationNo)}>거절</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={() => navigate("/community/babysitter/jobs")}>
        구인글 목록으로
      </button>
    </div>
  );
};

export default BabysitterJobDetailComponent;
