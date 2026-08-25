export type VisualizationHelpTopicKey =
  | "title"
  | "description"
  | "widget"
  | "scope"
  | "source"
  | "data"
  | "aggregation"
  | "period"
  | "comparison"
  | "greenIfDeltaPositive"
  | "streakRule"
  | "visible"
  | "displayOrder";

export interface VisualizationHelpTopic {
  key: VisualizationHelpTopicKey;
  title: string;
  whatItMeans: string;
  howItWorks: string;
  example: string;
  optionDetails?: Array<{
    label: string;
    description: string;
  }>;
}

export const VISUALIZATION_HELP_TOPICS: VisualizationHelpTopic[] = [
  {
    key: "title",
    title: "Title",
    whatItMeans: "The display name shown on your dashboard card.",
    howItWorks:
      "This is the first thing you see on the card. Keep it short and easy to scan.",
    example: "Life Score Today",
  },
  {
    key: "description",
    title: "Description",
    whatItMeans: "A short sentence that explains what the visualization shows.",
    howItWorks:
      "The description appears below the title and adds context for anyone reading the card.",
    example: "Average life score over the last 7 days.",
  },
  {
    key: "widget",
    title: "Widget",
    whatItMeans:
      "The visual format of the card, such as a stat, chart, or leaderboard.",
    howItWorks:
      "Changing the widget changes how data is displayed. Some widgets only support certain data styles.",
    example: "Use Stat Card for one number, or Line Chart for a trend.",
    optionDetails: [
      {
        label: "Stat Card",
        description: "Shows one key number, like current score or streak.",
      },
      {
        label: "Line / Bar / Area Chart",
        description: "Shows changes over time so you can spot trends.",
      },
      {
        label: "Progress Bar / Ring",
        description: "Shows how close you are to a target.",
      },
      {
        label: "Leaderboard",
        description: "Ranks items so you can compare performance.",
      },
      {
        label: "Heatmap",
        description: "Shows activity intensity across days.",
      },
      {
        label: "Timeline",
        description: "Shows day-by-day directional changes.",
      },
      {
        label: "Radar Chart",
        description: "Compares multiple categories in one view.",
      },
      {
        label: "Insight Card",
        description: "Summarizes key highlights in plain language.",
      },
    ],
  },
  {
    key: "scope",
    title: "Scope",
    whatItMeans:
      "The level of data you are looking at: overall, by goal, or by category.",
    howItWorks:
      "Scope decides the kind of choices available in the rest of the form.",
    example: "Global for overall score, Goal for a single habit.",
    optionDetails: [
      {
        label: "Global",
        description:
          "Uses overall entry data like life score or XP across all goals.",
      },
      {
        label: "Goal",
        description: "Focuses on one specific goal such as Steps or Water.",
      },
      {
        label: "Category",
        description:
          "Groups data by category so you can compare areas like fitness and lifestyle.",
      },
    ],
  },
  {
    key: "source",
    title: "Source",
    whatItMeans: "How the app prepares data before showing it in the widget.",
    howItWorks:
      "Source is chosen from your other selections and keeps the configuration valid.",
    example:
      "A source can provide daily values, streak values, or ranking values.",
  },
  {
    key: "data",
    title: "Data",
    whatItMeans: "The exact metric this visualization uses.",
    howItWorks:
      "Data tells the widget what to read, such as life score, XP, or a specific goal.",
    example: "Life score, XP, or Steps.",
  },
  {
    key: "aggregation",
    title: "Aggregation",
    whatItMeans: "How values are combined before display.",
    howItWorks:
      "The app can show the latest value, an average, a sum, or other supported options based on the widget.",
    example: "Average for trend summary, Latest for current status.",
    optionDetails: [
      {
        label: "Latest",
        description: "Uses the most recent value in the selected period.",
      },
      {
        label: "Average",
        description: "Uses the mean value across the selected period.",
      },
      {
        label: "Sum",
        description: "Adds all values in the selected period.",
      },
      {
        label: "Count",
        description: "Counts matching entries in the selected period.",
      },
      {
        label: "Daily",
        description: "Keeps each day separate for trend-style charts.",
      },
      {
        label: "Streak",
        description: "Calculates consecutive success days.",
      },
    ],
  },
  {
    key: "period",
    title: "Period",
    whatItMeans: "The time window used to calculate results.",
    howItWorks:
      "A shorter period reacts quickly to recent changes; all time gives a long-term view.",
    example: "Last 30 days or All time.",
  },
  {
    key: "comparison",
    title: "Comparison",
    whatItMeans: "What your current value is compared against.",
    howItWorks:
      "Comparison adds context by showing whether you are improving or dropping, or you can turn it off entirely.",
    example: "Compare with previous day, previous period, or no comparison.",
    optionDetails: [
      {
        label: "No Comparison",
        description: "Shows the main value without any change badge.",
      },
      {
        label: "Previous Day",
        description: "Compares today with the immediately previous day.",
      },
      {
        label: "Previous Period",
        description:
          "Compares current period with an earlier period of the same length.",
      },
    ],
  },
  {
    key: "greenIfDeltaPositive",
    title: "Green If Delta Positive",
    whatItMeans:
      "Controls how positive or negative changes are colored in timeline-style views.",
    howItWorks:
      "Turn this on when bigger is better. Turn it off when lower values are better.",
    example: "For step count, positive change is usually good.",
  },
  {
    key: "streakRule",
    title: "Streak Rule",
    whatItMeans:
      "A rule that defines what counts as a successful day for a streak.",
    howItWorks:
      "You can combine multiple conditions and require all of them or any of them.",
    example: "Steps >= 10000 and Junk food = false.",
  },
  {
    key: "visible",
    title: "Visible",
    whatItMeans: "Whether this visualization appears on your dashboard.",
    howItWorks:
      "Hidden visualizations stay saved but are not shown until you turn visibility back on.",
    example: "Hide experiments without deleting them.",
  },
  {
    key: "displayOrder",
    title: "Display Order",
    whatItMeans:
      "The position of this visualization among other dashboard cards.",
    howItWorks: "Lower numbers usually appear earlier in the dashboard layout.",
    example: "1 appears before 2.",
  },
];

export function getVisualizationHelpTopic(
  key: VisualizationHelpTopicKey,
): VisualizationHelpTopic | undefined {
  return VISUALIZATION_HELP_TOPICS.find((topic) => topic.key === key);
}
