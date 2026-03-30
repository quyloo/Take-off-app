export function buildFloorPlanPrompt(widthFt?: number, heightFt?: number): string {
  const dimensions = widthFt && heightFt
    ? `The space is approximately ${widthFt} feet wide by ${heightFt} feet deep.`
    : "";

  return `You are an architectural drafting assistant. Analyze this 2D floor plan image and convert it into clean, valid SVG XML.

${dimensions}

Requirements:
- Output ONLY the SVG XML — no markdown fences, no explanation text
- Use a viewBox of "0 0 800 600" (scale the floor plan to fit)
- Include a white or light gray background rectangle
- Draw walls as thick lines or rectangles (stroke-width: 3, color: #1e293b)
- Label each room with a <text> element (font-size: 12, color: #334155)
- Mark doors as small arcs (color: #64748b)
- Mark windows as short double lines on walls (color: #94a3b8)
- Add dimension annotations in feet as <text> elements along walls (font-size: 10, color: #64748b)
- Group each room with a <g id="room-ROOMNAME"> wrapper
- Use clean, minimal styling

Return only valid SVG XML starting with <svg and ending with </svg>.`;
}
