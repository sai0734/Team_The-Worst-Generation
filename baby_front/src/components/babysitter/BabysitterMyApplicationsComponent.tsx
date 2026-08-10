import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import { JOB_APPLICATION_STATUS_LABELS } from "../../api/babysitterApi";
import type { BabysitterJobApplication } from "../../api/babysitterApi";

const BabysitterMyApplicationsComponent = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<BabysitterJobApplication[]>([]);

  useEffect(() => {
    babysitterApi.getMyApplications().then(setList);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">내가 지원한 구인글</h2>

      {list.length === 0 && <div>지원한 구인글이 없습니다.</div>}

      <ul>
        {list.map((a) => (
          <li
            key={a.applicationNo}
            className="border-b py-2 cursor-pointer"
            onClick={() => navigate(`/community/babysitter/jobs/${a.jobNo}`)}
          >
            <div className="font-bold">
              {a.jobTitle ?? "삭제된 구인글"} · {JOB_APPLICATION_STATUS_LABELS[a.status]}
            </div>
            {a.message && <div>{a.message}</div>}
          </li>
        ))}
      </ul>

      <button onClick={() => navigate("/community/babysitter/jobs")}>
        구인글 목록으로
      </button>
    </div>
  );
};

export default BabysitterMyApplicationsComponent;
