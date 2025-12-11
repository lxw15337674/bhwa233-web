
/**
 * Utility to wrap a PNG buffer into an SVG file.
 * This uses the embedded image approach.
 */

// Helper to convert Uint8Array to Base64 string
function uint8ArrayToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
}

export function packToSvg(pngBuffer: Uint8Array, width: number, height: number): Uint8Array {
    const base64 = uint8ArrayToBase64(pngBuffer);
    const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <image width="${width}" height="${height}" xlink:href="data:image/png;base64,${base64}"/>
</svg>`;

    const encoder = new TextEncoder();
    return encoder.encode(svgContent);
}
