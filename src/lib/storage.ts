import { Client } from "minio";

const globalForMinio = globalThis as unknown as {
  minio: Client | undefined;
};

function createMinioClient() {
  return new Client({
    endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin_dev",
  });
}

export const minio = globalForMinio.minio ?? createMinioClient();

export const IMAGE_BUCKET = process.env.MINIO_BUCKET ?? "skillmate-images";

export async function ensureBucketExists() {
  const exists = await minio.bucketExists(IMAGE_BUCKET);
  if (!exists) {
    await minio.makeBucket(IMAGE_BUCKET);
  }
}

export function publicImageUrl(objectName: string): string {
  const endpoint =
    process.env.MINIO_ENDPOINT ?? "localhost";
  const port = Number(process.env.MINIO_PORT ?? 9000);
  const useSSL = process.env.MINIO_USE_SSL === "true";
  const protocol = useSSL ? "https" : "http";
  const host = port ? `${endpoint}:${port}` : endpoint;
  return `${protocol}://${host}/${IMAGE_BUCKET}/${objectName}`;
}

if (process.env.NODE_ENV !== "production") globalForMinio.minio = minio;