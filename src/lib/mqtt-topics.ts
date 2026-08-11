/**
 * MQTT topic conventions shared by the backend, the seed/mock telemetry
 * generator, and (eventually) real ESP32 firmware talking to AWS IoT Core.
 *
 * Topic shape: university/{universityId}/device/{deviceId}/{channel}
 */
export const mqttTopics = {
  telemetry: (universityId: string, deviceId: string) =>
    `university/${universityId}/device/${deviceId}/telemetry`,
  command: (universityId: string, deviceId: string) =>
    `university/${universityId}/device/${deviceId}/command`,
  status: (universityId: string, deviceId: string) =>
    `university/${universityId}/device/${deviceId}/status`,
};

export interface TelemetryPayload {
  deviceId: string;
  temperature?: number;
  humidity?: number;
  led?: boolean;
  timestamp: string;
}

export interface CommandPayload {
  command: "LED_ON" | "LED_OFF" | "RELAY_ON" | "RELAY_OFF" | "RESET";
}

/**
 * IoTBroker is the seam between the app and a real broker.
 * - MVP: `MockBroker` (below) simulates telemetry in-process for the demo UI.
 * - Production: implement this interface against AWS IoT Core using the
 *   `aws-iot-device-sdk-v2` (backend/Lambda side) — publish commands on
 *   `.../command`, subscribe to `.../telemetry` and `.../status`. Device
 *   identity uses per-device X.509 certificates provisioned via IoT Core,
 *   never shared or exposed to students (see section 23, Security).
 */
export interface IoTBroker {
  publishCommand(universityId: string, deviceId: string, payload: CommandPayload): Promise<void>;
  onTelemetry(
    universityId: string,
    deviceId: string,
    handler: (payload: TelemetryPayload) => void
  ): () => void; // returns an unsubscribe function
}

export class MockBroker implements IoTBroker {
  private listeners = new Map<string, Set<(p: TelemetryPayload) => void>>();

  async publishCommand(universityId: string, deviceId: string, payload: CommandPayload) {
    // In the MVP this just logs; a real broker call happens here in production.
    console.log(`[mock-mqtt] ${mqttTopics.command(universityId, deviceId)} <-`, payload);
  }

  onTelemetry(universityId: string, deviceId: string, handler: (p: TelemetryPayload) => void) {
    const key = mqttTopics.telemetry(universityId, deviceId);
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(handler);
    return () => this.listeners.get(key)?.delete(handler);
  }

  /** Test/demo helper: push a synthetic telemetry reading to subscribers. */
  emit(universityId: string, deviceId: string, payload: TelemetryPayload) {
    const key = mqttTopics.telemetry(universityId, deviceId);
    this.listeners.get(key)?.forEach((fn) => fn(payload));
  }
}

export const mockBroker = new MockBroker();
