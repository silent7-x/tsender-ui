import { isAddress } from "viem";

export function parseTokenAddress(input: string): string {
  return input.trim();
}

export function parseRecipients(input: string): string[] {
  return input
    .trim()
    .split(/[\n,]+/)
    .map((addr) => addr.trim())
    .filter(Boolean);
}

export function parseAmounts(input: string): string[] {
  return input
    .trim()
    .split(/[\n,]+/)
    .map((amt) => amt.trim())
    .filter(Boolean);
}

export function areAllValidAddresses(arr: unknown): boolean {
  return Array.isArray(arr) && arr.every((address) => isAddress(address));
}

export function areAllPositiveBigInts(arr: unknown): boolean {
  return Array.isArray(arr) && arr.every((n) => /^\d+$/.test(n));
}

export function sumBigIntStrings(arr: string[]): bigint {
  return arr.reduce((acc, n) => acc + BigInt(n), 0n);
}

// export function stringifyBigInt(obj: unknown, space?: number) {
//   return JSON.stringify(
//     obj,
//     (_, v) => (typeof v === "bigint" ? v.toString() : v),
//     space
//   );
// }
