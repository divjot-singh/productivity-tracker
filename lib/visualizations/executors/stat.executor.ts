import { ProviderData } from "../providers/provider-data";
import { StatCardData } from "../types";
import { VisualizationExecutor } from "./executor-types";

export const statExecutor: VisualizationExecutor = {
  execute(visualization, data) {
    const { values, unit } = data as ProviderData;

    let value: number | string = "-";
    let valueDate: string | undefined;

    switch (visualization.aggregation) {
      case "latest":
        value = values.at(-1)?.value ?? "-";
        valueDate = values.at(-1)?.date;
        break;

      case "max": {
        if (values.length === 0) {
          value = "-";
          break;
        }

        const best = values.reduce((currentMax, item) =>
          item.value > currentMax.value ? item : currentMax,
        );

        value = best.value;
        valueDate = best.date;
        break;
      }

      case "sum":
        value = values.reduce((sum, item) => sum + item.value, 0);
        break;

      case "average":
        value =
          values.length === 0
            ? "-"
            : Number(
                (
                  values.reduce((sum, item) => sum + item.value, 0) /
                  values.length
                ).toFixed(1),
              );
        break;

      case "count":
        value = values.length;
        break;

      default:
        throw new Error(
          `Aggregation '${visualization.aggregation}' is not supported by stat executor.`,
        );
    }

    const comparisonType = visualization.options?.comparison;

    let comparison: StatCardData["comparison"];

    function calculatePercentageChange(current: number, previous: number) {
      if (previous === 0) {
        return 0;
      }

      return Number((((current - previous) / previous) * 100).toFixed(1));
    }

    if (comparisonType === "previous-day") {
      if (values.length >= 2) {
        const current = values.at(-1)!.value;

        const previous = values.at(-2)!.value;

        const delta = current - previous;

        comparison = {
          label: "vs previous day",

          value: Math.abs(calculatePercentageChange(current, previous)),

          direction: delta > 0 ? "up" : delta < 0 ? "down" : "neutral",
        };
      }
    }

    if (comparisonType === "previous-period") {
      const midpoint = Math.floor(values.length / 2);

      if (midpoint > 0) {
        const previous = values.slice(0, midpoint).map((x) => x.value);

        const current = values.slice(midpoint).map((x) => x.value);

        const previousAverage =
          previous.reduce((sum, value) => sum + value, 0) / previous.length;

        const currentAverage =
          current.reduce((sum, value) => sum + value, 0) / current.length;

        const delta = currentAverage - previousAverage;

        comparison = {
          label: "vs previous period",

          value: Math.abs(
            calculatePercentageChange(currentAverage, previousAverage),
          ),

          direction: delta > 0 ? "up" : delta < 0 ? "down" : "neutral",
        };
      }
    }

    return {
      id: visualization.id,
      title: visualization.title,
      widget: visualization.widget,
      subtitle: visualization.description,
      data: {
        value,
        valueDate: valueDate ? formatDate(valueDate) : undefined,
        unit,
        comparison,
      },
    };
  },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
