import type { formSchema } from "@/lib/schemas/airdrop";
import { getTokenAllowance } from "@/lib/utils/allowance";
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
      const approvedAmount = await getTokenAllowance(
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
