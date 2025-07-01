import { Button } from "@/components/ui/button";
import { erc20Abi } from "@/constants";
import { formSchema, submitSchema } from "@/lib/schemas/airdrop";
import { getTokenBalance } from "@/lib/utils/balance";
import { sumBigIntStrings } from "@/lib/utils/form-helpers";
import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";
import { toast } from "sonner";
import { isAddress, type Address } from "viem";
import {
  useWaitForTransactionReceipt,
  useWriteContract,
  type Config,
} from "wagmi";
import type { z } from "zod";

type ApprovalButtonProps = ComponentPropsWithoutRef<"button"> & {
  config: Config;
  accountAddress?: Address;
  tSenderAddress: Address;
  formData: z.infer<typeof formSchema>;
  setShowNetworkError: (show: boolean) => void;
  disabled?: boolean;
  onAfterAction?: () => void;
};

export const ApprovalButton = ({
  config,
  accountAddress,
  tSenderAddress,
  formData,
  setShowNetworkError,
  disabled,
  onAfterAction,
}: ApprovalButtonProps) => {
  const onAfterActionRef = useRef(onAfterAction);
  onAfterActionRef.current = onAfterAction;

  const hasShownToastRef = useRef({
    sent: false,
    success: false,
    error: false,
  });

  const {
    data: hash,
    isPending,
    isSuccess: isTransactionSent,
    writeContractAsync,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isErrorConfirming,
    error: errorConfirming,
  } = useWaitForTransactionReceipt({
    confirmations: 1,
    hash,
  });

  useEffect(() => {
    if (hash) {
      hasShownToastRef.current = {
        sent: false,
        success: false,
        error: false,
      };
    }
  }, [hash]);

  useEffect(() => {
    if (hash && isTransactionSent && !hasShownToastRef.current.sent) {
      hasShownToastRef.current.sent = true;
      toast(
        <span className="text-base">Approval transaction sent with hash:</span>,
        {
          description: (
            <pre className="break-all whitespace-pre-wrap text-muted-foreground">
              {hash}
            </pre>
          ),
        }
      );
    }

    if (isConfirmed && !hasShownToastRef.current.success) {
      hasShownToastRef.current.success = true;
      toast.success(<span className="text-base">Approval successful</span>, {
        description: (
          <pre className="break-all whitespace-pre-wrap text-muted-foreground">
            <p>Transaction hash:</p>
            <p>{hash}</p>
          </pre>
        ),
      });
      onAfterActionRef.current?.();
    }

    if (
      isErrorConfirming &&
      errorConfirming &&
      !hasShownToastRef.current.error
    ) {
      hasShownToastRef.current.error = true;
      toast(
        <span className="text-destructive text-base font-bold">
          Transaction failed
        </span>,
        {
          description: (
            <pre className="break-all whitespace-pre-wrap text-muted-foreground">
              {errorConfirming.message}
            </pre>
          ),
        }
      );
    }
  }, [
    hash,
    isConfirmed,
    isTransactionSent,
    isErrorConfirming,
    errorConfirming,
  ]);

  const handleApprove = async (data: z.infer<typeof formSchema>) => {
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

    if (!accountAddress) {
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

    if (!tSenderAddress || !isAddress(tSenderAddress)) {
      setShowNetworkError(true);
      return;
    }

    const { tokenAddress, amounts } = result.data;
    const totalAmount = sumBigIntStrings(amounts);

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

    try {
      const balance = await getTokenBalance(
        config,
        tokenAddress,
        accountAddress
      );

      if (balance < totalAmount) {
        toast(
          <span className="text-destructive text-base font-bold">Error</span>,
          {
            description: (
              <pre className="break-all whitespace-pre-wrap text-muted-foreground">
                <p>Insufficient token balance!</p>
                <p>You need {totalAmount} tokens (wei)!</p>
              </pre>
            ),
          }
        );
        return;
      }

      await writeContractAsync({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: "approve",
        args: [tSenderAddress, totalAmount],
      });
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
  };

  return (
    <Button
      type="button"
      onClick={() => handleApprove(formData)}
      disabled={isPending || disabled || isConfirming}
      className="w-58 cursor-pointer"
    >
      {isPending || isConfirming ? (
        <LoaderCircle className="size-6 animate-[spin_2s_linear_infinite]" />
      ) : (
        "Approve Tokens"
      )}
    </Button>
  );
};
