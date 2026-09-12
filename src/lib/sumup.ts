import { SumUp } from "@sumup/sdk";

export function getSumupClient() {
  const apiKey = process.env.SUMUP_API_KEY;
  if (!apiKey) {
    throw new Error("SUMUP_API_KEY is not set");
  }
  return new SumUp({
    apiKey,
    ...(process.env.SUMUP_API_HOST
      ? { host: process.env.SUMUP_API_HOST }
      : {}),
  });
}

export function getMerchantCode(): string {
  const merchantCode = process.env.SUMUP_MERCHANT_CODE;
  if (!merchantCode) {
    throw new Error("SUMUP_MERCHANT_CODE is not set");
  }
  return merchantCode;
}

export function getWebhookUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl}/api${path}`;
}