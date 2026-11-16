"use client";

import SegmentedNav from "@/components/layout/SegmentedNav";

const ITEMS = [
  { label: "Goals", href: "/settings" },
  { label: "Visualizations", href: "/settings/visualizations" },
];

export default function SettingsSubNav() {
  return <SegmentedNav items={ITEMS} label="Settings sections" />;
}
