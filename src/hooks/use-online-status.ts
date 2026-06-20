import { useState, useEffect, useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

const getSnapshot = () => navigator.onLine;

export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
