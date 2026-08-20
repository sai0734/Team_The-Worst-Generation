import { useSyncExternalStore } from "react";
import { homeCamMonitor } from "../util/homeCamMonitor";
import type { HomeCamSnapshot } from "../util/homeCamMonitor";

// BasicMenu(감시 토글), HomeCamModal(뷰어) 등 여러 컴포넌트가 이 하나의 훅으로
// 같은 카메라 스트림/감지 상태를 공유해서 봄 - 컴포넌트가 언마운트돼도(모달 닫힘,
// 페이지 이동) homeCamMonitor 자체는 계속 살아있어서 감시가 끊기지 않음.
const useHomeCamMonitor = (): HomeCamSnapshot => {
  return useSyncExternalStore(
    homeCamMonitor.subscribe,
    homeCamMonitor.getSnapshot,
  );
};

export default useHomeCamMonitor;
