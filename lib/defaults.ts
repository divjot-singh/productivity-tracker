import { MetricDefinition } from "@/models/metric";
import { VisualizationDefinition } from "@/models/visualization";
import { ExerciseDefinition, WorkoutCombination } from "@/models/workout";

export const DEFAULT_METRICS: MetricDefinition[] = [
  {
    id: "05132579-6950-49df-a5ac-fc9b0d130199",
    label: "Steps",
    icon: "steps",
    description: "Track daily movement through total steps walked",
    category: "fitness",
    displayOrder: 999,
    type: "number",
    unit: "steps",
    defaultValue: 0,
    target: 10000,
    weight: 10,
    scoring: {
      type: "multiplier",
      multiplier: 0.001,
    },
    createdAt: {
      _seconds: 1785236305,
      _nanoseconds: 958000000,
    },
    updatedAt: {
      _seconds: 1785236305,
      _nanoseconds: 958000000,
    },
  },
  {
    id: "09129e89-1974-4843-b9c1-64e64988d562",
    label: "Junk food",
    icon: "healthyEating",
    description: "Did I have junk food during the day",
    category: "lifestyle",
    displayOrder: 999,
    type: "boolean",
    defaultValue: true,
    target: false,
    weight: 4,
    scoring: {
      type: "boolean",
    },
    createdAt: {
      _seconds: 1785237610,
      _nanoseconds: 272000000,
    },
    updatedAt: {
      _seconds: 1785237610,
      _nanoseconds: 272000000,
    },
  },
  {
    id: "09ad9b09-76e4-4753-a6ee-560d87294bc3",
    label: "Oral Hygeine",
    icon: "oralHygiene",
    description: "How many times do I brush?",
    category: "lifestyle",
    displayOrder: 999,
    type: "number",
    unit: "",
    defaultValue: 0,
    target: 2,
    weight: 4,
    scoring: {
      type: "multiplier",
      multiplier: 2,
      maxScore: 4,
    },
    createdAt: {
      _seconds: 1785240670,
      _nanoseconds: 768000000,
    },
    updatedAt: {
      _seconds: 1785240670,
      _nanoseconds: 768000000,
    },
  },
  {
    id: "310778ba-26b7-486c-ace7-d10cf16edf8d",
    label: "Bed time",
    icon: "bedTime",
    description: "What time did I sleep?",
    category: "routine",
    displayOrder: 999,
    type: "time",
    defaultValue: "12:00",
    target: "21:30",
    weight: 4,
    scoring: {
      type: "time-range",
      time: [
        { from: "21:00", to: "21:59", multiplier: 1 },
        { from: "22:00", to: "22:59", multiplier: 0.875 },
        { from: "23:00", to: "23:59", multiplier: 0.75 },
        { from: "00:00", to: "00:59", multiplier: 0.5 },
        { from: "01:00", to: "01:59", multiplier: 0.25 },
        { from: "02:00", to: "20:59", multiplier: 0 },
      ],
    },
    createdAt: {
      _seconds: 1785240487,
      _nanoseconds: 638000000,
    },
    updatedAt: {
      _seconds: 1785240487,
      _nanoseconds: 638000000,
    },
  },
  {
    id: "49e5e0ac-f833-4b58-a0a4-be59e6daea58",
    label: "Alcohol consumption",
    icon: "noAlcohol",
    description: "Did i consume alcohol today?",
    category: "lifestyle",
    displayOrder: 999,
    type: "boolean",
    defaultValue: true,
    target: false,
    weight: 4,
    scoring: {
      type: "boolean",
    },
    createdAt: {
      _seconds: 1785237656,
      _nanoseconds: 484000000,
    },
    updatedAt: {
      _seconds: 1785237656,
      _nanoseconds: 484000000,
    },
  },
  {
    id: "6068dfa1-44ca-4373-a95f-82a3b8ee048d",
    label: "Protein intake",
    icon: "protein",
    description: "Track daily protein intake through servings consumed",
    category: "health",
    displayOrder: 999,
    type: "number",
    unit: "servings",
    defaultValue: 0,
    target: 3,
    weight: 8,
    scoring: {
      type: "goal",
      bonusRate: 1,
    },
    createdAt: {
      _seconds: 1785236386,
      _nanoseconds: 762000000,
    },
    updatedAt: {
      _seconds: 1785236386,
      _nanoseconds: 762000000,
    },
  },
  {
    id: "79147c1f-41d3-4ec1-92b2-d3a4f3bfd286",
    label: "Stretching",
    icon: "stretching",
    description: "Track if I did stretching during a day",
    category: "fitness",
    displayOrder: 999,
    type: "boolean",
    defaultValue: false,
    target: true,
    weight: 4,
    scoring: {
      type: "boolean",
    },
    createdAt: {
      _seconds: 1785237275,
      _nanoseconds: 216000000,
    },
    updatedAt: {
      _seconds: 1785237275,
      _nanoseconds: 216000000,
    },
  },
  {
    id: "7b905d1a-3fcf-415e-9a92-7679049befcb",
    label: "Water intake",
    icon: "water",
    description: "How much water did I drink today?",
    category: "routine",
    displayOrder: 999,
    type: "number",
    unit: "ltrs",
    defaultValue: 0,
    target: 4,
    weight: 9,
    scoring: {
      type: "multiplier",
      multiplier: 2.58,
      maxScore: 10,
    },
    createdAt: {
      _seconds: 1785240961,
      _nanoseconds: 17000000,
    },
    updatedAt: {
      _seconds: 1785240961,
      _nanoseconds: 17000000,
    },
  },
  {
    id: "92884629-acc7-46c9-a86f-efb85634cf11",
    label: "Helped wife exercise",
    icon: "helpedWifeExercise",
    description: "Did I help my wife with her exercise?",
    category: "family",
    displayOrder: 999,
    type: "boolean",
    defaultValue: false,
    target: true,
    weight: 9,
    scoring: {
      type: "boolean",
    },
    createdAt: {
      _seconds: 1785238219,
      _nanoseconds: 935000000,
    },
    updatedAt: {
      _seconds: 1785238219,
      _nanoseconds: 935000000,
    },
  },
  {
    id: "ae844f72-1bc4-4d3a-a7bf-b5a9bb077a8d",
    label: "Work progress",
    icon: "primaryGoal",
    description: "Did I progress at work today?",
    category: "lifestyle",
    displayOrder: 999,
    type: "number",
    unit: "% progress",
    defaultValue: 0,
    target: 100,
    weight: 8,
    scoring: {
      type: "options",
      options: [
        {
          value: 0,
          label: "Not started",
          multiplier: 0,
        },
        {
          value: 25,
          label: "Partially worked",
          multiplier: 0.25,
        },
        {
          value: 60,
          label: "Mostly completed",
          multiplier: 0.6,
        },
        {
          value: 100,
          label: "Completed",
          multiplier: 1,
        },
        {
          value: 125,
          label: "Exceeded plan",
          multiplier: 1.25,
        },
      ],
    },
    createdAt: {
      _seconds: 1785238154,
      _nanoseconds: 345000000,
    },
    updatedAt: {
      _seconds: 1785238154,
      _nanoseconds: 345000000,
    },
  },
  {
    id: "b31437dc-f6e5-4e54-8127-859617499623",
    label: "Sleep",
    icon: "sleep",
    description: "Hours slept last night",
    category: "health",
    displayOrder: 999,
    type: "number",
    unit: "hours",
    defaultValue: 0,
    target: 8,
    weight: 10,
    scoring: {
      type: "range",
      ranges: [
        { min: 0, max: 4.9, multiplier: 0 },
        { min: 5, max: 5.9, multiplier: 0.4 },
        { min: 6, max: 6.9, multiplier: 0.7 },
        { min: 7, max: 7.9, multiplier: 0.9 },
        { min: 8, max: 8.9, multiplier: 1 },
        { min: 9, max: 9.9, multiplier: 0.9 },
        { min: 10, max: 10.9, multiplier: 0.7 },
        { min: 11, max: 24, multiplier: 0 },
      ],
    },
    createdAt: {
      _seconds: 1785235789,
      _nanoseconds: 550000000,
    },
    updatedAt: {
      _seconds: 1785235789,
      _nanoseconds: 550000000,
    },
  },
  {
    id: "e12e0e05-c8a1-4ba9-bab4-79ad8a13cfc9",
    label: "Wake time",
    icon: "wakeTime",
    description: "What time did I wake up?",
    category: "routine",
    displayOrder: 999,
    type: "time",
    defaultValue: "00:00",
    target: "07:30",
    weight: 5,
    scoring: {
      type: "time-range",
      time: [
        { from: "07:30", to: "07:59", multiplier: 1 },
        { from: "08:00", to: "08:29", multiplier: 0.8 },
        { from: "08:30", to: "08:59", multiplier: 0.6 },
        { from: "09:00", to: "09:29", multiplier: 0.4 },
        { from: "09:30", to: "09:59", multiplier: 0.2 },
        { from: "10:00", to: "23:59", multiplier: 0 },
      ],
    },
    createdAt: {
      _seconds: 1785239806,
      _nanoseconds: 705000000,
    },
    updatedAt: {
      _seconds: 1785239806,
      _nanoseconds: 705000000,
    },
  },
  {
    id: "e7f4ff7e-2332-4a2b-8b15-6a2415b4d801",
    label: "Cardio",
    icon: "cardio",
    description: "Track the number of minutes to do cardio",
    category: "fitness",
    displayOrder: 999,
    type: "number",
    unit: "minutes",
    defaultValue: 0,
    target: 10,
    weight: 6,
    scoring: {
      type: "multiplier",
      multiplier: 0.6,
    },
    createdAt: {
      _seconds: 1785237174,
      _nanoseconds: 201000000,
    },
    updatedAt: {
      _seconds: 1785237174,
      _nanoseconds: 201000000,
    },
  },
  {
    id: "e8c737c6-ae55-42fa-81d1-e3667cbd2e8e",
    label: "Weight training",
    icon: "weightTraining",
    description: "Track weight training done during the day",
    category: "fitness",
    displayOrder: 999,
    type: "boolean",
    defaultValue: false,
    target: true,
    weight: 8,
    scoring: {
      type: "boolean",
    },
    createdAt: {
      _seconds: 1785237051,
      _nanoseconds: 521000000,
    },
    updatedAt: {
      _seconds: 1785237051,
      _nanoseconds: 521000000,
    },
  },
  {
    id: "ea55a024-5389-44d1-86b1-9a318bcd2fdf",
    label: "Supplement intake",
    icon: "primaryGoal",
    description: "How many suppliments did I take today?",
    category: "fitness",
    displayOrder: 999,
    type: "number",
    unit: "caps",
    defaultValue: 0,
    target: 5,
    weight: 5,
    scoring: {
      type: "multiplier",
      multiplier: 1,
      maxScore: 5,
    },
    createdAt: {
      _seconds: 1785241074,
      _nanoseconds: 141000000,
    },
    updatedAt: {
      _seconds: 1785241074,
      _nanoseconds: 141000000,
    },
  },
  {
    id: "f53982da-6919-4523-9d49-3e64652bd8f3",
    label: "Household help",
    icon: "householdHelp",
    description: "Did i help my wife with household work?",
    category: "family",
    displayOrder: 999,
    type: "boolean",
    defaultValue: false,
    target: true,
    weight: 6,
    scoring: {
      type: "boolean",
    },
    createdAt: {
      _seconds: 1785239036,
      _nanoseconds: 959000000,
    },
    updatedAt: {
      _seconds: 1785239036,
      _nanoseconds: 959000000,
    },
  },
];

