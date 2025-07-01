import { AirdropButton } from "@/components/AirdropButton";
import { ApprovalButton } from "@/components/ApprovalButton";
import { NetworkErrorDialog } from "@/components/NetworkErrorDialog";
import { TokenInfos, type TokenDataItem } from "@/components/TokenInfos";
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
import { chainsToTSender, erc20Abi } from "@/constants";
import { formSchema } from "@/lib/schemas/airdrop";
import { cn } from "@/lib/utils";
import { getTokenAllowance } from "@/lib/utils/allowance";
import { getTokenBalance } from "@/lib/utils/balance";
import { parseAmounts, sumBigIntStrings } from "@/lib/utils/form-helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { isAddress, type Address } from "viem";
import { useAccount, useChainId, useConfig, useReadContracts } from "wagmi";
import { z } from "zod";

type AirdropFormProps = ComponentPropsWithoutRef<"form">;

const STORAGE_KEY = "tsender-airdrop-form";

const saved =
  typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
const parsed = saved ? JSON.parse(saved) : null;

export const AirdropForm = ({ className, ...props }: AirdropFormProps) => {
  const chainId = useChainId();
  const config = useConfig();
  const account = useAccount();
  const tSenderAddress = chainsToTSender[chainId]?.tsender as Address;
  const [allowance, setAllowance] = useState<bigint | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [showNetworkError, setShowNetworkError] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: parsed || {
      tokenAddress: "",
      recipients: "",
      amounts: "",
    },
  });

  const tokenAddress = form.watch("tokenAddress");
  const amounts = form.watch("amounts");
  const formStateErrors = form.formState.errors;

  const { data: tokenData } = useReadContracts({
    contracts:
      tokenAddress &&
      account.address &&
      isAddress(tokenAddress) &&
      isAddress(account.address) &&
      !!formStateErrors
        ? [
            {
              abi: erc20Abi,
              address: tokenAddress as Address,
              functionName: "decimals",
            },
            {
              abi: erc20Abi,
              address: tokenAddress as Address,
              functionName: "name",
            },
            {
              abi: erc20Abi,
              address: tokenAddress as Address,
              functionName: "balanceOf",
              args: [account.address],
            },
            {
              abi: erc20Abi,
              address: tokenAddress as Address,
              functionName: "allowance",
              args: [account.address, tSenderAddress],
            },
          ]
        : [],
  });

  useEffect(() => {
    if (typeof tokenData?.[2]?.result === "bigint") {
      setBalance(tokenData[2].result as bigint);
    }
    if (typeof tokenData?.[3]?.result === "bigint") {
      setAllowance(tokenData[3].result as bigint);
    }
  }, [tokenData]);

  useEffect(() => {
    if (!tSenderAddress || !isAddress(tSenderAddress)) {
      setShowNetworkError(true);
    }
  }, [chainId, tSenderAddress]);

  const hasTriggeredParsed = useRef(false);

  useEffect(() => {
    if (
      !hasTriggeredParsed.current &&
      parsed &&
      Object.values(parsed).some((v) => String(v).trim() !== "")
    ) {
      hasTriggeredParsed.current = true;
      form.trigger();
    }
  }, [form]);

  const debouncedSaveToStorage = useDebouncedCallback((values) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }, 500);

  useEffect(() => {
    const sub = form.watch((values) => {
      debouncedSaveToStorage(values);
    });
    return () => sub.unsubscribe();
  }, [form, debouncedSaveToStorage]);

  const refreshTokenState = async () => {
    if (!tokenAddress || !account.address || !tSenderAddress) return;
    try {
      const [newAllowance, newBalance] = await Promise.all([
        getTokenAllowance(
          config,
          tokenAddress as Address,
          account.address,
          tSenderAddress
        ),
        getTokenBalance(config, tokenAddress as Address, account.address),
      ]);

      setAllowance(newAllowance);
      setBalance(newBalance);
    } catch (err) {
      console.error(err);

      toast(
        <span className="text-destructive text-base font-bold">
          Error Fetching Token Data
        </span>,
        {
          description: (
            <pre className="break-all whitespace-pre-wrap text-muted-foreground">
              {err instanceof Error ? err.message : String(err)}
            </pre>
          ),
        }
      );
    }
  };

  const displayAllowance =
    allowance ??
    (typeof tokenData?.[3]?.result === "bigint"
      ? (tokenData[3].result as bigint)
      : null);
  const displayBalance =
    balance ??
    (typeof tokenData?.[2]?.result === "bigint"
      ? (tokenData[2].result as bigint)
      : null);

  const enhancedTokenData = tokenData
    ? ([...tokenData] as TokenDataItem[])
    : undefined;
  if (enhancedTokenData && displayAllowance !== null) {
    enhancedTokenData[3] = {
      ...enhancedTokenData[3],
      result: displayAllowance,
    };
  }
  if (enhancedTokenData && displayBalance !== null) {
    enhancedTokenData[2] = { ...enhancedTokenData[2], result: displayBalance };
  }

  const totalAmount = sumBigIntStrings(parseAmounts(form.getValues("amounts")));

  const isFormIncomplete =
    !form.getValues("tokenAddress") ||
    !form.getValues("recipients") ||
    !form.getValues("amounts");
  const isFormInvalid = Object.keys(form.formState.errors).length > 0;
  const shouldDisableButton = isFormIncomplete || isFormInvalid;
  console.log("shouldDisabled Buton", shouldDisableButton);
  console.log("displayAllowance", displayAllowance);
  console.log("displaybalance", displayBalance);

  return (
    <>
      <NetworkErrorDialog
        open={showNetworkError}
        onOpenChange={setShowNetworkError}
      />

      <Form {...form}>
        <form
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
                    onChange={(e) => {
                      field.onChange(e);
                      if (form.getValues("amounts")) {
                        form.trigger(["recipients", "amounts"]);
                      }
                    }}
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
                    onChange={(e) => {
                      field.onChange(e);
                      if (form.getValues("recipients")) {
                        form.trigger(["recipients", "amounts"]);
                      }
                    }}
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

          {tokenAddress && account.address && (
            <TokenInfos
              tokenData={enhancedTokenData}
              amounts={amounts}
              formStateErrors={formStateErrors}
              chainId={chainId}
              tokenAddress={tokenAddress as Address}
            />
          )}

          <div className="flex justify-center">
            {account.isConnected && (
              <>
                {displayAllowance !== null &&
                displayAllowance < BigInt(totalAmount) ? (
                  <ApprovalButton
                    config={config}
                    accountAddress={account.address}
                    tSenderAddress={tSenderAddress}
                    formData={form.getValues()}
                    setShowNetworkError={setShowNetworkError}
                    disabled={shouldDisableButton}
                    onAfterAction={refreshTokenState}
                  />
                ) : (
                  <AirdropButton
                    config={config}
                    accountAddress={account.address}
                    tSenderAddress={tSenderAddress}
                    formData={form.getValues()}
                    setShowNetworkError={setShowNetworkError}
                    disabled={shouldDisableButton}
                    onAfterAction={refreshTokenState}
                  />
                )}
              </>
            )}
          </div>
        </form>
      </Form>
    </>
  );
};
