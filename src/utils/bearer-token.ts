export function extractBearerToken(header: string | undefined): string | null {
  const match = header?.match(/^Bearer\s+(\S+)$/i);

  return match?.[1] ?? null;
}
