const CONSTRUCTOR_COLORS: Record<string, string> = {
  alpine: "#00A1E8",
  aston_martin: "#00665E",
  audi: "#00302B",
  cadillac: "#8B2635",
  ferrari: "#E8002D",
  haas: "#B6BABD",
  mclaren: "#FF8000",
  mercedes: "#27F4D2",
  rb: "#6692FF",
  red_bull: "#3671C6",
  williams: "#1868DB",
};

const FALLBACK_COLOR = "#9CA3AF";

export function getConstructorColor(constructorId: string): string {
  return CONSTRUCTOR_COLORS[constructorId] ?? FALLBACK_COLOR;
}