export const TEST_DEFAULT_VISUALIZATIONS: VisualizationDefinition[] = [
  {
    id: "test-life-score-current",

    title: "[Test] Life Score (Current)",

    description: "Stat executor + entry provider",

    widget: "stat-card",

    scope: "global",

    provider: "entry",

    executor: "stat",

    key: "score",

    period: {
      type: "days",
      value: 14,
    },

    aggregation: "latest",

    displayOrder: 10,

    visible: true,

    options: {
      comparison: "previous-day",
    },
  },
  {
    id: "test-xp-current",

    title: "[Test] XP (Current)",

    description: "Stat executor + entry provider",

    widget: "stat-card",

    scope: "global",

    provider: "entry",

    executor: "stat",

    key: "xp",

    period: {
      type: "days",
      value: 14,
    },

    aggregation: "latest",

    displayOrder: 11,

    visible: true,

    options: {
      comparison: "previous-day",
    },
  },
  {
    id: "test-junk-food-streak",

    title: "[Test] No Junk Food Streak",

    description: "Current streak + best streak in subtitle",

    widget: "stat-card",

    scope: "goal",

    provider: "goal",

    executor: "streak",

    key: "Junk food",

    period: {
      type: "days",
      value: 90,
    },

    aggregation: "streak",

    displayOrder: 12,

    visible: true,
  },
  {
    id: "test-alcohol-streak",

    title: "[Test] No Alcohol Streak",

    description: "Current streak + best streak in subtitle",

    widget: "stat-card",

    scope: "goal",

    provider: "goal",

    executor: "streak",

    key: "Alcohol consumption",

    period: {
      type: "days",
      value: 90,
    },

    aggregation: "streak",

    displayOrder: 13,

    visible: true,
  },
  {
    id: "test-steps-trend-line",

    title: "[Test] Steps Trend",

    description: "Trend executor + metric provider (line)",

    widget: "line-chart",

    scope: "goal",

    provider: "metric",

    executor: "trend",

    key: "Steps",

    period: {
      type: "days",
      value: 30,
    },

    aggregation: "daily",

    displayOrder: 14,

    visible: true,
  },
  {
    id: "test-protein-trend-bar",

    title: "[Test] Protein Trend",

    description: "Trend executor + metric provider (bar)",

    widget: "bar-chart",

    scope: "goal",

    provider: "metric",

    executor: "trend",

    key: "Protein intake",

    period: {
      type: "days",
      value: 30,
    },

    aggregation: "daily",

    displayOrder: 15,

    visible: true,
  },
  {
    id: "test-life-score-trend-line",

    title: "[Test] Life Score Trend",

    description: "Trend executor + line renderer",

    widget: "line-chart",

    scope: "global",

    provider: "entry",

    executor: "trend",

    key: "score",

    period: {
      type: "days",
      value: 30,
    },

    aggregation: "daily",

    displayOrder: 20,

    visible: true,
  },
  {
    id: "test-sleep-trend-line",

    title: "[Test] Sleep Hours Trend",

    description: "Trend executor + metric provider",

    widget: "line-chart",

    scope: "goal",

    provider: "metric",

    executor: "trend",

    key: "Sleep",

    period: {
      type: "days",
      value: 30,
    },

    aggregation: "daily",

    displayOrder: 21,

    visible: true,
  },
  {
    id: "test-water-trend-area",

    title: "[Test] Water Intake Trend",

    description: "Trend executor + metric provider (area)",

    widget: "area-chart",

    scope: "goal",

    provider: "metric",

    executor: "trend",

    key: "Water intake",

    period: {
      type: "days",
      value: 30,
    },

    aggregation: "daily",

    displayOrder: 22,

    visible: true,
  },
  {
    id: "test-work-progress-trend-bar",

    title: "[Test] Work Progress Trend",

    description: "Trend executor + metric provider (bar)",

    widget: "bar-chart",

    scope: "goal",

    provider: "metric",

    executor: "trend",

    key: "Work progress",

    period: {
      type: "days",
      value: 30,
    },

    aggregation: "daily",

    displayOrder: 23,

    visible: true,
  },
  {
    id: "test-category-breakdown-radar",

    title: "[Test] Category Breakdown",

    description: "Trend executor + category provider + radar renderer",

    widget: "radar-chart",

    scope: "category",

    provider: "category",

    executor: "trend",

    key: "all",

    period: {
      type: "days",
      value: 30,
    },

    aggregation: "average",

    displayOrder: 24,

    visible: true,
  },
  {
    id: "test-category-leaderboard",

    title: "[Test] Category Leaderboard",

    description: "Leaderboard executor + category provider",

    widget: "leaderboard",

    scope: "category",

    provider: "category",

    executor: "leaderboard",

    key: "all",

    period: {
      type: "days",
      value: 30,
    },

    aggregation: "average",

    displayOrder: 25,

    visible: true,
  },
  {
    id: "test-consistency-heatmap",

    title: "[Test] Consistency Heatmap",

    description: "Heatmap executor + entry provider",

    widget: "heatmap",

    scope: "global",

    provider: "entry",

    executor: "heatmap",

    key: "score",

    period: {
      type: "days",
      value: 84,
    },

    aggregation: "daily",

    displayOrder: 26,

    visible: true,
  },
  {
    id: "test-life-score-timeline",

    title: "[Test] Life Score Timeline",

    description: "Timeline executor + entry provider",

    widget: "timeline",

    scope: "global",

    provider: "entry",

    executor: "timeline",

    key: "score",

    period: {
      type: "days",
      value: 21,
    },

    aggregation: "daily",

    displayOrder: 27,

    visible: true,
  },
  {
    id: "test-sleep-insight",

    title: "[Test] Sleep Insight",

    description: "Insight executor + metric provider",

    widget: "insight-card",

    scope: "goal",

    provider: "metric",

    executor: "insight",

    key: "Sleep",

    period: {
      type: "days",
      value: 30,
    },

    aggregation: "average",

    displayOrder: 28,

    visible: true,
  },
  // {
  //   id: "life-score-trend",
  //   title: "Life Score Trend",
  //   description: "Score progression over time",
  //   widget: "line-chart",
  //   scope: "global",
  //   provider: "entry",
  //   executor: "chart",
  //   key: "score",

  //   period: {
  //     type: "days",
  //     value: 30,
  //   },

  //   aggregation: "daily",

  //   displayOrder: 1,
  //   visible: true,
  // },
  // // Latest Life Score
  // {
  //   id: "life-score-current",
  //   title: "Current Life Score",
  //   description: "Latest recorded life score",
  //   widget: "stat-card",
  //   scope: "global",
  //   provider: "entry",
  //   executor: "stat",
  //   key: "score",
  //   period: {
  //     type: "days",
  //     value: 7,
  //   },
  //   aggregation: "latest",
  //   displayOrder: 1,
  //   visible: true,
  //   options: {
  //     comparison: "previous-day",
  //   },
  // },

  // // Average Life Score
  // {
  //   id: "life-score-average",
  //   title: "Average Life Score",
  //   description: "Average score over the selected period",
  //   widget: "stat-card",
  //   scope: "global",
  //   provider: "entry",
  //   executor: "stat",
  //   key: "score",
  //   period: {
  //     type: "days",
  //     value: 30,
  //   },
  //   aggregation: "average",
  //   displayOrder: 2,
  //   visible: true,
  //   options: {
  //     comparison: "previous-period",
  //   },
  // },

  // // Total XP
  // {
  //   id: "xp-total",
  //   title: "Total XP",
  //   description: "XP earned during the selected period",
  //   widget: "stat-card",
  //   scope: "global",
  //   provider: "entry",
  //   executor: "stat",
  //   key: "xp",
  //   period: {
  //     type: "days",
  //     value: 30,
  //   },
  //   aggregation: "sum",
  //   displayOrder: 3,
  //   visible: true,
  // },

  // // Average XP
  // {
  //   id: "xp-average",
  //   title: "Average XP",
  //   description: "Average XP per day",
  //   widget: "stat-card",
  //   scope: "global",
  //   provider: "entry",
  //   executor: "stat",
  //   key: "xp",
  //   period: {
  //     type: "days",
  //     value: 30,
  //   },
  //   aggregation: "average",
  //   displayOrder: 4,
  //   visible: true,
  // },

  // // Entry Count
  // {
  //   id: "entry-count",
  //   title: "Entries Logged",
  //   description: "Number of recorded days",
  //   widget: "stat-card",
  //   scope: "global",
  //   provider: "entry",
  //   executor: "stat",
  //   key: "score",
  //   period: {
  //     type: "days",
  //     value: 30,
  //   },
  //   aggregation: "count",
  //   displayOrder: 5,
  //   visible: true,
  // },

  // // Latest Sleep Score
  // {
  //   id: "sleep-score",
  //   title: "Sleep Score",
  //   description: "Latest sleep score",
  //   widget: "stat-card",
  //   scope: "goal",
  //   provider: "metric",
  //   executor: "stat",
  //   key: "sleep",
  //   period: {
  //     type: "days",
  //     value: 30,
  //   },
  //   aggregation: "latest",
  //   displayOrder: 6,
  //   visible: true,
  //   options: {
  //     comparison: "previous-day",
  //   },
  // },

  // // Average Sleep Score
  // {
  //   id: "sleep-average",
  //   title: "Average Sleep",
  //   description: "Average sleep score",
  //   widget: "stat-card",
  //   scope: "goal",
  //   provider: "metric",
  //   executor: "stat",
  //   key: "sleep",
  //   period: {
  //     type: "days",
  //     value: 30,
  //   },
  //   aggregation: "average",
  //   displayOrder: 7,
  //   visible: true,
  // },

  // // Total Sleep Score
  // {
  //   id: "sleep-total",
  //   title: "Sleep Total",
  //   description: "Total sleep score",
  //   widget: "stat-card",
  //   scope: "goal",
  //   provider: "metric",
  //   executor: "stat",
  //   key: "sleep",
  //   period: {
  //     type: "days",
  //     value: 30,
  //   },
  //   aggregation: "sum",
  //   displayOrder: 8,
  //   visible: true,
  // },

  // // Latest Protein Score
  // {
  //   id: "protein-score",
  //   title: "Protein",
  //   description: "Latest protein score",
  //   widget: "stat-card",
  //   scope: "goal",
  //   provider: "metric",
  //   executor: "stat",
  //   key: "protein intake",
  //   period: {
  //     type: "days",
  //     value: 30,
  //   },
  //   aggregation: "latest",
  //   displayOrder: 9,
  //   visible: true,
  // },

  // // Latest Steps Score
  // {
  //   id: "steps-score",
  //   title: "Steps",
  //   description: "Latest steps score",
  //   widget: "stat-card",
  //   scope: "goal",
  //   provider: "metric",
  //   executor: "stat",
  //   key: "steps",
  //   period: {
  //     type: "days",
  //     value: 30,
  //   },
  //   aggregation: "latest",
  //   displayOrder: 10,
  //   visible: true,
  //   options: {
  //     comparison: "previous-day",
  //   },
  // },
];

