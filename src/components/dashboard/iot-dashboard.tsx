"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, Badge } from "@/components/ui/primitives";

interface Reading {
  time: string;
  temperature: number;
  humidity: number;
}

function nextReading(prev?: Reading): Reading {
  const base = prev?.temperature ?? 24;
  const temperature = Math.round((base + (Math.random() - 0.5) * 2) * 10) / 10;
  const humidity = Math.round(50 + Math.random() * 20);
  return { time: new Date().toLocaleTimeString(), temperature, humidity };
}

export function IoTDashboard({ deviceLabel = "ESP32-001" }: { deviceLabel?: string }) {
  const [data, setData] = useState<Reading[]>(() => {
    const seed: Reading[] = [];
    let last: Reading | undefined;
    for (let i = 0; i < 12; i++) {
      last = nextReading(last);
      seed.push(last);
    }
    return seed;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => [...prev.slice(-19), nextReading(prev[prev.length - 1])]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const latest = data[data.length - 1];
  const ledOn = latest.temperature > 30;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Temperature</p>
          <p className="mt-1 text-2xl font-semibold text-white">{latest.temperature}°C</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Humidity</p>
          <p className="mt-1 text-2xl font-semibold text-white">{latest.humidity}%</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">LED</p>
          <p className={`mt-1 text-2xl font-semibold ${ledOn ? "text-emerald-400" : "text-slate-500"}`}>
            {ledOn ? "ON" : "OFF"}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Device</p>
          <p className="mt-1 text-sm text-slate-300">{deviceLabel}</p>
          <Badge tone="success">ONLINE</Badge>
        </Card>
      </div>

      <Card>
        <p className="text-sm font-semibold text-white mb-4">Temperature (live)</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 12 }} />
              <Line type="monotone" dataKey="temperature" stroke="#3b6fe0" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
