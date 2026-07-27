import { MetricDefinition } from "@/models/metric";

import BooleanInput from "./BooleanInput";
import NumberInput from "./NumberInput";
import TimeInput from "./TimeInput";

interface Props {
  metric: MetricDefinition;
  value: any;
  onChange: (value: any) => void;
}

export default function MetricInput({ metric, value, onChange }: Props) {
  switch (metric.type) {
    case "boolean":
      return <BooleanInput metric={metric} value={value} onChange={onChange} />;

    case "time":
      return <TimeInput metric={metric} value={value} onChange={onChange} />;

    default:
      return <NumberInput metric={metric} value={value} onChange={onChange} />;
  }
}
