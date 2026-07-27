import { Card, CardContent } from "@/components/ui/card";

interface Props {
  title: string;
  value: string | number;
}

export default function StatCard({ title, value }: Props) {
  return (
    <Card className="bg-card border-zinc-800">
      <CardContent className="p-6">
        <p className="text-muted-foreground text-sm">{title}</p>

        <h2 className="mt-3 text-3xl font-bold">{value}</h2>
      </CardContent>
    </Card>
  );
}
