import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import { JOB_STATUS_LABELS, TIME_SLOT_LABELS } from "../../api/babysitterApi";
import type { BabysitterJobPost } from "../../api/babysitterApi";

const BabysitterMyJobPostsComponent = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<BabysitterJobPost[]>([]);

  useEffect(() => {
    babysitterApi.getMyJobPosts().then(setList);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">내가 올린 구인글</h2>

      {list.length === 0 && <div>등록한 구인글이 없습니다.</div>}

      <ul>
        {list.map((job) => (
          <li
            key={job.jobNo}
            className="border-b py-2 cursor-pointer"
            onClick={() => navigate(`/community/babysitter/jobs/${job.jobNo}`)}
          >
            <div className="font-bold">
              {job.title} · {JOB_STATUS_LABELS[job.status]}
            </div>
            <div>
              {job.desiredDate} ({TIME_SLOT_LABELS[job.timeSlot]}) · 지원 {job.applicationCount}명
            </div>
          </li>
        ))}
      </ul>

      <button onClick={() => navigate("/community/babysitter/jobs")}>
        구인글 목록으로
      </button>
    </div>
  );
};

export default BabysitterMyJobPostsComponent;
