import { describe, expect, it } from "vitest";
import {
  areAllPositiveBigInts,
  areAllValidAddresses,
  parseAmounts,
  parseRecipients,
  parseTokenAddress,
  sumBigIntStrings,
} from "./form-helpers";

describe("parseTokenAddress", () => {
  it("trim leading and trailing spaces", () => {
    expect(parseTokenAddress("  0xabc  ")).toBe("0xabc");
  });
});

describe("parseRecipients", () => {
  it("split by newline", () => {
    expect(parseRecipients("a\nb")).toEqual(["a", "b"]);
  });
  it("split by comma", () => {
    expect(parseRecipients("a,b")).toEqual(["a", "b"]);
  });
  it("trim and filter empty", () => {
    expect(parseRecipients(" a , \n ,b ")).toEqual(["a", "b"]);
    expect(parseRecipients(" a ,,b ")).toEqual(["a", "b"]);
    expect(parseRecipients(" a \n b ")).toEqual(["a", "b"]);
    expect(parseRecipients(" a , , b ")).toEqual(["a", "b"]);
    expect(parseRecipients(" a , \n, , b ")).toEqual(["a", "b"]);
  });
});

describe("parseAmounts", () => {
  it("split by newline", () => {
    expect(parseAmounts("1\n2")).toEqual(["1", "2"]);
  });
  it("split by comma", () => {
    expect(parseAmounts("1,2")).toEqual(["1", "2"]);
  });
  it("trim and filter empty", () => {
    expect(parseAmounts(" 1 , \n ,2 ")).toEqual(["1", "2"]);
  });
});

describe("areAllValidAddresses", () => {
  it("returns true for all valid", () => {
    const arr = [
      "0x0000000000000000000000000000000000000000",
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    ];
    expect(areAllValidAddresses(arr)).toBe(true);
  });
  it("returns false for one invalid", () => {
    const arr = [
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "not-an-address",
    ];
    expect(areAllValidAddresses(arr)).toBe(false);
  });
  it("returns false for non-array", () => {
    expect(areAllValidAddresses("foo")).toBe(false);
  });
});

describe("areAllPositiveBigInts", () => {
  it("returns true for all positive", () => {
    expect(areAllPositiveBigInts(["1", "2", "999"])).toBe(true);
  });
  it("returns false for negative or non-numeric", () => {
    expect(areAllPositiveBigInts(["1", "-2", "3"])).toBe(false);
    expect(areAllPositiveBigInts(["1", "foo", "3"])).toBe(false);
  });
  it("returns false for non-array", () => {
    expect(areAllPositiveBigInts("foo")).toBe(false);
  });
});

describe("sumBigIntStrings", () => {
  it("sums string numbers as BigInt", () => {
    expect(sumBigIntStrings(["1", "2", "3"])).toBe(6n);
    expect(sumBigIntStrings(["1000000000000000000", "2"])).toBe(
      1000000000000000002n
    );
  });
  it("returns 0n for empty array", () => {
    expect(sumBigIntStrings([])).toBe(0n);
  });
});
