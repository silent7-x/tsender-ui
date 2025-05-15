import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { chainsToTSender } from "@/constants";
import { formSchema, submitSchema } from "@/lib/schemas/airdrop";
import { cn } from "@/lib/utils";
import { getApprovedAmount } from "@/lib/utils/allowance";
import { sumBigIntStrings } from "@/lib/utils/form-helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderPinwheel } from "lucide-react";
import { type ComponentPropsWithoutRef, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { isAddress } from "viem";
import { useAccount, useChainId, useConfig } from "wagmi";
import { z } from "zod";

type AirdropFormProps = ComponentPropsWithoutRef<"form">;

export const AirdropForm = ({ className, ...props }: AirdropFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const chainId = useChainId();
  const config = useConfig();
  const account = useAccount();

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

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const result = submitSchema.safeParse(data);
    if (!result.success) {
      toast.error("Error", {
        description: (
          <pre>
            {result.error.errors.map((e, i) => (
              <p key={i}>{e.message}</p>
            ))}
          </pre>
        ),
      });
      return;
    }
    if (!account.address) {
      toast.error("Error", {
        description: <pre>Please connect your wallet!</pre>,
      });
      return;
    }

    const tSenderAddress = chainsToTSender[chainId]?.tsender;
    const tokenAddress = result.data.tokenAddress;

    if (!tSenderAddress || !isAddress(tSenderAddress)) {
      toast.error("Error", {
        description: (
          <pre>
            TSender contract not found for the connected network. Please switch
            network!
          </pre>
        ),
      });
      return;
    }

    if (!tokenAddress || !isAddress(tokenAddress)) {
      toast.error("Error", {
        description: <pre>Please enter a valid ERC20 token address!</pre>,
      });
      return;
    }

    const amounts = result.data.amounts;
    const totalAmount = sumBigIntStrings(amounts);

    setIsLoading(true);

    try {
      const approvedAmount = await getApprovedAmount(
        config,
        tSenderAddress,
        tokenAddress,
        account.address
      );

      console.log("Approved amount:", approvedAmount);

      if (approvedAmount < totalAmount) {
        // Logic to request approval will go here
        console.log("not enough approved");
      } else {
        // Logic to proceed with the airdrop directly
        console.log("enough approved");
      }

      toast("Airdrop ready to be sent", {
        description: <pre>Pending...</pre>,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch token allowance!", {});
    }

    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-8", className)}
        autoComplete="off"
        {...props}
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
              <FormDescription className="pl-4 text-xs">
                ERC20 token address to send
              </FormDescription>
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
              <FormDescription className="pl-4 text-xs">
                Addresses receiving the airdrop, one per line or comma-separated
              </FormDescription>
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
              <FormDescription className="pl-4 text-xs">
                Amount of tokens to send in wei, one per line or comma-separated
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-center">
          <Button type="submit" disabled={isLoading} className="w-fit">
            {isLoading && <LoaderPinwheel className=" animate-spin" />}
            Send Airdrop
          </Button>
        </div>
      </form>
    </Form>
  );
};
