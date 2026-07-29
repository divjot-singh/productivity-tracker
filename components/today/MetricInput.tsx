import { MetricDefinition, MetricValue } from "@/models/metric";
import BooleanInput from "./inputs/BooleanInput";
import GoalInput from "./inputs/GoalInput";
import MultiplierInput from "./inputs/MultiplierInput";
import OptionsInput from "./inputs/OptionsInput";
import RangeInput from "./inputs/RangeInput";
import TimeRangeInput from "./inputs/TimeRangeInput";

interface Props {
  metric: MetricDefinition;
  value: MetricValue;
  onChange: (value: MetricValue) => void;
}

export default function MetricInput({ metric, value, onChange }: Props) {
  switch (metric.scoring.type) {
    case "boolean":
      return (
        <BooleanInput
          metric={metric}
          value={Boolean(value)}
          onChange={onChange}
        />
      );

    case "goal":
      return (
        <GoalInput metric={metric} value={Number(value)} onChange={onChange} />
      );

    case "multiplier":
      return (
        <MultiplierInput
          metric={metric}
          value={Number(value)}
          onChange={onChange}
        />
      );

    case "range":
      return (
        <RangeInput metric={metric} value={Number(value)} onChange={onChange} />
      );

    case "time-range":
      return (
        <TimeRangeInput
          metric={metric}
          value={String(value)}
          onChange={onChange}
        />
      );

    case "options":
      return <OptionsInput metric={metric} value={value} onChange={onChange} />;

    default:
      return null;
  }
}
