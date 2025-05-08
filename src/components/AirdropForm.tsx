import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  areAllPositiveBigInts,
  areAllValidAddresses,
  parseAmounts,
  parseRecipients,
  parseTokenAddress,
} from "@/lib/form-helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { isAddress } from "viem";
import { z } from "zod";

const formSchema = z
  .object({
    tokenAddress: z.string(),
    recipients: z.string(),
    amounts: z.string(),
  })
  .superRefine((data, ctx) => {
    const token = parseTokenAddress(data.tokenAddress);
    const recipientsArr = parseRecipients(data.recipients);
    const amountsArr = parseAmounts(data.amounts);
    console.log(token, recipientsArr, amountsArr);

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

const submitSchema = z
  .object({
    tokenAddress: z
      .string()
      .min(1, "Token address is required")
      .refine((val) => !val || isAddress(val), {
        message: "Invalid Ethereum address",
      }),
    recipients: z
      .string()
      .min(1, "Recipients are required")
      .transform(parseRecipients)
      .refine((arr) => arr.length === 0 || areAllValidAddresses(arr), {
        message: "All recipients must be valid Ethereum addresses",
      }),
    amounts: z
      .string()
      .min(1, "Amounts are required")
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

export function AirdropForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      tokenAddress: "",
      recipients: "",
      amounts: "",
    },
  });

  const recipients = useWatch({ control: form.control, name: "recipients" });
  const amounts = useWatch({ control: form.control, name: "amounts" });

  useEffect(() => {
    form.trigger("amounts");
  }, [recipients, amounts, form]);

  function submit(data: z.infer<typeof formSchema>) {
    const result = submitSchema.safeParse(data);
    if (!result.success) {
      toast.error("Error", {
        description: (
          <div>
            {result.error.errors.map((e, i) => (
              <div className="text-muted-foreground" key={i}>
                {e.message}
              </div>
            ))}
          </div>
        ),
      });
      return;
    }

    toast("Airdrop ready to be sent!", {
      description: <div className="text-muted-foreground">pending...</div>,
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="space-y-4"
        autoComplete="off"
      >
        <FormField
          control={form.control}
          name="tokenAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token Address</FormLabel>
              <FormControl>
                <Input placeholder="0x..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="recipients"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipients</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="one address per line or comma-separated"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amounts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amounts</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="amounts in wei, one per line or comma-separated"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-center">
          <Button type="submit" className="w-fit">
            Send Airdrop
          </Button>
        </div>
      </form>
    </Form>
  );
}
