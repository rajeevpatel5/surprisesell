import { PageHeader } from "@/components/ui/primitives";
import { VirtualLab } from "@/components/lab/virtual-lab";

export default function VirtualLabPage() {
  return (
    <div>
      <PageHeader
        title="Virtual Lab"
        subtitle="Drag components onto the canvas, wire them together, and run the simulation."
      />
      <VirtualLab />
    </div>
  );
}
