import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import {
  JOB_APPLICATION_STATUS_BADGE_CLASS,
  JOB_APPLICATION_STATUS_LABELS,
} from "../../api/babysitterApi";
import type { BabysitterJobApplication } from "../../api/babysitterApi";

const BabysitterMyApplicationsComponent = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<BabysitterJobApplication[]>([]);

  useEffect(() => {
    babysitterApi.getMyApplications().then(setList);
  }, []);

  const handleCancel = async (
    e: MouseEvent,
    jobNo: number,
    applicationNo: number,
  ) => {
    e.stopPropagation();

    if (!window.confirm("지원을 취소하시겠습니까?")) return;

    await babysitterApi.cancelJobApplication(jobNo, applicationNo);
    setList((prev) =>
      prev.map((a) =>
        a.applicationNo === applicationNo ? { ...a, status: "CANCELED" } : a,
      ),
    );
  };

  return (
    <div>
      <button
        type="button"
        className="btn ghost sitter-back-link"
        onClick={() => navigate("/community/babysitter/jobs")}
      >
        ← 구인글 목록으로
      </button>

      {list.length === 0 && <div className="empty-hint">지원한 구인글이 없습니다.</div>}

      <div className="sitter-list">
        {list.map((a) => (
          <article
            key={a.applicationNo}
            className="card sitter-row"
            onClick={() =>
              navigate(`/community/babysitter/jobs/${a.jobNo}`, {
                state: { fromApplications: true, applicationNo: a.applicationNo },
              })
            }
          >
            <div className="sitter-row-body">
              <div className="name-row">
                {a.jobTitle ?? "삭제된 구인글"}
                <span className={`badge ${JOB_APPLICATION_STATUS_BADGE_CLASS[a.status]}`}>
                  {JOB_APPLICATION_STATUS_LABELS[a.status]}
                </span>
              </div>
              {a.message && <div className="meta">{a.message}</div>}
              {a.status === "PENDING" && (
                <button
                  type="button"
                  className="btn ghost"
                  onClick={(e) => handleCancel(e, a.jobNo, a.applicationNo)}
                >
                  지원 취소
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default BabysitterMyApplicationsComponent;
