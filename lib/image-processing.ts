import sharp from "sharp";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function detectedMime(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function processSafeImage(file: File, maxBytes = 10 * 1024 * 1024) {
  if (!allowedTypes.has(file.type) || file.size < 1 || file.size > maxBytes) {
    throw new Error("UNSUPPORTED_IMAGE");
  }
  const input = Buffer.from(await file.arrayBuffer());
  const mime = detectedMime(input);
  if (!mime || mime !== file.type) throw new Error("INVALID_IMAGE_SIGNATURE");

  const pipeline = sharp(input, { failOn: "error", limitInputPixels: 40_000_000 }).rotate();
  const metadata = await pipeline.metadata();
  if (!metadata.width || !metadata.height) throw new Error("INVALID_IMAGE_DIMENSIONS");

  let output: Buffer;
  let extension: "jpg" | "png" | "webp";
  if (mime === "image/png") {
    extension = "png";
    output = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  } else if (mime === "image/webp") {
    extension = "webp";
    output = await pipeline.webp({ quality: 95 }).toBuffer();
  } else {
    extension = "jpg";
    output = await pipeline.jpeg({ quality: 94, chromaSubsampling: "4:4:4" }).toBuffer();
  }
  if (output.length > maxBytes) throw new Error("PROCESSED_IMAGE_TOO_LARGE");

  const finalMetadata = await sharp(output).metadata();
  return {
    buffer: output,
    mime,
    extension,
    width: finalMetadata.width ?? metadata.width,
    height: finalMetadata.height ?? metadata.height,
  };
}
