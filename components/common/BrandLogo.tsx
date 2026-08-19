import Image from "next/image";

interface BrandLogoProps {
  size?: number;
  textClassName?: string;
  className?: string;
  showText?: boolean;
}

export default function BrandLogo({
  size = 32,
  textClassName = "text-base font-semibold",
  className = "",
  showText = true,
}: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <Image
        src="/logo.png"
        alt="Productivity Tracker logo"
        width={size}
        height={size}
        priority
        className="rounded-md object-contain"
      />

      {showText ? (
        <span className={textClassName}>Productivity Tracker</span>
      ) : null}
    </div>
  );
}
