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
import { zodResolver } from "@hookform/resolvers/zod";
import { readContract } from "@wagmi/core";
import { LoaderPinwheel } from "lucide-react";
import { type ComponentPropsWithoutRef, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { type Address, erc20Abi, isAddress } from "viem";
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

  async function getApprovedAmount(
    spenderAddress: Address,
    erc20TokenAddress: Address,
    ownerAddress: Address
  ): Promise<bigint> {
    console.log(`Checking allowance for token ${erc20TokenAddress}`);
    console.log(`Owner: ${ownerAddress}`);
    console.log(`Spender: ${spenderAddress}`);

    try {
      const allowance = await readContract(config, {
        abi: erc20Abi,
        address: erc20TokenAddress,
        functionName: "allowance",
        args: [ownerAddress, spenderAddress],
      });
      console.log("Raw allowance response:", allowance);

      return allowance;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

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

    const tokenAddress = result.data.tokenAddress;
    const tSenderAddress = chainsToTSender[chainId]?.tsender;

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

    setIsLoading(true);

    try {
      const approvedAmount = await getApprovedAmount(
        tSenderAddress,
        tokenAddress,
        account.address
      );

      console.log("Approved amount:", approvedAmount);

      toast("Airdrop ready to be sent", {
        description: <pre>Pending...</pre>,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch token allowance!", {});
    } finally {
      setIsLoading(false);
    }
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
                ERC20 token to send
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
                Address receiving the airdrop
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
                Amount of tokens to send
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
