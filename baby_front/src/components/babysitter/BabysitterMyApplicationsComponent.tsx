import { useEffect, useState } from "react";
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

  return (
    <div>
      {list.length === 0 && <div className="empty-hint">지원한 구인글이 없습니다.</div>}

      <div className="sitter-list">
        {list.map((a) => (
          <article
            key={a.applicationNo}
            className="card sitter-row"
            onClick={() => navigate(`/community/babysitter/jobs/${a.jobNo}`)}
          >
            <div className="sitter-row-body">
              <div className="name-row">
                {a.jobTitle ?? "삭제된 구인글"}
                <span className={`badge ${JOB_APPLICATION_STATUS_BADGE_CLASS[a.status]}`}>
                  {JOB_APPLICATION_STATUS_LABELS[a.status]}
                </span>
              </div>
              {a.message && <div className="meta">{a.message}</div>}
            </div>
          </article>
        ))}
      </div>

      <div className="sitter-back-link">
        <button type="button" className="btn ghost" onClick={() => navigate("/community/babysitter/jobs")}>
          구인글 목록으로
        </button>
      </div>
    </div>
  );
};

export default BabysitterMyApplicationsComponent;