export const DEFAULT_VISUALIZATIONS: VisualizationDefinition[] = [
  {
    id: "life-score-current",
    title: "Life Score Today",
    description: "Latest recorded life score",
    widget: "stat-card",
    scope: "global",
    provider: "entry",
    executor: "stat",
    key: "score",
    period: {
      type: "days",
      value: 7,
    },
    aggregation: "latest",
    displayOrder: 10,
    visible: true,
    options: {
      comparison: "previous-day",
    },
  },
  {
    id: "life-score-weekly-average",
    title: "Life Score (7d Avg)",
    description: "Average life score over the last 7 days",
    widget: "stat-card",
    scope: "global",
    provider: "entry",
    executor: "stat",
    key: "score",
    period: {
      type: "days",
      value: 7,
    },
    aggregation: "average",
    displayOrder: 11,
    visible: true,
    options: {
      comparison: "previous-period",
    },
  },
  {
    id: "junk-food-streak",
    title: "No Junk Food Streak",
    description: "Current and best streak without junk food",
    widget: "stat-card",
    scope: "goal",
    provider: "goal",
    executor: "streak",
    key: "Junk food",
    period: {
      type: "days",
      value: 90,
    },
    aggregation: "streak",
    displayOrder: 12,
    visible: true,
  },
  {
    id: "alcohol-streak",
    title: "No Alcohol Streak",
    description: "Current and best streak without alcohol",
    widget: "stat-card",
    scope: "goal",
    provider: "goal",
    executor: "streak",
    key: "Alcohol consumption",
    period: {
      type: "days",
      value: 90,
    },
    aggregation: "streak",
    displayOrder: 13,
    visible: true,
  },
  {
    id: "wife-workout-streak",
    title: "Wife Workout Streak",
    description: "Current and best streak helping wife exercise",
    widget: "stat-card",
    scope: "goal",
    provider: "goal",
    executor: "streak",
    key: "Helped wife exercise",
    period: {
      type: "days",
      value: 90,
    },
    aggregation: "streak",
    displayOrder: 14,
    visible: true,
  },
  {
    id: "steps-completion-streak",
    title: "Steps Completion Streak",
    description: "Current and best streak hitting 10k+ steps",
    widget: "stat-card",
    scope: "goal",
    provider: "goal",
    executor: "streak",
    key: "Steps",
    period: {
      type: "days",
      value: 90,
    },
    aggregation: "streak",
    displayOrder: 15,
    visible: true,
  },
  {
    id: "steps-trend",
    title: "Steps Trend",
    description: "Daily steps progression",
    widget: "line-chart",
    scope: "goal",
    provider: "metric",
    executor: "trend",
    key: "Steps",
    period: {
      type: "days",
      value: 30,
    },
    aggregation: "daily",
    displayOrder: 20,
    visible: true,
  },
  {
    id: "protein-intake-trend",
    title: "Protein Intake Trend",
    description: "Daily protein servings over time",
    widget: "bar-chart",
    scope: "goal",
    provider: "metric",
    executor: "trend",
    key: "Protein intake",
    period: {
      type: "days",
      value: 30,
    },
    aggregation: "daily",
    displayOrder: 21,
    visible: true,
  },
  {
    id: "sleep-hours-trend",
    title: "Sleep Hours Trend",
    description: "Sleep duration trend across recent days",
    widget: "line-chart",
    scope: "goal",
    provider: "metric",
    executor: "trend",
    key: "Sleep",
    period: {
      type: "days",
      value: 30,
    },
    aggregation: "daily",
    displayOrder: 22,
    visible: true,
  },
  {
    id: "water-intake-trend",
    title: "Water Intake Trend",
    description: "Daily water intake trend",
    widget: "area-chart",
    scope: "goal",
    provider: "metric",
    executor: "trend",
    key: "Water intake",
    period: {
      type: "days",
      value: 30,
    },
    aggregation: "daily",
    displayOrder: 23,
    visible: true,
  },
  {
    id: "category-breakdown",
    title: "Category Breakdown",
    description: "Average score distribution by category",
    widget: "radar-chart",
    scope: "category",
    provider: "category",
    executor: "trend",
    key: "all",
    period: {
      type: "days",
      value: 30,
    },
    aggregation: "average",
    displayOrder: 30,
    visible: true,
  },
  {
    id: "category-leaderboard",
    title: "Category Leaderboard",
    description: "Category ranking by average score",
    widget: "leaderboard",
    scope: "category",
    provider: "category",
    executor: "leaderboard",
    key: "all",
    period: {
      type: "days",
      value: 30,
    },
    aggregation: "average",
    displayOrder: 31,
    visible: true,
  },
  {
    id: "bed-time-timeline",
    title: "Bed Time Timeline",
    description: "Recent bed time pattern and shifts",
    widget: "timeline",
    scope: "goal",
    provider: "metric",
    executor: "timeline",
    key: "Bed time",
    period: {
      type: "days",
      value: 21,
    },
    options: {
      greenIfDeltaPositive: false,
    },
    aggregation: "daily",
    displayOrder: 40,
    visible: true,
  },
  {
    id: "wake-time-timeline",
    title: "Wake Time Timeline",
    description: "Recent wake time pattern and shifts",
    widget: "timeline",
    scope: "goal",
    provider: "metric",
    executor: "timeline",
    key: "Wake time",
    period: {
      type: "days",
      value: 21,
    },
    options: {
      greenIfDeltaPositive: false,
    },
    aggregation: "daily",
    displayOrder: 41,
    visible: true,
  },
  {
    id: "work-progress-insight",
    title: "Work Progress Insight",
    description: "Narrative summary of work momentum",
    widget: "insight-card",
    scope: "goal",
    provider: "metric",
    executor: "insight",
    key: "Work progress",
    period: {
      type: "days",
      value: 30,
    },
    aggregation: "average",
    displayOrder: 50,
    visible: true,
  },
  {
    id: "consistency-heatmap",
    title: "Consistency Heatmap",
    description: "Day-by-day life score intensity",
    widget: "heatmap",
    scope: "global",
    provider: "entry",
    executor: "heatmap",
    key: "score",
    period: {
      type: "days",
      value: 84,
    },
    aggregation: "daily",
    displayOrder: 51,
    visible: true,
  },
  {
    id: "workout-streak-or",
    title: "Workout Streak",
    description: "Steps >= 10k OR Cardio >= 10 OR Weight training = true",
    widget: "stat-card",
    scope: "goal",
    provider: "goal",
    executor: "streak",
    key: "workout-composite",
    period: { type: "days", value: 90 },
    aggregation: "streak",
    displayOrder: 16,
    visible: true,
    options: {
      streakRule: {
        operator: "or",
        conditions: [
          { goalLabel: "Steps", comparator: "gte", value: 10000 },
          { goalLabel: "Cardio", comparator: "gte", value: 10 },
          { goalLabel: "Weight training", comparator: "eq", value: true },
        ],
      },
    },
  },
  {
    id: "workout-streak-and",
    title: "Workout Streak (AND)",
    description: "Steps >= 10k AND Cardio >= 10 AND Weight training = true",
    widget: "stat-card",
    scope: "goal",
    provider: "goal",
    executor: "streak",
    key: "workout-composite-and",
    period: { type: "days", value: 90 },
    aggregation: "streak",
    displayOrder: 17,
    visible: true,
    options: {
      streakRule: {
        operator: "and",
        conditions: [
          { goalLabel: "Steps", comparator: "gte", value: 10000 },
          { goalLabel: "Cardio", comparator: "gte", value: 10 },
          { goalLabel: "Weight training", comparator: "eq", value: true },
        ],
      },
    },
  },
];

