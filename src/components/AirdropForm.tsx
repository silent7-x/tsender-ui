import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { chainsToTSender, tsenderAbi } from "@/constants";
import { formSchema, submitSchema } from "@/lib/schemas/airdrop";
import { cn } from "@/lib/utils";
import { getApprovedAmount } from "@/lib/utils/allowance";
import { parseAmounts, sumBigIntStrings } from "@/lib/utils/form-helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { waitForTransactionReceipt } from "@wagmi/core";
import { LoaderCircle } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { erc20Abi, isAddress, type Address } from "viem";
import { useAccount, useChainId, useConfig, useWriteContract } from "wagmi";
import { z } from "zod";

type AirdropFormProps = ComponentPropsWithoutRef<"form">;

export const AirdropForm = ({ className, ...props }: AirdropFormProps) => {
  const chainId = useChainId();
  const config = useConfig();
  const account = useAccount();
  const {
    // data: hash,
    isPending,
    // error,
    writeContractAsync,
  } = useWriteContract();

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

  const [isAllowanceLoading, setIsAllowanceLoading] = useState<boolean>(false);
  const [allowance, setAllowance] = useState<bigint | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showNetworkError, setShowNetworkError] = useState<boolean>(false);

  const watchedAmounts = form.watch("amounts");
  const watchedRecipients = form.watch("recipients");
  const watchedTokenAddress = form.watch("tokenAddress");

  const tSenderAddress = chainsToTSender[chainId]?.tsender;

  useEffect(() => {
    if (!tSenderAddress || !isAddress(tSenderAddress)) {
      setShowNetworkError(true);
    }
  }, [chainId, tSenderAddress]);

  useEffect(() => {
    form.trigger("amounts");
  }, [recipients, amounts, form]);

  useEffect(() => {
    const checkAllowance = async () => {
      if (
        form.formState.errors.amounts ||
        form.formState.errors.recipients ||
        !form.getValues("tokenAddress") ||
        !isAddress(form.getValues("tokenAddress")) ||
        !account.address
      ) {
        setAllowance(null);
        setIsAllowanceLoading(false);
        return;
      }

      try {
        setIsAllowanceLoading(true);

        //to delete later
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const tokenAddress = form.getValues("tokenAddress");

        const approvedAmount = await getApprovedAmount(
          config,
          tSenderAddress as Address,
          tokenAddress as Address,
          account.address
        );
        console.log("approvedAmount", approvedAmount);
        setAllowance(approvedAmount);
      } catch (err) {
        console.log(err);
        setAllowance(null);
      } finally {
        setIsAllowanceLoading(false);
      }
    };

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(checkAllowance, 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    watchedAmounts,
    watchedRecipients,
    watchedTokenAddress,
    account.address,
    chainId,
    config,
    form,
    tSenderAddress,
  ]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
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
      const approvedAmount = await getApprovedAmount(
        config,
        tSenderAddress,
        tokenAddress,
        account.address
      );

      console.log(
        `Allowance needed: \n Current  ${approvedAmount} \n Required ${totalAmount}`
      );

      if (approvedAmount < totalAmount) {
        try {
          const approvalHash = await writeContractAsync({
            abi: erc20Abi,
            address: tokenAddress,
            functionName: "approve",
            args: [tSenderAddress, totalAmount],
          });

          console.log("Approval transaction hash:", approvalHash);

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

          console.log("Airdrop Transaction hash:", airdropTransactionHash);

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
        console.log("Enough tokens approved");

        const airdropTransactionHash = await writeContractAsync({
          abi: tsenderAbi,
          address: tSenderAddress,
          functionName: "airdropERC20",
          args: [tokenAddress, recipients, amounts, totalAmount],
        });

        console.log("Airdrop Transaction hash:", airdropTransactionHash);

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
  const shouldApprove = allowance !== null && allowance < totalAmount;

  return (
    <>
      <AlertDialog open={showNetworkError} onOpenChange={setShowNetworkError}>
        <AlertDialogContent className="border-primary">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary">
              Network error
            </AlertDialogTitle>
            <AlertDialogDescription>
              TSender contract not found for the connected network. Please
              switch network!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction onClick={() => setShowNetworkError(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                isAllowanceLoading ||
                Object.keys(form.formState.errors).length > 0
              }
              className="w-32 cursor-pointer"
            >
              {isPending || isAllowanceLoading ? (
                <LoaderCircle className="size-6 animate-[spin_2s_linear_infinite]" />
              ) : shouldApprove ? (
                "Approve Tokens"
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
