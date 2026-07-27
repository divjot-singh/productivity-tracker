import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function SectionCard({ children }: Props) {
  return (
    <Card className="bg-card border-zinc-800">
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}
