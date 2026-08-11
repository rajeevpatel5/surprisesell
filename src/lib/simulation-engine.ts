/**
 * Simulation Engine
 * -----------------
 * A small, dependency-free state machine that represents a virtual circuit:
 * components (ESP32, sensors, actuators), connections between them, and a
 * set of rules that react to sensor values by driving actuator state.
 *
 * This is intentionally framework-agnostic (no React) so it can run in the
 * browser (virtual lab preview), on the server (grading a submitted circuit),
 * or later inside a Lambda that validates telemetry from a real ESP32.
 */

export type ComponentType =
  | "ESP32"
  | "LED"
  | "BUTTON"
  | "TEMP_SENSOR"
  | "HUMIDITY_SENSOR"
  | "LIGHT_SENSOR"
  | "PIR_MOTION"
  | "ULTRASONIC"
  | "SERVO"
  | "RELAY"
  | "OLED"
  | "BUZZER";

export const SENSOR_TYPES: ComponentType[] = [
  "TEMP_SENSOR",
  "HUMIDITY_SENSOR",
  "LIGHT_SENSOR",
  "PIR_MOTION",
  "ULTRASONIC",
  "BUTTON",
];

export const ACTUATOR_TYPES: ComponentType[] = ["LED", "SERVO", "RELAY", "OLED", "BUZZER"];

export interface SimComponent {
  id: string;
  type: ComponentType;
  label: string;
  x: number;
  y: number;
  /** Current value: number for sensors (°C, %, lux, cm), boolean for actuators/PIR/BUTTON. */
  value: number | boolean;
  /** Optional per-component config, e.g. a threshold rule. */
  config?: {
    /** For sensors driving an actuator: "GREATER_THAN" temp > threshold -> actuator ON */
    thresholdOperator?: "GREATER_THAN" | "LESS_THAN" | "EQUALS";
    threshold?: number;
  };
}

export interface SimConnection {
  id: string;
  fromComponentId: string;
  toComponentId: string;
}

export interface SimEvent {
  timestamp: number;
  message: string;
}

export class SimulationEngine {
  components: Map<string, SimComponent> = new Map();
  connections: SimConnection[] = [];
  events: SimEvent[] = [];
  running = false;

  addComponent(component: SimComponent) {
    this.components.set(component.id, component);
    return component;
  }

  removeComponent(id: string) {
    this.components.delete(id);
    this.connections = this.connections.filter(
      (c) => c.fromComponentId !== id && c.toComponentId !== id
    );
  }

  connect(fromComponentId: string, toComponentId: string) {
    const id = `${fromComponentId}->${toComponentId}`;
    if (this.connections.some((c) => c.id === id)) return;
    this.connections.push({ id, fromComponentId, toComponentId });
  }

  disconnect(connectionId: string) {
    this.connections = this.connections.filter((c) => c.id !== connectionId);
  }

  setSensorValue(componentId: string, value: number | boolean) {
    const comp = this.components.get(componentId);
    if (!comp) return;
    comp.value = value;
    this.log(`${comp.label} -> ${value}`);
    this.evaluate();
  }

  start() {
    this.running = true;
    this.log("Simulation started");
    this.evaluate();
  }

  stop() {
    this.running = false;
    this.log("Simulation stopped");
  }

  reset() {
    for (const comp of this.components.values()) {
      comp.value = ACTUATOR_TYPES.includes(comp.type) ? false : 0;
    }
    this.events = [];
    this.running = false;
  }

