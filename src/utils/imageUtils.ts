import type { TradeRow } from "../lib/database.types";

export const extractEquityStoragePath = (value: string): string | null => {
  if (!value) return null;

  if (!/^https?:\/\//i.test(value)) {
    return value;
  }

  try {
    const parsed = new URL(value);
    const marker = "/storage/v1/object/public/equity-curves/";
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const path = parsed.pathname.slice(markerIndex + marker.length);
    return decodeURIComponent(path);
  } catch {
    return null;
  }
};

export const getTradeImagePaths = (row: TradeRow): string[] => {
  const urls = row.equity_curve_urls?.length
    ? row.equity_curve_urls
    : row.equity_curve_url
      ? [row.equity_curve_url]
      : [];

  return Array.from(
    new Set(
      urls
        .map((url) => extractEquityStoragePath(url))
        .filter((path): path is string => Boolean(path))
    )
  );
};

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
      img.src = objectUrl;
    });

    const MAX_DIMENSION = 1600;
    const scale = Math.min(MAX_DIMENSION / image.width, MAX_DIMENSION / image.height, 1);
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }

    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });

    if (!blob) {
      return file;
    }

    const compressedName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], compressedName, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
