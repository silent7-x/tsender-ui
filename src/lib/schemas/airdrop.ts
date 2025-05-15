import {
  areAllPositiveBigInts,
  areAllValidAddresses,
  parseAmounts,
  parseRecipients,
  parseTokenAddress,
} from "@/lib/utils/form-helpers";
import { isAddress } from "viem";
import { z } from "zod";

export const formSchema = z
  .object({
    tokenAddress: z.string(),
    recipients: z.string(),
    amounts: z.string(),
  })
  .superRefine((data, ctx) => {
    const token = parseTokenAddress(data.tokenAddress);
    const recipientsArr = parseRecipients(data.recipients);
    const amountsArr = parseAmounts(data.amounts);

    if (token && !isAddress(token)) {
      ctx.addIssue({
        path: ["tokenAddress"],
        code: z.ZodIssueCode.custom,
        message: "Invalid Ethereum address",
      });
    }

    if (
      data.recipients &&
      (!areAllValidAddresses(recipientsArr) || recipientsArr.length === 0)
    ) {
      ctx.addIssue({
        path: ["recipients"],
        code: z.ZodIssueCode.custom,
        message: "All recipients must be valid Ethereum addresses",
      });
    }

    if (
      data.amounts &&
      (!areAllPositiveBigInts(amountsArr) || amountsArr.length === 0)
    ) {
      ctx.addIssue({
        path: ["amounts"],
        code: z.ZodIssueCode.custom,
        message: "All amounts must be positive integers",
      });
    }

    if (
      recipientsArr.length > 0 &&
      amountsArr.length > 0 &&
      recipientsArr.length !== amountsArr.length
    ) {
      ctx.addIssue({
        path: ["amounts"],
        code: z.ZodIssueCode.custom,
        message: "Recipients and amounts count must match",
      });
    }
  });

export const submitSchema = z
  .object({
    tokenAddress: z
      .string()
      .min(1, "Token address is required")
      .refine((val) => !val || isAddress(val), {
        message: "Invalid Ethereum address",
      }),
    recipients: z
      .string()
      .min(1, "At least one recipient is required")
      .transform(parseRecipients)
      .refine((arr) => arr.length === 0 || areAllValidAddresses(arr), {
        message: "All recipients must be valid Ethereum addresses",
      }),
    amounts: z
      .string()
      .min(1, "At least one amount is required")
      .transform(parseAmounts)
      .refine((arr) => arr.length === 0 || areAllPositiveBigInts(arr), {
        message: "All amounts must be positive integers",
      }),
  })
  .superRefine((data, ctx) => {
    if (data.recipients.length !== data.amounts.length) {
      ctx.addIssue({
        path: ["amounts"],
        code: z.ZodIssueCode.custom,
        message: "Recipients and amounts count must match",
      });
    }
  });