  /** Walk every connection and apply the source sensor's threshold rule to the target actuator. */
  private evaluate() {
    if (!this.running) return;
    for (const conn of this.connections) {
      const source = this.components.get(conn.fromComponentId);
      const target = this.components.get(conn.toComponentId);
      if (!source || !target) continue;
      if (!ACTUATOR_TYPES.includes(target.type)) continue;
      if (typeof source.value === "boolean") {
        target.value = source.value;
        continue;
      }
      const { thresholdOperator = "GREATER_THAN", threshold = 30 } = source.config ?? {};
      const numeric = source.value as number;
      const shouldActivate =
        thresholdOperator === "GREATER_THAN"
          ? numeric > threshold
          : thresholdOperator === "LESS_THAN"
          ? numeric < threshold
          : numeric === threshold;
      if (target.value !== shouldActivate) {
        target.value = shouldActivate;
        this.log(`${source.label} (${numeric}) crossed ${thresholdOperator} ${threshold} -> ${target.label} = ${shouldActivate ? "ON" : "OFF"}`);
      }
    }
  }

  private log(message: string) {
    this.events.push({ timestamp: Date.now(), message });
  }

  serialize() {
    return {
      components: Array.from(this.components.values()),
      connections: this.connections,
    };
  }

  static fromSerialized(data: { components: SimComponent[]; connections: SimConnection[] }) {
    const engine = new SimulationEngine();
    for (const c of data.components) engine.addComponent(c);
    engine.connections = data.connections;
    return engine;
  }
}

/**
 * Pure evaluation function for the React virtual lab UI: given the current
 * components/connections/running flag, returns a new components array with
 * every actuator's value derived from whatever sensor drives it, plus any
 * newly-crossed-threshold events. Kept pure (no mutation) so it plays nicely
 * with React state instead of the imperative SimulationEngine class above,
 * which is better suited to server-side/grading use.
 */
export function computeActuatorStates(
  components: SimComponent[],
  connections: SimConnection[],
  running: boolean
): { components: SimComponent[]; events: string[] } {
  const byId = new Map(components.map((c) => [c.id, { ...c }]));
  const events: string[] = [];

  if (!running) {
    for (const c of byId.values()) {
      if (ACTUATOR_TYPES.includes(c.type)) c.value = false;
    }
    return { components: Array.from(byId.values()), events };
  }

  for (const conn of connections) {
    const source = byId.get(conn.fromComponentId);
    const target = byId.get(conn.toComponentId);
    if (!source || !target || !ACTUATOR_TYPES.includes(target.type)) continue;

    let shouldActivate: boolean;
    if (typeof source.value === "boolean") {
      shouldActivate = source.value;
    } else {
      const { thresholdOperator = "GREATER_THAN", threshold = 30 } = source.config ?? {};
      const numeric = source.value;
      shouldActivate =
        thresholdOperator === "GREATER_THAN"
          ? numeric > threshold
          : thresholdOperator === "LESS_THAN"
          ? numeric < threshold
          : numeric === threshold;
    }

    if (target.value !== shouldActivate) {
      events.push(`${source.label} (${source.value}) -> ${target.label} = ${shouldActivate ? "ON" : "OFF"}`);
    }
    target.value = shouldActivate;
  }

  return { components: Array.from(byId.values()), events };
}

/** Default palette shown in the Virtual Lab component panel. */
export const COMPONENT_PALETTE: { type: ComponentType; label: string; icon: string }[] = [
  { type: "ESP32", label: "ESP32", icon: "cpu" },
  { type: "LED", label: "LED", icon: "lightbulb" },
  { type: "BUTTON", label: "Push Button", icon: "circle-dot" },
  { type: "TEMP_SENSOR", label: "Temperature Sensor", icon: "thermometer" },
  { type: "HUMIDITY_SENSOR", label: "Humidity Sensor", icon: "droplets" },
  { type: "LIGHT_SENSOR", label: "Light Sensor", icon: "sun" },
  { type: "PIR_MOTION", label: "PIR Motion Sensor", icon: "scan" },
  { type: "ULTRASONIC", label: "Ultrasonic Sensor", icon: "waves" },
  { type: "SERVO", label: "Servo Motor", icon: "cog" },
  { type: "RELAY", label: "Relay", icon: "toggle-left" },
  { type: "OLED", label: "OLED Display", icon: "monitor" },
  { type: "BUZZER", label: "Buzzer", icon: "bell" },
];
