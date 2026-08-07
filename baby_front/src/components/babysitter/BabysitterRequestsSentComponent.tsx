import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as babysitterApi from "../../api/babysitterApi";
import { REQUEST_STATUS_LABELS, TIME_SLOT_LABELS } from "../../api/babysitterApi";
import type { BabysitterRequest } from "../../api/babysitterApi";

const describeError = (err: any): string =>
  err?.response?.data?.error ||
  err?.response?.data?.msg ||
  err?.message ||
  "알 수 없는 오류";

const BabysitterRequestsSentComponent = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<BabysitterRequest[]>([]);

  const load = () => {
    babysitterApi.getSentRequests().then(setList);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (requestNo: number) => {
    if (!confirm("요청을 취소할까요?")) {
      return;
    }
    try {
      await babysitterApi.cancelRequest(requestNo);
      load();
    } catch (err) {
      console.error(err);
      alert(`취소에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">내가 보낸 요청</h2>

      {list.length === 0 && <div>보낸 요청이 없습니다.</div>}

      <ul>
        {list.map((r) => (
          <li
            key={r.requestNo}
            className="border-b py-2 cursor-pointer"
            onClick={() => navigate(`/community/babysitter/${r.sitterEmail}`)}
          >
            <div className="font-bold">{r.sitterName ?? "탈퇴한 시터"}</div>
            <div>
              {r.requestDate} ({TIME_SLOT_LABELS[r.timeSlot]}) · {REQUEST_STATUS_LABELS[r.status]}
              {r.status === "ACCEPTED" && r.reviewed && " · 후기 작성 완료"}
            </div>

            {r.status === "PENDING" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel(r.requestNo);
                }}
              >
                요청 취소
              </button>
            )}
          </li>
        ))}
      </ul>

      <button onClick={() => navigate("/community/babysitter")}>목록으로</button>
    </div>
  );
};

export default BabysitterRequestsSentComponent;
