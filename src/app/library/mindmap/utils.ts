export const calculateNodeSize = (text: string) => {
    // Estimations: 14px font height, roughly 14px per CJK char, 8px per Latin
    // This is heuristics. Real measurement would require measuring text on canvas.
    const charCount = text.length;
    const cjkCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const latinCount = charCount - cjkCount;

    // Width: base 100 + text length
    const textWidth = cjkCount * 15 + latinCount * 9;
    const width = Math.max(200, Math.min(400, textWidth + 60)); // clamp between 200 and 400

    // Height: base 60 + wrapping logic
    const lines = Math.ceil((textWidth + 20) / (width - 40));
    const height = Math.max(80, lines * 22 + 50);

    return { width, height };
};
