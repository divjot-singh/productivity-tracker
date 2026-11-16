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
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        role="img"
        aria-label="Daylog logo"
        className="text-primary"
      >
        <circle
          cx="16"
          cy="16"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M11.5 16.5 L14.5 19.5 L20.5 12.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText ? <span className={textClassName}>Daylog</span> : null}
    </div>
  );
}
