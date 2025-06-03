import type { formSchema } from "@/lib/schemas/airdrop";
import { getApprovedAmount } from "@/lib/utils/allowance";
import type { Config } from "@wagmi/core";
import { useEffect, useState } from "react";
import type { FieldErrors } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { isAddress, type Address } from "viem";
import type { z } from "zod";

export function useAllowanceDebounced({
  tSenderAddress,
  accountAddress,
  amounts,
  recipients,
  tokenAddress,
  formStateErrors,
  chainId,
  config,
  delay,
}: {
  tSenderAddress?: Address;
  accountAddress?: Address;
  amounts?: string;
  recipients?: string;
  tokenAddress?: string;
  formStateErrors: FieldErrors<z.infer<typeof formSchema>>;
  chainId: number;
  config: Config;
  delay: number;
}) {
  const [allowance, setAllowance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isReady =
    !formStateErrors.amounts &&
    !formStateErrors.recipients &&
    !formStateErrors.tokenAddress &&
    !!tokenAddress &&
    isAddress(tokenAddress) &&
    !!accountAddress &&
    isAddress(accountAddress) &&
    !!tSenderAddress &&
    isAddress(tSenderAddress) &&
    !!amounts &&
    !!recipients;

  const checkAllowance = useDebouncedCallback(async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const approvedAmount = await getApprovedAmount(
        config,
        tSenderAddress as Address,
        tokenAddress as Address,
        accountAddress as Address
      );
      setAllowance(approvedAmount);
    } catch (err) {
      setAllowance(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, delay);

  useEffect(() => {
    if (!isReady) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setAllowance(null);
    setError(null);
    checkAllowance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accountAddress,
    tSenderAddress,
    tokenAddress,
    amounts,
    recipients,
    config,
    chainId,
  ]);

  return { allowance, isLoading, error, isReady };
}
// <div className="space-y-1">
//                 <div className="flex flex-row items-center">
//                   <span className="font-medium min-w-[110px]">Token :</span>
//                   <span>{tokenData[1]?.result?.toString() ?? "N/A"}</span>
//                 </div>
//                 <div className="flex flex-row items-center">
//                   <span className="font-medium min-w-[110px]">Decimals :</span>
//                   <span>{tokenData[0]?.result?.toString() ?? "N/A"}</span>
//                 </div>
//                 <div className="flex flex-row items-center">
//                   <span className="font-medium min-w-[110px]">Balance :</span>
//                   <span>
//                     {tokenData[2]?.result
//                       ? formatEther(tokenData[2].result as bigint)
//                       : "N/A"}
//                   </span>
//                 </div>
//                 <div className="flex flex-row items-center">
//                   <span className="font-medium min-w-[110px]">
//                     Balance in wei :
//                   </span>
//                   <span>{tokenData[2]?.result?.toString() ?? "N/A"}</span>
//                 </div>
//               </div>

// <div className="mb-6 py-2 px-4 rounded-md  border border-input bg-transparent text-sm text-muted-foreground dark:bg-input/30 shadow-xs">
