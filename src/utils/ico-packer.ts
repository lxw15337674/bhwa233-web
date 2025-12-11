
/**
 * Utility to pack a PNG buffer into an ICO file.
 *
 * ICO File Format Structure:
 * 1. ICONDIR (6 bytes)
 *    - Reserved (2 bytes): Always 0
 *    - Type (2 bytes): 1 for ICO
 *    - Count (2 bytes): Number of images (1 in our case)
 *
 * 2. ICONDIRENTRY (16 bytes per image)
 *    - Width (1 byte): 0 means 256
 *    - Height (1 byte): 0 means 256
 *    - ColorCount (1 byte): 0 if >= 8bpp
 *    - Reserved (1 byte): Always 0
 *    - Planes (2 bytes): Color planes (1)
 *    - BitCount (2 bytes): Bits per pixel (32 for PNG)
 *    - BytesInRes (4 bytes): Size of the image data
 *    - ImageOffset (4 bytes): Offset of the image data from start of file
 *
 * 3. Image Data
 *    - The actual PNG buffer
 */

export function packToIco(pngBuffer: Uint8Array, width: number, height: number): Uint8Array {
    const headerSize = 6;
    const directorySize = 16;
    const offset = headerSize + directorySize;
    const size = pngBuffer.length;

    const buffer = new ArrayBuffer(offset + size);
    const view = new DataView(buffer);

    // 1. ICONDIR
    view.setUint16(0, 0, true); // Reserved
    view.setUint16(2, 1, true); // Type (1 = ICO)
    view.setUint16(4, 1, true); // Count (1 image)

    // 2. ICONDIRENTRY
    // Width (0 means 256)
    view.setUint8(6, width >= 256 ? 0 : width);
    // Height (0 means 256)
    view.setUint8(7, height >= 256 ? 0 : height);
    // ColorCount (0 for true color)
    view.setUint8(8, 0);
    // Reserved
    view.setUint8(9, 0);
    // Planes (1)
    view.setUint16(10, 1, true);
    // BitCount (32 for PNG)
    view.setUint16(12, 32, true);
    // BytesInRes (Size of PNG data)
    view.setUint32(14, size, true);
    // ImageOffset (Offset where PNG data starts)
    view.setUint32(18, offset, true);

    // 3. Image Data
    const uint8View = new Uint8Array(buffer);
    uint8View.set(pngBuffer, offset);

    return uint8View;
}