export const DEFAULT_COMBINATIONS: WorkoutCombination[] = [
  {
    id: "push",
    name: "Push",
    exerciseIds: [
      "db_bench_press",
      "db_shoulder_press",
      "incline_db_press",
      "lateral_raise",
      "pec_fly",
      "triceps_pushdown",
    ],
    active: true,
    description:
      "Push day covering chest, shoulders and triceps with priority on maintaining pressing strength while cutting fat. The six movements are the full menu; drop the final accessory if time is tight.",
    coachingNotes:
      "Use ascending load across sets rather than repeating the same weight. On primary presses, build through the session and let the final set be the hardest clean set rather than a forced failure. Keep 1 to 2 reps in reserve on most compound work. For raises and isolation work, chase controlled reps and tension. Because shoulder mobility is a priority, keep the press range pain-free and avoid excessive lumbar arching.",
    warmupGuidance:
      "5 to 7 min easy cardio, then 3 to 5 min shoulder/T-spine mobility: wall slides, band external rotations and controlled arm circles. Ramp the first press progressively: light x 10 to 12, moderate x 6 to 8, heavier x 3 to 5, then working sets. Do not waste working-set energy on excessive warm-up reps.",
    optionalExercises: ["cable_crossover", "overhead_triceps_extension"],
  },
  {
    id: "pull",
    name: "Pull",
    exerciseIds: [
      "deadlift",
      "face_pull",
      "incline_db_curl",
      "lat_pulldown",
      "reverse_fly",
      "seated_cable_row",
    ],
    active: true,
    description:
      "Pull day focused on deadlift strength, lat width, mid-back thickness, rear delts and biceps while protecting lower-back recovery.",
    coachingNotes:
      "Deadlift is the strength priority: ramp gradually and take one controlled top set at the day's planned load; do not chase a max when technique or back position deteriorates. After the deadlift, keep rows and pulldowns strict with full stretch and elbow-driven pulls. Use face pulls/reverse fly for shoulder balance, not load chasing. Finish with curls using a full stretch and controlled eccentric. If fatigue is high, remove one rear-delt or curl accessory rather than compromising the deadlift or major pulls.",
    warmupGuidance:
      "5 to 7 min incline walk or rower, followed by glute activation and hip-hinge prep: glute bridges, hip hinges and controlled hamstring sweeps. For deadlift, ramp with small jumps: 40 x 4, 60 x 3, 80 x 3, 100 x 2, 120 x 1 to 2, then working sets; adjust upward only while reps remain crisp. Keep warm-ups short and avoid turning them into extra volume.",
    optionalExercises: [
      "chest_supported_row",
      "straight_arm_pulldown",
      "assisted_pull_up",
      "hammer_curl",
      "back_extension",
    ],
  },
  {
    id: "legs",
    name: "Legs",
    exerciseIds: [
      "barbell_squat",
      "bulgarian_split_squat",
      "calf_raise",
      "hamstring_curl",
      "leg_extension",
      "romanian_deadlift",
    ],
    active: true,
    description:
      "Leg day covering quads, glutes, hamstrings and calves, with enough unilateral and posterior-chain work to improve general strength and mobility without excessive volume.",
    coachingNotes:
      "Squat is the main strength lift: ramp into it rather than spending energy on repeated warm-up reps. Build weight across working sets and stop before technical breakdown. Keep the Bulgarian split squat controlled and use it for unilateral strength and hip stability. RDL is a secondary hinge, so keep it moderate after squats. Use hamstring curls and extensions for efficient hypertrophy, then calves. If time is short, drop an isolation movement first.",
    warmupGuidance:
      "5 to 7 min bike or treadmill, then hip/ankle mobility and activation: deep squat hold, ankle rocks, glute bridges and bodyweight hinges. Ramp squat with bar x 8, light x 5, moderate x 3, near-working x 1 to 2, then working sets. Add only one extra ramp set if hips/hamstrings still feel stiff.",
    optionalExercises: [
      "leg_press",
      "hip_thrust",
      "adductor_machine",
      "abductor_machine",
      "soleus_calf_raise",
    ],
  },
  {
    id: "back",
    name: "Back",
    exerciseIds: ["deadlift", "lat_pulldown", "seated_cable_row"],
    active: true,
    description:
      "Back-focused combination for occasions when you want a shorter back session instead of the full Pull day.",
    coachingNotes:
      "Keep this as the efficient back-strength version: deadlift first, then one vertical pull and one horizontal row. Use ascending load and clean reps. If the lower back feels fatigued, reduce the deadlift top set rather than compensating with sloppy rows.",
    warmupGuidance:
      "5 min incline walk or rower, then hip hinge and scapular prep. Ramp deadlift with small jumps and low reps; for pulldown/row use one light preparation set before working sets.",
    optionalExercises: ["chest_supported_row", "straight_arm_pulldown"],
  },
  {
    id: "chest",
    name: "Chest",
    exerciseIds: ["db_bench_press", "incline_db_press", "pec_fly"],
    active: true,
    description:
      "Chest-focused combination preserving pressing strength and upper-chest development while keeping total volume efficient.",
    coachingNotes:
      "Build the dumbbell bench through ascending working sets. Use incline press as the secondary strength movement and pec fly as controlled isolation. Do not add the old multiple-fly variations by default; rotate cable crossover in when you want a different stimulus. Keep shoulders comfortable and avoid forcing the deepest stretch.",
    warmupGuidance:
      "5 to 7 min easy cardio, then shoulder/T-spine mobility and one or two light activation sets. Ramp the first press progressively with low reps as load rises. Once shoulders feel warm and the press path is stable, start working sets.",
    optionalExercises: ["cable_crossover"],
  },
  {
    id: "arms",
    name: "Arms",
    exerciseIds: ["incline_db_curl", "triceps_pushdown"],
    active: true,
    description:
      "Short arm-focused session for biceps and triceps when you want direct arm work without a full Push or Pull session.",
    coachingNotes:
      "Use ascending load while keeping reps controlled. For curls, prioritize the stretched position and avoid shoulder movement. For pushdowns, keep elbows stable and finish with full extension. Add a second biceps/triceps variation only if you have time.",
    warmupGuidance:
      "3 to 5 min light cardio, elbow/wrist circles and one light set for each movement. Ramp quickly; direct-arm work does not need multiple heavy warm-up sets.",
    optionalExercises: ["hammer_curl", "overhead_triceps_extension"],
  },
  {
    id: "shoulders",
    name: "Shoulders",
    exerciseIds: [
      "clean_and_press",
      "db_shoulder_press",
      "face_pull",
      "lateral_raise",
      "reverse_fly",
    ],
    active: true,
    description:
      "Shoulder-focused combination balancing overhead strength, lateral/rear-delt volume and shoulder-control work.",
    coachingNotes:
      "Treat clean and press as optional skill/power work, not a max-strength lift. Shoulder press remains the main strength movement. Keep ribs stacked over pelvis and avoid lumbar overextension. Use strict lateral and rear-delt work with controlled tempo. Face pulls are for scapular control and rear delts, not heavy loading.",
    warmupGuidance:
      "5 to 7 min easy cardio, then wall slides, band external rotations, thoracic extensions and light lateral raises. Ramp the shoulder press with low-rep jumps. If the clean feels technically poor, skip it rather than forcing it.",
    optionalExercises: ["overhead_triceps_extension"],
  },
  {
    id: "functional",
    name: "Functional",
    exerciseIds: [
      "clean_and_press",
      "deadlift",
      "farmers_carry",
      "hanging_knee_raise",
      "pallof_press",
    ],
    active: true,
    description:
      "Functional session for trunk stability, loaded carries, hinge strength, coordination and general work capacity. Best treated as an occasional add-on rather than a mandatory weekly session.",
    coachingNotes:
      "Quality beats fatigue. Keep clean and press light/moderate and technically crisp. Deadlift should not be heavy if you have already trained it recently. Use carries for posture and grip, Pallof press for anti-rotation and knee raises for controlled trunk work. Stop any movement when coordination breaks down.",
    warmupGuidance:
      "6 to 8 min easy cardio followed by hip mobility, thoracic rotation, glute bridges and dead-bug breathing. Perform one low-load preparation round before the complex movements.",
    optionalExercises: ["dead_bug", "cable_woodchop"],
  },
];

