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

const BabysitterRequestsReceivedComponent = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<BabysitterRequest[]>([]);

  const load = () => {
    babysitterApi.getReceivedRequests().then(setList);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAccept = async (requestNo: number) => {
    try {
      await babysitterApi.acceptRequest(requestNo);
      load();
    } catch (err) {
      console.error(err);
      alert(`수락에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  const handleReject = async (requestNo: number) => {
    try {
      await babysitterApi.rejectRequest(requestNo);
      load();
    } catch (err) {
      console.error(err);
      alert(`거절에 실패했습니다.\n(${describeError(err)})`);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">나에게 온 요청</h2>

      {list.length === 0 && <div>받은 요청이 없습니다.</div>}

      <ul>
        {list.map((r) => (
          <li key={r.requestNo} className="border-b py-2">
            <div className="font-bold">{r.parentNickname ?? "익명"}</div>
            <div>
              {r.requestDate} ({TIME_SLOT_LABELS[r.timeSlot]}) · {REQUEST_STATUS_LABELS[r.status]}
            </div>
            {r.message && <div>메시지: {r.message}</div>}

            {r.status === "PENDING" && (
              <div className="flex gap-2 mt-1">
                <button onClick={() => handleAccept(r.requestNo)}>수락</button>
                <button onClick={() => handleReject(r.requestNo)}>거절</button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <button onClick={() => navigate("/community/babysitter")}>목록으로</button>
    </div>
  );
};

export default BabysitterRequestsReceivedComponent;
