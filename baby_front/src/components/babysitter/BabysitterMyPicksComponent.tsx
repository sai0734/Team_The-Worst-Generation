import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import { gradeLevelBadgeClass, gradeLevelLabel } from "../../api/babysitterApi";
import type { BabysitterProfile } from "../../api/babysitterApi";

const BabysitterMyPicksComponent = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<BabysitterProfile[]>([]);

  useEffect(() => {
    babysitterApi.getMyPicks().then(setList);
  }, []);

  return (
    <div>
      {list.length === 0 && <div className="empty-hint">찜한 시터가 없습니다.</div>}

      <div className="sitter-list">
        {list.map((profile) => (
          <article
            key={profile.email}
            className="card sitter-row"
            onClick={() => navigate(`/community/babysitter/${profile.email}`)}
          >
            <div className="sitter-row-body">
              <div className="name-row">
                {profile.name}
                <span className={`community-badge ${gradeLevelBadgeClass(profile.gradeLevel)}`}>
                  {gradeLevelLabel(profile.gradeLevel)}
                </span>
              </div>
              <div className="meta">
                경력 {profile.careerYears}년 · {profile.region ?? "지역 미입력"}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="sitter-back-link">
        <button type="button" className="btn ghost" onClick={() => navigate("/community/babysitter")}>
          목록으로
        </button>
      </div>
    </div>
  );
};

export default BabysitterMyPicksComponent;
