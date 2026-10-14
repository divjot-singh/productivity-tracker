"use client";

import SegmentedNav from "@/components/layout/SegmentedNav";

const ITEMS = [
  { label: "Log", href: "/workouts" },
  { label: "Exercises", href: "/workouts/exercises" },
  { label: "Combinations", href: "/workouts/combinations" },
  { label: "Progress", href: "/workouts/progress" },
];

export default function WorkoutsSubNav() {
  return <SegmentedNav items={ITEMS} label="Workout sections" />;
}
