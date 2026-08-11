"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  COMPONENT_PALETTE,
  SENSOR_TYPES,
  ACTUATOR_TYPES,
  computeActuatorStates,
  type SimComponent,
  type SimConnection,
  type ComponentType,
} from "@/lib/simulation-engine";
import {
  Cpu, Lightbulb, CircleDot, Thermometer, Droplets, Sun, Scan, Waves, Cog,
  ToggleLeft, Monitor, Bell, Play, Square, RotateCcw, Link2, Trash2,
} from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  cpu: Cpu, lightbulb: Lightbulb, "circle-dot": CircleDot, thermometer: Thermometer,
  droplets: Droplets, sun: Sun, scan: Scan, waves: Waves, cog: Cog,
  "toggle-left": ToggleLeft, monitor: Monitor, bell: Bell,
};

const DEFAULT_CODE = `// Temperature Monitoring System
float temperature = readTemperature();
if (temperature > 30) {
  digitalWrite(LED_PIN, HIGH);
} else {
  digitalWrite(LED_PIN, LOW);
}`;

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`;

export function VirtualLab({
  submitAction,
}: {
  submitAction?: (payload: { circuitJson: unknown; code: string }) => Promise<void>;
}) {
  const [components, setComponents] = useState<SimComponent[]>([]);
  const [connections, setConnections] = useState<SimConnection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [code, setCode] = useState(DEFAULT_CODE);
  const canvasRef = useRef<HTMLDivElement>(null);

  const evaluated = useMemo(
    () => computeActuatorStates(components, connections, running),
    [components, connections, running]
  );
  const liveComponents = evaluated.components;
  const selected = liveComponents.find((c) => c.id === selectedId) ?? null;

  const addComponent = useCallback((type: ComponentType) => {
    const id = nextId(type);
    const isActuator = ACTUATOR_TYPES.includes(type);
    const isSensor = SENSOR_TYPES.includes(type);
    const label = COMPONENT_PALETTE.find((p) => p.type === type)?.label ?? type;
    const comp: SimComponent = {
      id,
      type,
      label,
      x: 60 + Math.random() * 240,
      y: 60 + Math.random() * 160,
      value: isActuator ? false : type === "PIR_MOTION" || type === "BUTTON" ? false : 22,
      config: isSensor ? { thresholdOperator: "GREATER_THAN", threshold: 30 } : undefined,
    };
    setComponents((prev) => [...prev, comp]);
    setSelectedId(id);
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setConnections((prev) => prev.filter((c) => c.fromComponentId !== id && c.toComponentId !== id));
    setSelectedId((s) => (s === id ? null : s));
  }, []);

  const handlePointerDownComponent = (e: React.PointerEvent, id: string) => {
    if (connectFrom) return; // don't drag while connecting
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const comp = components.find((c) => c.id === id);
    if (!comp) return;
    const offsetX = e.clientX - canvasRect.left - comp.x;
    const offsetY = e.clientY - canvasRect.top - comp.y;

    const onMove = (ev: PointerEvent) => {
      const x = Math.max(0, ev.clientX - canvasRect.left - offsetX);
      const y = Math.max(0, ev.clientY - canvasRect.top - offsetY);
      setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    setSelectedId(id);
  };

  const handleComponentClick = (id: string) => {
    if (connectFrom && connectFrom !== id) {
      const connId = `${connectFrom}->${id}`;
      setConnections((prev) =>
        prev.some((c) => c.id === connId) ? prev : [...prev, { id: connId, fromComponentId: connectFrom, toComponentId: id }]
      );
      setConnectFrom(null);
      return;
    }
    setSelectedId(id);
  };

  const updateSelectedConfig = (patch: Partial<NonNullable<SimComponent["config"]>>) => {
    if (!selected) return;
    setComponents((prev) =>
      prev.map((c) => (c.id === selected.id ? { ...c, config: { ...c.config, ...patch } } : c))
    );
  };

  const setSensorValue = (id: string, value: number | boolean) => {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, value } : c)));
  };

  const handleRun = () => {
    setRunning(true);
    setEvents((prev) => [`Simulation started`, ...prev].slice(0, 30));
  };
  const handleStop = () => {
    setRunning(false);
    setEvents((prev) => [`Simulation stopped`, ...prev].slice(0, 30));
  };
  const handleReset = () => {
    setRunning(false);
    setComponents((prev) =>
      prev.map((c) => ({ ...c, value: ACTUATOR_TYPES.includes(c.type) ? false : SENSOR_TYPES.includes(c.type) ? 22 : c.value }))
    );
    setEvents([]);
  };

  // Surface newly-computed events into the log when they change.
  const lastEventsRef = useRef<string[]>([]);
  if (running && evaluated.events.length && evaluated.events.join("|") !== lastEventsRef.current.join("|")) {
    lastEventsRef.current = evaluated.events;
    queueMicrotask(() => setEvents((prev) => [...evaluated.events, ...prev].slice(0, 30)));
  }

  return (
    <div className="grid grid-cols-[220px_1fr_260px] gap-4 h-[560px]">
      {/* Palette */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 overflow-y-auto scrollbar-thin">
        <p className="text-xs uppercase tracking-wide text-slate-500 px-1 mb-2">Components</p>
        <div className="space-y-1">
          {COMPONENT_PALETTE.map((p) => {
            const Icon = ICONS[p.icon] ?? Cpu;
            return (
              <button
                key={p.type}
                onClick={() => addComponent(p.type)}
                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <Icon size={16} className="text-brand-400 shrink-0" />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2">
          <button onClick={handleRun} disabled={running} className="flex items-center gap-1 rounded-md bg-emerald-500/15 text-emerald-400 disabled:opacity-40 px-2.5 py-1 text-xs font-medium">
            <Play size={12} /> Run
          </button>
          <button onClick={handleStop} disabled={!running} className="flex items-center gap-1 rounded-md bg-slate-800 text-slate-300 disabled:opacity-40 px-2.5 py-1 text-xs font-medium">
            <Square size={12} /> Stop
          </button>
          <button onClick={handleReset} className="flex items-center gap-1 rounded-md bg-slate-800 text-slate-300 px-2.5 py-1 text-xs font-medium">
            <RotateCcw size={12} /> Reset
          </button>
          <button
            onClick={() => setConnectFrom(connectFrom ? null : selectedId)}
            disabled={!selectedId && !connectFrom}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${connectFrom ? "bg-brand-500 text-white" : "bg-slate-800 text-slate-300"} disabled:opacity-40`}
          >
            <Link2 size={12} /> {connectFrom ? "Click target…" : "Connect"}
          </button>
          {selected && (
            <button onClick={() => removeComponent(selected.id)} className="ml-auto flex items-center gap-1 rounded-md bg-red-500/15 text-red-400 px-2.5 py-1 text-xs font-medium">
              <Trash2 size={12} /> Remove
            </button>
          )}
        </div>

        <div ref={canvasRef} className="relative flex-1 overflow-hidden" style={{ backgroundImage: "radial-gradient(circle, #1e293b 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
          {liveComponents.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-600">
              Click a component on the left to add it here.
            </p>
          )}
          {/* connections */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
            {connections.map((conn) => {
              const from = liveComponents.find((c) => c.id === conn.fromComponentId);
              const to = liveComponents.find((c) => c.id === conn.toComponentId);
              if (!from || !to) return null;
              return (
                <line
                  key={conn.id}
                  x1={from.x + 44} y1={from.y + 28}
                  x2={to.x + 44} y2={to.y + 28}
                  stroke="#3b6fe0" strokeWidth={2} markerEnd="url(#arrow)"
                />
              );
            })}
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#3b6fe0" />
              </marker>
            </defs>
          </svg>

          {liveComponents.map((c) => {
            const paletteEntry = COMPONENT_PALETTE.find((p) => p.type === c.type);
            const Icon = ICONS[paletteEntry?.icon ?? "cpu"] ?? Cpu;
            const isActuatorOn = ACTUATOR_TYPES.includes(c.type) && c.value === true;
            return (
              <div
                key={c.id}
                onPointerDown={(e) => handlePointerDownComponent(e, c.id)}
                onClick={() => handleComponentClick(c.id)}
                style={{ left: c.x, top: c.y }}
                className={`absolute w-22 select-none cursor-grab active:cursor-grabbing rounded-lg border px-2 py-2 text-center text-xs shadow-sm transition ${
                  c.id === selectedId ? "border-brand-400 bg-slate-800" : "border-slate-700 bg-slate-900"
                } ${connectFrom === c.id ? "ring-2 ring-brand-400" : ""}`}
              >
                <Icon size={18} className={`mx-auto mb-1 ${isActuatorOn ? "text-emerald-400" : "text-slate-400"}`} />
                <p className="truncate text-slate-200" style={{ maxWidth: 80 }}>{c.label}</p>
                <p className="text-[10px] text-slate-500">
                  {typeof c.value === "boolean" ? (c.value ? "ON" : "OFF") : `${c.value}`}
                </p>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-800 px-3 py-2 h-24 overflow-y-auto scrollbar-thin">
          <p className="text-[10px] uppercase tracking-wide text-slate-600 mb-1">Event Log</p>
          {events.length === 0 && <p className="text-xs text-slate-600">No events yet — click Run.</p>}
          {events.map((e, i) => (
            <p key={i} className="text-xs text-slate-400">{e}</p>
          ))}
        </div>
      </div>

      {/* Properties + code */}
      <div className="flex flex-col gap-4 overflow-y-auto scrollbar-thin">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Properties</p>
          {!selected && <p className="text-sm text-slate-600">Select a component.</p>}
          {selected && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Label</label>
                <input
                  value={selected.label}
                  onChange={(e) => setComponents((prev) => prev.map((c) => (c.id === selected.id ? { ...c, label: e.target.value } : c)))}
                  className="w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-sm text-white"
                />
              </div>
              {typeof selected.value === "number" && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Value: {selected.value}</label>
                  <input
                    type="range" min={-10} max={100}
                    value={selected.value}
                    onChange={(e) => setSensorValue(selected.id, Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
              {typeof selected.value === "boolean" && SENSOR_TYPES.includes(selected.type) && (
                <button
                  onClick={() => setSensorValue(selected.id, !selected.value)}
                  className="w-full rounded-md bg-slate-800 px-2 py-1.5 text-xs text-slate-200"
                >
                  Toggle {selected.value ? "OFF" : "ON"}
                </button>
              )}
              {SENSOR_TYPES.includes(selected.type) && typeof selected.value === "number" && (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Trigger when</label>
                    <select
                      value={selected.config?.thresholdOperator ?? "GREATER_THAN"}
                      onChange={(e) => updateSelectedConfig({ thresholdOperator: e.target.value as any })}
                      className="w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-sm text-white"
                    >
                      <option value="GREATER_THAN">Greater than</option>
                      <option value="LESS_THAN">Less than</option>
                      <option value="EQUALS">Equals</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Threshold</label>
                    <input
                      type="number"
                      value={selected.config?.threshold ?? 30}
                      onChange={(e) => updateSelectedConfig({ threshold: Number(e.target.value) })}
                      className="w-full rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-sm text-white"
                    />
                  </div>
                </>
              )}
              <p className="text-[11px] text-slate-600">
                Select a sensor, then an actuator, and click Connect to wire them together.
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col min-h-[220px]">
          <p className="text-xs uppercase tracking-wide text-slate-500 px-3 pt-3 pb-2">Code Editor</p>
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language="cpp"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v ?? "")}
              options={{ fontSize: 12, minimap: { enabled: false }, scrollBeyondLastLine: false }}
            />
          </div>
          <div className="flex gap-2 border-t border-slate-800 p-2">
            <button onClick={handleRun} className="rounded-md bg-emerald-500/15 text-emerald-400 px-2.5 py-1 text-xs font-medium">Run</button>
            {submitAction && (
              <button
                onClick={() => submitAction({ circuitJson: { components, connections }, code })}
                className="ml-auto rounded-md bg-brand-500 hover:bg-brand-600 px-2.5 py-1 text-xs font-medium text-white"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
