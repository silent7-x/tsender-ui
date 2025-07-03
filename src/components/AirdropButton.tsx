import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { tsenderAbi } from "@/constants";
import { formSchema, submitSchema } from "@/lib/schemas/airdrop";
import { getTokenBalance } from "@/lib/utils/balance";
import { sumBigIntStrings } from "@/lib/utils/form-helpers";
import { LoaderCircle } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { toast } from "sonner";
import { isAddress, type Address } from "viem";
import {
  useWaitForTransactionReceipt,
  useWriteContract,
  type Config,
} from "wagmi";
import type { z } from "zod";

type AirdropButtonProps = ComponentPropsWithoutRef<"button"> & {
  config: Config;
  accountAddress?: Address;
  tSenderAddress: Address;
  formData: z.infer<typeof formSchema>;
  setShowNetworkError: (show: boolean) => void;
  disabled?: boolean;
  onAfterAction?: () => void;
};

export const AirdropButton = ({
  config,
  accountAddress,
  tSenderAddress,
  formData,
  setShowNetworkError,
  disabled,
  onAfterAction,
}: AirdropButtonProps) => {
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

  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);

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
        <span className="text-base">Airdrop transaction sent with hash:</span>,
        {
          description: (
            <pre className="break-all whitespace-pre-wrap text-muted-foreground">
              <p>{hash}</p>
            </pre>
          ),
        }
      );
    }

    if (isConfirmed && !hasShownToastRef.current.success) {
      hasShownToastRef.current.success = true;
      toast.success(<span className="text-base">Airdrop successful</span>, {
        description: (
          <pre className="break-all whitespace-pre-wrap text-muted-foreground">
            <p>Transaction hash:</p>
            <p>{hash}</p>
          </pre>
        ),
      });
      setShowSuccessAlert(true);
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

  const handleAirdrop = async (data: z.infer<typeof formSchema>) => {
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

    const { tokenAddress, recipients, amounts } = result.data;
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
        abi: tsenderAbi,
        address: tSenderAddress,
        functionName: "airdropERC20",
        args: [tokenAddress, recipients, amounts, totalAmount],
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
    <>
      <Button
        type="button"
        onClick={() => handleAirdrop(formData)}
        disabled={isPending || isConfirming || disabled}
        className="w-58 cursor-pointer"
      >
        {isPending || isConfirming ? (
          <LoaderCircle className="size-6 animate-[spin_2s_linear_infinite]" />
        ) : (
          "Send Airdrop"
        )}
      </Button>
      <AlertDialog open={showSuccessAlert} onOpenChange={setShowSuccessAlert}>
        <AlertDialogContent
          className="bg-green-950 border-green-700 shadow-2xl rounded-2xl text-center animate-in animate-fade-in animate-duration-300"
          style={{ borderWidth: 2 }}
        >
          <AlertDialogHeader>
            <div className="flex flex-col items-center gap-2">
              <span className="text-green-400">
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="12" fill="#22c55e" opacity="0.2" />
                  <path
                    d="M7 13l3 3 7-7"
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <AlertDialogTitle className="text-green-400 text-2xl font-bold">
                Airdrop sent successfully!
              </AlertDialogTitle>
            </div>
          </AlertDialogHeader>
          <div className="text-base text-green-100 mt-2">
            <p>Your airdrop transaction has been confirmed on-chain.</p>
            {hash && (
              <>
                <p className="mt-2 font-mono break-all text-green-300">Hash:</p>
                <p className="font-mono break-all text-green-300">{hash}</p>
              </>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setShowSuccessAlert(false)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
              autoFocus
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
