import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import { GRADE_BADGE_CLASS, GRADE_LABELS } from "../../api/babysitterApi";
import type { BabysitterProfile } from "../../api/babysitterApi";

const BabysitterMyPicksComponent = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<BabysitterProfile[]>([]);

  useEffect(() => {
    babysitterApi.getMyPicks().then(setList);
  }, []);

  return (
    <div>
      <h2 className="page-title">내가 찜한 시터</h2>

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
                <span className={`community-badge ${GRADE_BADGE_CLASS[profile.grade]}`}>
                  {GRADE_LABELS[profile.grade]}
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