export const DEFAULT_EXERCISES: ExerciseDefinition[] = [
  {
    id: "db_bench_press",
    name: "Dumbbell Bench Press",
    categories: ["push", "chest"],
    muscleGroups: ["chest", "triceps", "front_delts"],
    equipment: "dumbbell",
    type: "compound",
    description:
      "Primary horizontal pressing movement for chest strength and development.",
    notes: [
      "Keep shoulder blades stable and retracted.",
      "Use a controlled eccentric.",
      "Maintain a comfortable but full range of motion.",
      "Primary strength movement.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "total",
    },
    progression: {
      repRange: {
        min: 5,
        max: 8,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 100,
    active: true,
  },
  {
    id: "incline_db_press",
    name: "Incline Dumbbell Press",
    categories: ["push", "chest"],
    muscleGroups: ["upper_chest", "triceps", "front_delts"],
    equipment: "dumbbell",
    type: "compound",
    description:
      "Incline pressing movement emphasizing the upper chest while also training the triceps and front delts.",
    notes: [
      "Use a moderate incline rather than an excessively steep angle.",
      "Keep shoulder blades stable.",
      "Control the dumbbells throughout the movement.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "per_hand",
    },
    progression: {
      repRange: {
        min: 6,
        max: 10,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 45,
    active: true,
  },
  {
    id: "db_shoulder_press",
    name: "Dumbbell Shoulder Press",
    categories: ["push", "shoulders"],
    muscleGroups: ["front_delts", "side_delts", "triceps"],
    equipment: "dumbbell",
    type: "compound",
    description:
      "Primary vertical pressing movement for shoulder and triceps strength.",
    notes: [
      "Avoid excessive lower-back arching.",
      "Keep the movement controlled.",
      "Use a comfortable range of motion based on shoulder mobility.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "per_hand",
    },
    progression: {
      repRange: {
        min: 6,
        max: 10,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 40,
    active: true,
  },
  {
    id: "lateral_raise",
    name: "Lateral Raise",
    categories: ["push", "shoulders"],
    muscleGroups: ["side_delts"],
    equipment: "dumbbell_or_cable",
    type: "isolation",
    description:
      "Isolation movement emphasizing the lateral deltoids for shoulder width.",
    notes: [
      "Use controlled movement rather than swinging.",
      "Lead with the elbows.",
      "Cable and dumbbell variations can be alternated.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "per_hand_or_stack",
    },
    progression: {
      repRange: {
        min: 10,
        max: 15,
      },
      strategy: "descending_weight",
    },
    currentWeight: null,
    targetWeight: 12.5,
    active: true,
  },
  {
    id: "triceps_pushdown",
    name: "Triceps Cable Pushdown",
    categories: ["push", "triceps", "arms"],
    muscleGroups: ["triceps"],
    equipment: "cable",
    type: "isolation",
    description: "Cable isolation movement for the triceps.",
    notes: [
      "Keep elbows relatively stationary.",
      "Control both the lowering and extension phases.",
      "Avoid using body momentum.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "stack",
    },
    progression: {
      repRange: {
        min: 10,
        max: 15,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 45,
    active: true,
  },
  {
    id: "pec_fly",
    name: "Seated Pec Fly",
    categories: ["push", "chest"],
    muscleGroups: ["chest"],
    equipment: "machine",
    type: "isolation",
    description:
      "Chest isolation movement emphasizing horizontal shoulder adduction.",
    notes: [
      "Use a controlled stretch.",
      "Do not excessively force the shoulder into the stretched position.",
      "Focus on bringing the upper arms together rather than moving the hands.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "stack",
    },
    progression: {
      repRange: {
        min: 10,
        max: 15,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 60,
    active: true,
  },
  {
    id: "deadlift",
    name: "Deadlift",
    categories: ["pull", "back", "posterior_chain", "functional"],
    muscleGroups: ["glutes", "hamstrings", "erectors", "traps", "lats", "grip"],
    equipment: "barbell",
    type: "compound",
    description:
      "Primary heavy hip-hinge movement for posterior-chain and full-body strength.",
    notes: [
      "Treat the first sets as preparation rather than fatigue-producing work.",
      "Keep the bar close to the body.",
      "Brace the trunk before initiating the lift.",
      "Do not force a heavy attempt on a bad day.",
      "Use a controlled top set rather than testing a maximum every session.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "total",
    },
    progression: {
      repRange: {
        min: 2,
        max: 5,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 190,
    active: true,
  },
  {
    id: "lat_pulldown",
    name: "Lat Pulldown",
    categories: ["pull", "back"],
    muscleGroups: ["lats", "biceps", "upper_back"],
    equipment: "cable_machine",
    type: "compound",
    description:
      "Vertical pulling movement emphasizing the lats and upper back.",
    notes: [
      "Avoid excessive swinging.",
      "Pull toward the upper chest.",
      "Focus on driving the elbows down.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "stack",
    },
    progression: {
      repRange: {
        min: 8,
        max: 12,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 75,
    active: true,
  },
  {
    id: "seated_cable_row",
    name: "Seated Cable Row",
    categories: ["pull", "back"],
    muscleGroups: ["mid_back", "rhomboids", "lats", "biceps"],
    equipment: "cable",
    type: "compound",
    description: "Horizontal pulling movement for the mid-back and lats.",
    notes: [
      "Maintain a stable torso.",
      "Pull through the elbows.",
      "Avoid excessive momentum.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "stack",
    },
    progression: {
      repRange: {
        min: 8,
        max: 12,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 70,
    active: true,
  },
  {
    id: "face_pull",
    name: "Face Pull",
    categories: ["pull", "shoulders", "rear_delts"],
    muscleGroups: ["rear_delts", "external_rotators", "upper_back"],
    equipment: "cable",
    type: "isolation",
    description:
      "Upper-back and rear-delt movement supporting shoulder balance and scapular control.",
    notes: [
      "Pull toward the face or forehead.",
      "Externally rotate the shoulders near the end.",
      "Use controlled weight rather than chasing load.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "stack",
    },
    progression: {
      repRange: {
        min: 12,
        max: 15,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 25,
    active: true,
  },
  {
    id: "reverse_fly",
    name: "Reverse Fly",
    categories: ["pull", "shoulders", "rear_delts"],
    muscleGroups: ["rear_delts", "upper_back"],
    equipment: "dumbbell_or_machine",
    type: "isolation",
    description:
      "Rear-delt isolation movement supporting shoulder balance and upper-back development.",
    notes: [
      "Use light enough weight to maintain control.",
      "Avoid turning the movement into a row.",
      "Focus on the rear delts rather than maximum load.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "per_hand_or_machine",
    },
    progression: {
      repRange: {
        min: 12,
        max: 15,
      },
      strategy: "descending_weight",
    },
    currentWeight: null,
    targetWeight: 10,
    active: true,
  },
  {
    id: "incline_db_curl",
    name: "Incline Dumbbell Curl",
    categories: ["pull", "biceps", "arms"],
    muscleGroups: ["biceps"],
    equipment: "dumbbell",
    type: "isolation",
    description:
      "Biceps isolation exercise with the shoulders positioned behind the torso.",
    notes: [
      "Allow a controlled stretch at the bottom.",
      "Avoid swinging.",
      "Use full controlled elbow flexion.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "per_hand",
    },
    progression: {
      repRange: {
        min: 8,
        max: 12,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 20,
    active: true,
  },
  {
    id: "barbell_squat",
    name: "Barbell Squat",
    categories: ["legs", "quads", "glutes", "strength"],
    muscleGroups: ["quadriceps", "glutes", "hamstrings", "core"],
    equipment: "barbell",
    type: "compound",
    description:
      "Primary lower-body strength movement emphasizing the quadriceps and glutes.",
    notes: [
      "Brace before each rep.",
      "Maintain controlled depth appropriate to mobility.",
      "Keep knee and foot tracking stable.",
      "Do not turn every session into a maximum attempt.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "total",
    },
    progression: {
      repRange: {
        min: 5,
        max: 8,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 150,
    active: true,
  },
  {
    id: "romanian_deadlift",
    name: "Romanian Deadlift",
    categories: ["legs", "hamstrings", "glutes", "posterior_chain"],
    muscleGroups: ["hamstrings", "glutes", "erectors"],
    equipment: "barbell_or_dumbbell",
    type: "compound",
    description:
      "Hip-hinge movement emphasizing hamstrings and glutes through a loaded stretch.",
    notes: [
      "Push hips backward rather than squatting down.",
      "Maintain a neutral spine.",
      "Stop when mobility limits further range without losing position.",
      "Use controlled eccentric movement.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "total",
    },
    progression: {
      repRange: {
        min: 6,
        max: 10,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 110,
    active: true,
  },
  {
    id: "bulgarian_split_squat",
    name: "Bulgarian Split Squat",
    categories: ["legs", "quads", "glutes", "unilateral"],
    muscleGroups: ["quadriceps", "glutes", "hamstrings", "core"],
    equipment: "dumbbell_or_bodyweight",
    type: "compound",
    description:
      "Unilateral lower-body movement improving leg strength, balance and hip stability.",
    notes: [
      "Keep the front foot stable.",
      "Use a controlled descent.",
      "Start with a manageable load.",
      "Prioritize balance and range of motion.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "per_hand_or_total",
    },
    progression: {
      repRange: {
        min: 8,
        max: 12,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 25,
    active: true,
  },
  {
    id: "hamstring_curl",
    name: "Hamstring Curl",
    categories: ["legs", "hamstrings"],
    muscleGroups: ["hamstrings"],
    equipment: "machine",
    type: "isolation",
    description: "Knee-flexion exercise directly targeting the hamstrings.",
    notes: [
      "Use a controlled eccentric.",
      "Avoid lifting the hips excessively.",
      "Focus on squeezing the hamstrings.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "stack",
    },
    progression: {
      repRange: {
        min: 10,
        max: 15,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 55,
    active: true,
  },
  {
    id: "leg_extension",
    name: "Leg Extension",
    categories: ["legs", "quads"],
    muscleGroups: ["quadriceps"],
    equipment: "machine",
    type: "isolation",
    description: "Knee-extension exercise directly targeting the quadriceps.",
    notes: [
      "Use controlled movement.",
      "Avoid momentum.",
      "Use a comfortable range of motion.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "stack",
    },
    progression: {
      repRange: {
        min: 10,
        max: 15,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 60,
    active: true,
  },
  {
    id: "calf_raise",
    name: "Calf Raise",
    categories: ["legs", "calves"],
    muscleGroups: ["gastrocnemius", "soleus"],
    equipment: "machine_or_bodyweight",
    type: "isolation",
    description:
      "Calf isolation movement through a controlled ankle range of motion.",
    notes: [
      "Use a full comfortable range.",
      "Pause at the stretched and contracted positions.",
      "Avoid bouncing.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "machine_or_total",
    },
    progression: {
      repRange: {
        min: 10,
        max: 15,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 100,
    active: true,
  },
  {
    id: "pallof_press",
    name: "Pallof Press",
    categories: ["core", "functional"],
    muscleGroups: ["obliques", "deep_core", "shoulders"],
    equipment: "cable_or_band",
    type: "core",
    description: "Anti-rotation core exercise developing trunk stability.",
    notes: [
      "Keep torso facing forward.",
      "Resist rotation rather than moving through the torso.",
      "Use controlled repetitions.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "stack",
    },
    progression: {
      repRange: {
        min: 10,
        max: 12,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 25,
    active: true,
  },
  {
    id: "hanging_knee_raise",
    name: "Hanging Knee Raise",
    categories: ["core", "functional"],
    muscleGroups: ["abdominals", "hip_flexors"],
    equipment: "bodyweight",
    type: "core",
    description:
      "Core exercise emphasizing abdominal control and pelvic positioning.",
    notes: [
      "Avoid swinging.",
      "Control the lowering phase.",
      "Curl the pelvis upward rather than simply lifting the knees.",
    ],
    tracking: {
      weight: false,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "bodyweight",
    },
    progression: {
      repRange: {
        min: 8,
        max: 15,
      },
      strategy: "rep_progression",
    },
    currentWeight: null,
    targetWeight: null,
    active: true,
  },
  {
    id: "cable_crunch",
    name: "Cable Crunch",
    categories: ["core", "abs"],
    muscleGroups: ["abdominals"],
    equipment: "cable",
    type: "core",
    description:
      "Loaded abdominal flexion exercise for progressive core strength.",
    notes: [
      "Move through the trunk rather than simply pulling the rope down.",
      "Control the eccentric.",
      "Avoid hip-driven momentum.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "stack",
    },
    progression: {
      repRange: {
        min: 10,
        max: 15,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 40,
    active: true,
  },
  {
    id: "farmers_carry",
    name: "Farmer's Carry",
    categories: ["functional", "core", "grip"],
    muscleGroups: ["grip", "traps", "core", "forearms"],
    equipment: "dumbbell_or_kettlebell",
    type: "functional",
    description:
      "Loaded carry developing grip, trunk stability, posture and work capacity.",
    notes: [
      "Walk with controlled steps.",
      "Keep torso upright.",
      "Avoid excessive leaning.",
      "Increase load or distance gradually.",
    ],
    tracking: {
      weight: true,
      reps: false,
      effort: true,
      duration: true,
      distance: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "per_hand",
    },
    progression: {
      repRange: null,
      strategy: "load_or_distance_progression",
    },
    currentWeight: null,
    targetWeight: 40,
    active: true,
  },
  {
    id: "clean_and_press",
    name: "Clean and Press",
    categories: ["functional", "full_body", "shoulders"],
    muscleGroups: ["legs", "glutes", "traps", "shoulders", "triceps", "core"],
    equipment: "barbell_or_dumbbell",
    type: "functional",
    description:
      "Explosive full-body movement combining a clean with an overhead press.",
    notes: [
      "Treat as a skill/power movement, not a fatigue exercise.",
      "Use light to moderate load while learning.",
      "Keep the clean technically crisp.",
      "Do not perform heavy reps after significant lower-back fatigue.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "total",
    },
    progression: {
      repRange: {
        min: 3,
        max: 5,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 50,
    active: true,
  },
  {
    id: "chest_supported_row",
    name: "Chest-Supported Row",
    categories: ["pull", "back"],
    muscleGroups: ["mid_back", "rhomboids", "lats", "rear_delts"],
    equipment: "machine_or_dumbbell",
    type: "compound",
    description:
      "Stable horizontal row that reduces lower-back demand while building upper- and mid-back thickness.",
    notes: [
      "Keep chest planted.",
      "Drive elbows back without shrugging.",
      "Use a full controlled stretch.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "per_hand_or_machine",
    },
    progression: {
      repRange: {
        min: 8,
        max: 12,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 30,
    active: true,
  },
  {
    id: "straight_arm_pulldown",
    name: "Straight-Arm Pulldown",
    categories: ["pull", "back"],
    muscleGroups: ["lats", "core"],
    equipment: "cable",
    type: "isolation",
    description:
      "Lat isolation movement emphasizing shoulder extension and lat control.",
    notes: [
      "Keep arms nearly straight.",
      "Move from the shoulders.",
      "Do not turn it into a triceps pressdown.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "stack",
    },
    progression: {
      repRange: {
        min: 10,
        max: 15,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 40,
    active: true,
  },
  {
    id: "assisted_pull_up",
    name: "Assisted Pull-Up",
    categories: ["pull", "back", "biceps"],
    muscleGroups: ["lats", "biceps", "upper_back", "core"],
    equipment: "assisted_pullup_machine_or_band",
    type: "compound",
    description:
      "Vertical pulling movement that builds toward unassisted pull-up strength.",
    notes: [
      "Start from a controlled hang.",
      "Drive elbows down.",
      "Reduce assistance gradually as strength improves.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "assistance",
    },
    progression: {
      repRange: {
        min: 5,
        max: 10,
      },
      strategy: "descending_assistance",
    },
    currentWeight: null,
    targetWeight: 0,
    active: true,
  },
  {
    id: "hammer_curl",
    name: "Hammer Curl",
    categories: ["pull", "biceps", "arms"],
    muscleGroups: ["biceps", "brachialis", "brachioradialis"],
    equipment: "dumbbell_or_cable",
    type: "isolation",
    description:
      "Neutral-grip curl building biceps, brachialis and forearm strength.",
    notes: [
      "Keep wrists neutral.",
      "Avoid torso swing.",
      "Control the eccentric.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "per_hand_or_stack",
    },
    progression: {
      repRange: {
        min: 8,
        max: 12,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 22.5,
    active: true,
  },
  {
    id: "overhead_triceps_extension",
    name: "Overhead Triceps Extension",
    categories: ["push", "triceps", "arms"],
    muscleGroups: ["triceps"],
    equipment: "cable_or_dumbbell",
    type: "isolation",
    description:
      "Triceps movement emphasizing the long head in an overhead position.",
    notes: [
      "Keep upper arms stable.",
      "Use a comfortable shoulder position.",
      "Prioritize stretch and control over load.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "stack_or_total",
    },
    progression: {
      repRange: {
        min: 10,
        max: 15,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 35,
    active: true,
  },
  {
    id: "leg_press",
    name: "Leg Press",
    categories: ["legs", "quads", "glutes"],
    muscleGroups: ["quadriceps", "glutes", "hamstrings"],
    equipment: "machine",
    type: "compound",
    description:
      "Stable compound leg movement adding lower-body volume without requiring barbell balance.",
    notes: [
      "Keep pelvis and lower back against the pad.",
      "Use controlled depth.",
      "Do not lock knees aggressively.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "machine",
    },
    progression: {
      repRange: {
        min: 8,
        max: 12,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 180,
    active: true,
  },
  {
    id: "hip_thrust",
    name: "Hip Thrust",
    categories: ["legs", "glutes", "posterior_chain"],
    muscleGroups: ["glutes", "hamstrings"],
    equipment: "barbell_or_machine",
    type: "compound",
    description:
      "Glute-dominant hip-extension movement useful for posterior-chain strength and hip control.",
    notes: [
      "Tuck ribs down and brace.",
      "Finish with glutes rather than lumbar extension.",
      "Pause briefly at lockout.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "total_or_machine",
    },
    progression: {
      repRange: {
        min: 8,
        max: 12,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 120,
    active: true,
  },
  {
    id: "cable_woodchop",
    name: "Cable Woodchop",
    categories: ["core", "functional"],
    muscleGroups: ["obliques", "abdominals", "core"],
    equipment: "cable",
    type: "core",
    description:
      "Rotational core movement training controlled force transfer through the trunk.",
    notes: [
      "Rotate through the torso and hips together.",
      "Keep the movement controlled.",
      "Do not yank the cable with the arms.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "stack",
    },
    progression: {
      repRange: {
        min: 8,
        max: 12,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 30,
    active: true,
  },
  {
    id: "dead_bug",
    name: "Dead Bug",
    categories: ["core", "functional", "mobility"],
    muscleGroups: ["deep_core", "abdominals", "hip_flexors"],
    equipment: "bodyweight",
    type: "core",
    description:
      "Low-load trunk-control drill improving bracing, rib-pelvis positioning and coordination.",
    notes: [
      "Keep lower back gently controlled against the floor.",
      "Move slowly.",
      "Exhale during the extension.",
    ],
    tracking: {
      weight: false,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "bodyweight",
    },
    progression: {
      repRange: {
        min: 6,
        max: 10,
      },
      strategy: "rep_progression",
    },
    currentWeight: null,
    targetWeight: null,
    active: true,
  },
  {
    id: "back_extension",
    name: "Back Extension",
    categories: ["pull", "back", "posterior_chain"],
    muscleGroups: ["erectors", "glutes", "hamstrings"],
    equipment: "back_extension_bench",
    type: "compound",
    description:
      "Controlled posterior-chain accessory for erectors, glutes and hamstrings.",
    notes: [
      "Hinge at the hips.",
      "Finish with a neutral torso rather than hyperextending.",
      "Add load only when bodyweight reps are controlled.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "bodyweight_or_total",
    },
    progression: {
      repRange: {
        min: 10,
        max: 15,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 20,
    active: true,
  },
  {
    id: "cable_crossover",
    name: "Cable Crossover",
    categories: ["push", "chest"],
    muscleGroups: ["chest", "front_delts"],
    equipment: "cable",
    type: "isolation",
    description:
      "Cable fly variation providing consistent chest tension through the movement.",
    notes: [
      "Use a slight bend in the elbows.",
      "Control the stretch.",
      "Bring the arms together without turning it into a press.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "per_side_or_stack",
    },
    progression: {
      repRange: {
        min: 10,
        max: 15,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 15,
    active: true,
  },
  {
    id: "adductor_machine",
    name: "Adductor Machine",
    categories: ["legs", "adductors"],
    muscleGroups: ["adductors"],
    equipment: "machine",
    type: "isolation",
    description: "Direct adductor strengthening and hip-control exercise.",
    notes: [
      "Use controlled range.",
      "Do not bounce into the stretched position.",
      "Progress gradually.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "stack",
    },
    progression: {
      repRange: {
        min: 12,
        max: 15,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 60,
    active: true,
  },
  {
    id: "abductor_machine",
    name: "Abductor Machine",
    categories: ["legs", "glutes", "hip_stability"],
    muscleGroups: ["gluteus_medius", "gluteus_minimus"],
    equipment: "machine",
    type: "isolation",
    description:
      "Hip-abduction exercise supporting glute development and lateral hip stability.",
    notes: [
      "Keep pelvis stable.",
      "Control both directions.",
      "Do not use momentum.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "stack",
    },
    progression: {
      repRange: {
        min: 12,
        max: 15,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 60,
    active: true,
  },
  {
    id: "soleus_calf_raise",
    name: "Seated Calf Raise",
    categories: ["legs", "calves"],
    muscleGroups: ["soleus"],
    equipment: "machine",
    type: "isolation",
    description: "Bent-knee calf movement emphasizing the soleus.",
    notes: [
      "Use a deep controlled stretch.",
      "Pause at the top.",
      "Avoid bouncing.",
    ],
    tracking: {
      weight: true,
      reps: true,
      effort: true,
    },
    weightTracking: {
      unit: "kg",
      mode: "machine",
    },
    progression: {
      repRange: {
        min: 12,
        max: 20,
      },
      strategy: "ascending_weight",
    },
    currentWeight: null,
    targetWeight: 80,
    active: true,
  },
];
