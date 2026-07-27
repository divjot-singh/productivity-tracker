import { MetricDefinition } from "@/models/metric";

export const DEFAULT_METRICS: MetricDefinition[] = [
  // ---------------- HEALTH ----------------

  {
    id: "sleep",

    label: "Sleep",

    description: "Total hours slept",

    category: "health",

    displayOrder: 1,

    type: "number",

    unit: "hours",

    defaultValue: 0,

    target: 8,

    weight: 10,

    bonusRate: 0,

    scoring: {
      type: "range",

      ranges: [
        {
          min: 5,
          max: 5.9,
          score: 4,
        },

        {
          min: 6,
          max: 6.9,
          score: 7,
        },

        {
          min: 7,
          max: 7.9,
          score: 9,
        },

        {
          min: 8,
          max: 8.9,
          score: 10,
        },

        {
          min: 9,
          max: 9.9,
          score: 9,
        },

        {
          min: 10,
          max: 10.9,
          score: 7,
        },
      ],
    },
  },

  {
    id: "protein",

    label: "Protein",

    description: "Protein servings consumed",

    category: "health",

    displayOrder: 2,

    type: "number",

    unit: "servings",

    defaultValue: 0,

    target: 3,

    weight: 8,

    bonusRate: 0,

    scoring: {
      type: "target",
    },
  },

  // ---------------- FITNESS ----------------

  {
    id: "weightTraining",

    label: "Weight Training",

    category: "fitness",

    displayOrder: 3,

    type: "boolean",

    defaultValue: false,

    target: true,

    weight: 10,

    bonusRate: 0,

    scoring: {
      type: "boolean",
    },
  },

  {
    id: "cardio",

    label: "Cardio",

    category: "fitness",

    displayOrder: 4,

    type: "number",

    unit: "minutes",

    defaultValue: 0,

    target: 10,

    weight: 5,

    bonusRate: 0.1,

    scoring: {
      type: "target",
    },
  },

  {
    id: "steps",

    label: "Steps",

    category: "fitness",

    displayOrder: 5,

    type: "number",

    unit: "steps",

    defaultValue: 0,

    target: 10000,

    weight: 5,

    bonusRate: 0.0002,

    scoring: {
      type: "target",
    },
  },

  {
    id: "stretching",

    label: "Stretching",

    category: "fitness",

    displayOrder: 6,

    type: "boolean",

    defaultValue: false,

    target: true,

    weight: 5,

    bonusRate: 0,

    scoring: {
      type: "boolean",
    },
  },

  // ---------------- LIFESTYLE ----------------

  {
    id: "healthyEating",

    label: "Healthy Eating",

    category: "lifestyle",

    displayOrder: 7,

    type: "boolean",

    defaultValue: false,

    target: true,

    weight: 5,

    bonusRate: 0,

    scoring: {
      type: "boolean",
    },
  },

  {
    id: "noAlcohol",

    label: "No Alcohol",

    category: "lifestyle",

    displayOrder: 8,

    type: "boolean",

    defaultValue: false,

    target: true,

    weight: 5,

    bonusRate: 0,

    scoring: {
      type: "boolean",
    },
  },

  {
    id: "primaryGoal",

    label: "Primary Goal",

    description: "Daily progress towards primary goal",

    category: "lifestyle",

    displayOrder: 9,

    type: "number",

    unit: "tasks",

    defaultValue: 0,

    target: 5,

    weight: 20,

    bonusRate: 0,

    scoring: {
      type: "target",
    },
  },

  // ---------------- FAMILY ----------------

  {
    id: "helpedWifeExercise",

    label: "Helped Wife Exercise",

    category: "family",

    displayOrder: 10,

    type: "boolean",

    defaultValue: false,

    target: true,

    weight: 10,

    bonusRate: 0,

    scoring: {
      type: "boolean",
    },
  },

  {
    id: "householdHelp",

    label: "Household Help",

    category: "family",

    displayOrder: 11,

    type: "boolean",

    defaultValue: false,

    target: true,

    weight: 8,

    bonusRate: 0,

    scoring: {
      type: "boolean",
    },
  },

  // ---------------- ROUTINE ----------------

  {
    id: "wakeTime",

    label: "Wake Time",

    category: "routine",

    displayOrder: 12,

    type: "time-range",

    defaultValue: "",

    target: "07:30",

    weight: 5,

    bonusRate: 0,

    scoring: {
      type: "time-range",

      time: [
        {
          from: "07:30",
          to: "07:59",
          score: 10,
        },

        {
          from: "08:00",
          to: "08:29",
          score: 8,
        },

        {
          from: "08:30",
          to: "08:59",
          score: 6,
        },

        {
          from: "09:00",
          to: "09:29",
          score: 4,
        },

        {
          from: "09:30",
          to: "09:59",
          score: 2,
        },

        {
          from: "10:00",
          to: "23:59",
          score: 0,
        },
      ],
    },
  },

  {
    id: "bedTime",

    label: "Bed Time",

    category: "routine",

    displayOrder: 13,

    type: "time-range",

    defaultValue: "",

    target: "23:30",

    weight: 5,

    bonusRate: 0,

    scoring: {
      type: "time-range",

      time: [
        {
          from: "21:00",
          to: "21:59",
          score: 10,
        },

        {
          from: "22:00",
          to: "22:59",
          score: 8,
        },

        {
          from: "23:00",
          to: "23:29",
          score: 6,
        },

        {
          from: "00:00",
          to: "00:59",
          score: 4,
        },

        {
          from: "01:00",
          to: "01:59",
          score: 2,
        },

        {
          from: "02:00",
          to: "20:59",
          score: 0,
        },
      ],
    },
  },

  {
    id: "oralHygiene",

    label: "Oral Hygiene",

    category: "routine",

    displayOrder: 14,

    type: "number",

    unit: "times",

    defaultValue: 0,

    target: 2,

    weight: 4,

    bonusRate: 0,

    scoring: {
      type: "target",
    },
  },
];
