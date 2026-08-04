import { MetricDefinition } from "@/models/metric";
import { VisualizationDefinition } from "@/models/visualization";

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
];
