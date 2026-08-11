import { PageHeader } from "@/components/ui/primitives";
import { IoTDashboard } from "@/components/dashboard/iot-dashboard";

export default function StudentIoTDashboardPage() {
  return (
    <div>
      <PageHeader
        title="IoT Dashboard"
        subtitle="Live telemetry from your active simulation or reserved device."
      />
      <IoTDashboard />
    </div>
  );
}
