"use client";

import SegmentedNav from "@/components/layout/SegmentedNav";

const ITEMS = [
  { label: "Overview", href: "/dashboard" },
  { label: "Logs", href: "/logs" },
];

export default function InsightsSubNav() {
  return <SegmentedNav items={ITEMS} label="Insights sections" />;
}
