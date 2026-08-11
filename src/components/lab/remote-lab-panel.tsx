"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/primitives";

interface DeviceRow {
  id: string;
  deviceId: string;
  labLocation: string | null;
  status: string;
  firmwareVersion: string | null;
}

interface ActiveReservation {
  id: string;
  deviceId: string;
  endTime: string;
  device: { deviceId: string };
}

function useCountdown(endTime: string) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function ActiveSessionCard({ reservation, onEnded }: { reservation: ActiveReservation; onEnded: () => void }) {
  const countdown = useCountdown(reservation.endTime);
  const [ending, setEnding] = useState(false);

  async function endSession() {
    setEnding(true);
    await fetch("/api/reservations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId: reservation.id }),
    });
    setEnding(false);
    onEnded();
  }

  return (
    <Card className="border-brand-500/40">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{reservation.device.deviceId}</p>
          <p className="text-xs text-slate-500">Session in progress</p>
        </div>
        <p className="text-xl font-mono text-brand-400">{countdown}</p>
      </div>
      <button
        onClick={endSession}
        disabled={ending}
        className="mt-3 w-full rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
      >
        {ending ? "Ending…" : "End Experiment"}
      </button>
    </Card>
  );
}

export function RemoteLabPanel({
  devices,
  activeReservation,
}: {
  devices: DeviceRow[];
  activeReservation: ActiveReservation | null;
}) {
  const router = useRouter();
  const [reserving, setReserving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reserve(deviceId: string) {
    setReserving(deviceId);
    setError(null);
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, minutes: 30 }),
    });
    setReserving(null);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Reservation failed.");
      return;
    }
    router.refresh();
  }

  if (activeReservation) {
    return <ActiveSessionCard reservation={activeReservation} onEnded={() => router.refresh()} />;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {devices.map((d) => (
        <Card key={d.id}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{d.deviceId}</p>
              <p className="text-xs text-slate-500">{d.labLocation} · firmware {d.firmwareVersion}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={d.status === "AVAILABLE" ? "success" : d.status === "OFFLINE" ? "danger" : "warning"}>
                {d.status}
              </Badge>
              <button
                onClick={() => reserve(d.id)}
                disabled={d.status !== "AVAILABLE" || reserving === d.id}
                className="rounded-md bg-brand-500 hover:bg-brand-600 disabled:opacity-40 px-3 py-1.5 text-xs font-medium text-white"
              >
                {reserving === d.id ? "Reserving…" : "Reserve (30 min)"}
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
