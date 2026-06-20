let permissionGranted = false;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") {
    permissionGranted = true;
    return true;
  }
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  permissionGranted = result === "granted";
  return permissionGranted;
}

export function showNotification(title: string, body: string, onClick?: () => void) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
  });
  if (onClick) n.onclick = () => { onClick(); n.close(); };
}

export function canNotify(): boolean {
  return "Notification" in window && Notification.permission !== "denied";
}
