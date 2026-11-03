self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() || "Ada pembaruan pada laporan Anda." };
  }

  const title = payload.title || "E-Aspirasi Desa Jarak";
  const options = {
    body: payload.body || "Ada pembaruan pada laporan Anda.",
    icon: "/notification-icon.svg",
    badge: "/notification-icon.svg",
    tag: payload.tag || "e-aspirasi-update",
    data: { url: payload.url || "/riwayat" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    let target = new URL(event.notification.data?.url || "/riwayat", self.location.origin);
    if (target.origin !== self.location.origin) target = new URL("/riwayat", self.location.origin);

    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.navigate(target.href);
        return client.focus();
      }
    }
    return self.clients.openWindow(target.href);
  })());
});
