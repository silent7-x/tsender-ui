import { NetworkErrorDialog } from "@/components/NetworkErrorDialog";
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
import { chainsToTSender, erc20Abi, tsenderAbi } from "@/constants";
import { useAllowanceDebounced } from "@/hooks/useAllowanceDebounced";
import { formSchema, submitSchema } from "@/lib/schemas/airdrop";
import { cn } from "@/lib/utils";
import { getTokenBalance } from "@/lib/utils/balance";
import { parseAmounts, sumBigIntStrings } from "@/lib/utils/form-helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { waitForTransactionReceipt } from "@wagmi/core";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState, type ComponentPropsWithoutRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { isAddress, type Address } from "viem";
import { useAccount, useChainId, useConfig, useWriteContract } from "wagmi";
import { z } from "zod";

type AirdropFormProps = ComponentPropsWithoutRef<"form">;

export const AirdropForm = ({ className, ...props }: AirdropFormProps) => {
  const chainId = useChainId();
  const config = useConfig();
  const account = useAccount();
  const tSenderAddress = chainsToTSender[chainId]?.tsender as Address;
  const [showNetworkError, setShowNetworkError] = useState<boolean>(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      tokenAddress: "",
      recipients: "",
      amounts: "",
    },
  });

  const {
    allowance,
    isLoading,
    isReady,
    error: allowanceError,
  } = useAllowanceDebounced({
    tSenderAddress,
    accountAddress: account.address,
    amounts: form.watch("amounts"),
    recipients: form.watch("recipients"),
    tokenAddress: form.watch("tokenAddress"),
    formStateErrors: form.formState.errors,
    chainId,
    config,
    delay: 1000,
  });

  useEffect(() => {
    if (allowanceError) {
      toast(
        <span className="text-destructive text-base font-bold">Error</span>,
        {
          description: (
            <pre className="break-all whitespace-pre-wrap text-muted-foreground">
              {allowanceError}
            </pre>
          ),
        }
      );
    }
  }, [allowanceError]);

  const { isPending, writeContractAsync } = useWriteContract();

  useEffect(() => {
    if (!tSenderAddress || !isAddress(tSenderAddress)) {
      setShowNetworkError(true);
    }
  }, [chainId, tSenderAddress]);

  async function onSubmit(
    data: z.infer<typeof formSchema>,
    allowance: bigint | null
  ) {
    const result = submitSchema.safeParse(data);
    if (!result.success) {
      toast(
        <span className="text-destructive text-base font-bold">Error</span>,
        {
          description: (
            <pre className="break-all whitespace-pre-wrap text-muted-foreground">
              {result.error.errors.map((e, i) => (
                <p key={i}>{e.message}</p>
              ))}
            </pre>
          ),
        }
      );
      return;
    }
    if (!account.address) {
      toast(
        <span className="text-destructive text-base font-bold">Error</span>,
        {
          description: (
            <pre className="text-muted-foreground">
              Please connect your wallet!
            </pre>
          ),
        }
      );
      return;
    }

    const tokenAddress = result.data.tokenAddress;

    if (!tSenderAddress || !isAddress(tSenderAddress)) {
      setShowNetworkError(true);
      return;
    }

    if (!tokenAddress || !isAddress(tokenAddress)) {
      toast(
        <span className="text-destructive text-base font-bold">Error</span>,
        {
          description: (
            <pre className="text-muted-foreground">
              Please enter a valid ERC20 token address!
            </pre>
          ),
        }
      );
      return;
    }

    const amounts = result.data.amounts;
    const totalAmount = sumBigIntStrings(amounts);
    const recipients = result.data.recipients;

    try {
      const approvedAmount = allowance ?? 0n;

      if (approvedAmount < totalAmount) {
        try {
          const balance = await getTokenBalance(
            config,
            tokenAddress,
            account.address
          );

          if (balance < totalAmount) {
            toast(
              <span className="text-destructive text-base font-bold">
                Error
              </span>,
              {
                description: (
                  <pre className="break-all whitespace-pre-wrap text-muted-foreground">
                    Insufficient token balance! You need {totalAmount} tokens in
                    wei!
                  </pre>
                ),
              }
            );
            return;
          }

          const approvalHash = await writeContractAsync({
            abi: erc20Abi,
            address: tokenAddress,
            functionName: "approve",
            args: [tSenderAddress, totalAmount],
          });

          toast(
            <span className="text-base">
              Approval transaction sent with hash:
            </span>,
            {
              description: (
                <pre className="break-all whitespace-pre-wrap text-muted-foreground">
                  {approvalHash}
                </pre>
              ),
            }
          );

          const approvalReceipt = await waitForTransactionReceipt(config, {
            hash: approvalHash,
          });

          toast.success(
            <span className="text-base">Approval successful</span>,
            {
              description: (
                <pre className="break-all whitespace-pre-wrap text-muted-foreground">
                  <p>Transaction hash:</p>
                  <p>{approvalReceipt.transactionHash}</p>
                </pre>
              ),
            }
          );

          const airdropTransactionHash = await writeContractAsync({
            abi: tsenderAbi,
            address: tSenderAddress,
            functionName: "airdropERC20",
            args: [tokenAddress, recipients, amounts, totalAmount],
          });

          toast(
            <span className="text-base">
              Airdrop transaction sent with hash:
            </span>,
            {
              description: (
                <pre className="break-all whitespace-pre-wrap text-muted-foreground">
                  <p>{airdropTransactionHash}</p>
                </pre>
              ),
            }
          );

          const airdropTransactionReceipt = await waitForTransactionReceipt(
            config,
            {
              hash: airdropTransactionHash,
            }
          );

          toast.success(<span className="text-base">Airdrop successful</span>, {
            description: (
              <pre className="break-all whitespace-pre-wrap text-muted-foreground">
                <p>Transaction hash:</p>
                <p>{airdropTransactionReceipt.transactionHash}</p>
              </pre>
            ),
          });
        } catch (err) {
          throw new Error(err instanceof Error ? err.message : String(err));
        }
      } else {
        const balance = await getTokenBalance(
          config,
          tokenAddress,
          account.address
        );

        if (balance < totalAmount) {
          toast(
            <span className="text-destructive text-base font-bold">Error</span>,
            {
              description: (
                <pre className="break-all whitespace-pre-wrap text-muted-foreground">
                  Insufficient token balance! You need {totalAmount} tokens in
                  wei!
                </pre>
              ),
            }
          );
          return;
        }

        const airdropTransactionHash = await writeContractAsync({
          abi: tsenderAbi,
          address: tSenderAddress,
          functionName: "airdropERC20",
          args: [tokenAddress, recipients, amounts, totalAmount],
        });

        toast(
          <span className="text-base">
            Airdrop transaction sent with hash:
          </span>,
          {
            description: (
              <pre className="break-all whitespace-pre-wrap text-muted-foreground">
                <p>{airdropTransactionHash}</p>
              </pre>
            ),
          }
        );

        const airdropTransactionReceipt = await waitForTransactionReceipt(
          config,
          {
            hash: airdropTransactionHash,
          }
        );

        toast.success(<span className="text-base">Airdrop successful</span>, {
          description: (
            <pre className="break-all whitespace-pre-wrap text-muted-foreground">
              <p>Transaction hash:</p>
              <p>{airdropTransactionReceipt.transactionHash}</p>
            </pre>
          ),
        });
      }
    } catch (err) {
      console.error(err);
      toast(
        <span className="text-destructive text-base font-bold">Error</span>,
        {
          description: (
            <pre className="break-all whitespace-pre-wrap text-muted-foreground">
              {err instanceof Error ? err.message : String(err)}
            </pre>
          ),
        }
      );
    }
  }

  const totalAmount = sumBigIntStrings(parseAmounts(form.getValues("amounts")));

  return (
    <>
      <NetworkErrorDialog
        open={showNetworkError}
        onOpenChange={setShowNetworkError}
      />

      <Form {...form}>
        <form
          // onSubmit={form.handleSubmit((data) => {})} // onSubmit sera géré dans AllowanceChecker
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
                  <Input placeholder="0x..." spellCheck={false} {...field} />
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
                    spellCheck={false}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="pl-4 text-xs">
                  Addresses receiving the airdrop, one per line or
                  comma-separated
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
                  Amount of tokens to send in wei, one per line or
                  comma-separated
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={
                isPending ||
                isLoading ||
                !isReady ||
                Object.keys(form.formState.errors).length > 0
              }
              className="w-58 cursor-pointer"
              onClick={form.handleSubmit((data) => onSubmit(data, allowance))}
            >
              {isPending || isLoading ? (
                <LoaderCircle className="size-6 animate-[spin_2s_linear_infinite]" />
              ) : allowance !== null && allowance < totalAmount ? (
                "Approve Tokens & Send Airdrop"
              ) : allowance !== null && allowance >= totalAmount && isReady ? (
                "Send Airdrop"
              ) : (
                "Send Airdrop"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
