import { FC } from "react";

const ChevronDownIcon: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default ChevronDownIcon;
