// @/helper/blobToBase.ts
export async function blobToBase64(blob: Blob): Promise<string> {
    // In Node.js environment, we need to use Buffer instead of FileReader
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:${blob.type};base64,${buffer.toString('base64')}`;
}