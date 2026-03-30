export interface RenderingOptions {
  style: string;
  roomType: string;
  flooring?: string;
  wallColor?: string;
  cabinetFinish?: string;
  notes?: string;
  widthFt?: number;
  heightFt?: number;
}

export function buildRenderingPrompt(options: RenderingOptions): string {
  const {
    style,
    roomType,
    flooring = "hardwood",
    wallColor = "white",
    cabinetFinish = "white shaker",
    notes = "",
    widthFt,
    heightFt,
  } = options;

  const dimensions = widthFt && heightFt
    ? `The room is approximately ${widthFt} feet wide by ${heightFt} feet deep.`
    : "";

  const materialsDesc = [
    flooring && `${flooring} flooring`,
    wallColor && `${wallColor} walls`,
    cabinetFinish && roomType === "kitchen" ? `${cabinetFinish} cabinets` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return `Generate a photorealistic interior photograph of a ${roomType} in a residential home.

Style: ${style}
${dimensions}
Materials: ${materialsDesc}
${notes ? `Additional notes from site visit: ${notes}` : ""}

The image should show: natural lighting, a wide-angle lens perspective from a corner of the room, architectural photography style, high resolution, realistic textures and shadows. Make the space feel lived-in and professionally designed.`;
}

export const INTERIOR_STYLES = [
  "Modern Farmhouse",
  "Mid-Century Modern",
  "Scandinavian",
  "Industrial",
  "Transitional",
  "Contemporary",
  "Traditional",
  "Coastal",
] as const;

export const ROOM_TYPES = [
  "kitchen",
  "living room",
  "master bedroom",
  "bathroom",
  "dining room",
  "home office",
  "mudroom",
  "laundry room",
] as const;

export const FLOORING_OPTIONS = [
  "hardwood",
  "engineered wood",
  "luxury vinyl plank",
  "tile",
  "polished concrete",
  "carpet",
  "marble",
] as const;

export const WALL_COLORS = [
  "white",
  "off-white / warm white",
  "light gray",
  "greige",
  "navy blue",
  "sage green",
  "charcoal",
  "warm beige",
] as const;

export const CABINET_FINISHES = [
  "white shaker",
  "natural wood",
  "dark charcoal",
  "navy blue",
  "sage green",
  "black",
  "two-tone",
] as const;
