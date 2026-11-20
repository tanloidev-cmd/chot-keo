"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    function update() {
      setOffline(!navigator.onLine);
    }

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-xs text-amber-900">
      <WifiOff className="size-3.5" />
      Bạn đang mất kết nối mạng. Một số dữ liệu có thể chưa cập nhật.
    </div>
  );
}
