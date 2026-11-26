"use client";

import { useEffect, useState } from "react";

export function Countdown({ iso }: { iso: string }) {
  const [txt, setTxt] = useState("…");
  useEffect(() => {
    const tick = () => {
      const ms = Date.parse(iso) - Date.now();
      if (isNaN(ms)) return setTxt("—");
      if (ms <= 0) return setTxt("It's on");
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setTxt(d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m} min`);
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [iso]);
  return <>{txt}</>;
}
