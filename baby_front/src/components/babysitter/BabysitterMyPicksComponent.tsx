import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import { GRADE_LABELS } from "../../api/babysitterApi";
import type { BabysitterProfile } from "../../api/babysitterApi";

const BabysitterMyPicksComponent = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<BabysitterProfile[]>([]);

  useEffect(() => {
    babysitterApi.getMyPicks().then(setList);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">내가 찜한 시터</h2>

      {list.length === 0 && <div>찜한 시터가 없습니다.</div>}

      <ul>
        {list.map((profile) => (
          <li
            key={profile.email}
            className="border-b py-2 cursor-pointer"
            onClick={() => navigate(`/community/babysitter/${profile.email}`)}
          >
            <div className="font-bold">
              {profile.name}{" "}
              <span className="text-xs font-normal bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                {GRADE_LABELS[profile.grade]}
              </span>
            </div>
            <div>
              경력 {profile.careerYears}년 · {profile.region ?? "지역 미입력"}
            </div>
          </li>
        ))}
      </ul>

      <button onClick={() => navigate("/community/babysitter")}>목록으로</button>
    </div>
  );
};

export default BabysitterMyPicksComponent;
