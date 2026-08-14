export const WIPE_ELEMENT_ID = "page-wipe";
export const WIPE_DURATION_MS = 420;

export const triggerWipe = (after: () => void) => {
  const wipe = document.getElementById(WIPE_ELEMENT_ID);
  if (!wipe) {
    after();
    return;
  }

  wipe.classList.remove("run");
  void wipe.offsetWidth; // 애니메이션 재시작을 위한 리플로우 강제
  wipe.classList.add("run");
  setTimeout(after, WIPE_DURATION_MS);
};
