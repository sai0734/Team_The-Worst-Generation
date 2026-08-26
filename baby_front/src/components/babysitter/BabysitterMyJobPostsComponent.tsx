import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import {
  DAY_OF_WEEK_LABELS,
  JOB_STATUS_BADGE_CLASS,
  JOB_STATUS_LABELS,
  TIME_SLOT_LABELS,
} from "../../api/babysitterApi";
import type { BabysitterJobPost } from "../../api/babysitterApi";

const BabysitterMyJobPostsComponent = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<BabysitterJobPost[]>([]);

  useEffect(() => {
    babysitterApi.getMyJobPosts().then(setList);
  }, []);

  return (
    <div>
      <button
        type="button"
        className="btn ghost sitter-back-link"
        onClick={() => navigate("/community/babysitter/jobs")}
      >
        ← 구인글 목록으로
      </button>

      {list.length === 0 && <div className="empty-hint">등록한 구인글이 없습니다.</div>}

      <div className="sitter-list">
        {list.map((job) => (
          <article
            key={job.jobNo}
            className="card sitter-row"
            onClick={() => navigate(`/community/babysitter/jobs/${job.jobNo}`)}
          >
            <div className="sitter-row-body">
              <div className="name-row">
                {job.title}
                <span className={`badge ${JOB_STATUS_BADGE_CLASS[job.status]}`}>
                  {JOB_STATUS_LABELS[job.status]}
                </span>
              </div>
              <div className="meta">
                {job.desiredDays.map((d) => DAY_OF_WEEK_LABELS[d]).join(", ")} ({TIME_SLOT_LABELS[job.timeSlot]}) · 지원 {job.applicationCount}명
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default BabysitterMyJobPostsComponent;
