import Link from "next/link";
import { CircleHelp } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  getVisualizationHelpTopic,
  VisualizationHelpTopicKey,
} from "@/lib/visualizations/property-help";

export default function VisualizationFieldLabel({
  topic,
  htmlFor,
  children,
}: {
  topic: VisualizationHelpTopicKey;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const info = getVisualizationHelpTopic(topic);

  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>{children}</Label>

      <Link
        href={`/settings/visualizations/help#${topic}`}
        aria-label={`Learn about ${info?.title ?? "this field"}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center"
      >
        <CircleHelp className="h-4 w-4" />
      </Link>
    </div>
  );
}
