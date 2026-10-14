// Shared artwork for generated PWA icons (rendered by next/og, so only inline styles and SVG).
export const ICON_BACKGROUND = "#0d0e12";
export const ICON_ACCENT = "#7c83ff";

export function IconArt({ size }: { size: number }) {
  const centre = size / 2;
  const radius = size * 0.27;
  const stroke = size * 0.07;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: ICON_BACKGROUND,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={centre}
          cy={centre}
          r={radius}
          fill="none"
          stroke={ICON_ACCENT}
          strokeWidth={stroke}
        />
        <path
          d={`M ${size * 0.385} ${size * 0.5} L ${size * 0.47} ${size * 0.585} L ${size * 0.625} ${size * 0.415}`}
          fill="none"
          stroke={ICON_ACCENT}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
