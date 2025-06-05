import { parseAmounts, sumBigIntStrings } from "@/lib/utils/form-helpers";
import { useEffect, type ComponentPropsWithoutRef } from "react";
import type { FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import { formatEther, type Address } from "viem";

export type TokenDataItem = {
  status?: string;
  error?: { cause?: { details?: string } };
  result?: string | bigint;
};

type TokenInfosProps = ComponentPropsWithoutRef<"div"> & {
  tokenData: TokenDataItem[] | undefined;
  allowance: bigint | null;
  amounts: string;
  formStateErrors: FieldErrors<{
    amounts: string;
    tokenAddress: string;
    recipients: string;
  }>;
  chainId: number;
  tokenAddress: Address;
};

const renderField = (
  label: string,
  value: string | number | bigint | null | undefined,
  errorObj?: TokenDataItem | null | undefined,
  formatter?: (v: string | number | bigint) => string
) => (
  <div className="flex flex-row items-center flex-wrap">
    <span className="font-medium min-w-[130px]">{label}:</span>
    {errorObj?.status === "failure" ? (
      <span className="text-destructive">
        {errorObj?.error?.cause?.details || "N/A"}
      </span>
    ) : value !== null && value !== undefined ? (
      formatter ? (
        formatter(value)
      ) : (
        value
      )
    ) : (
      "N/A"
    )}
  </div>
);

export const TokenInfos = ({
  tokenData,
  amounts,
  formStateErrors,
  allowance,
  chainId,
  tokenAddress,
}: TokenInfosProps) => {
  const tokenName = (tokenData?.[1]?.result as string | null) ?? null;
  const tokenDecimals = tokenData?.[0]?.result?.toString() ?? null;
  const tokenBalance = tokenData?.[2]?.result?.toString() ?? null;

  const renderTotalAmount = () => (
    <>
      <div className="flex flex-row items-center flex-wrap">
        <span className="font-medium min-w-[130px]">Total amount:</span>
        <span className="break-all">
          {formatEther(sumBigIntStrings(parseAmounts(amounts)))}
        </span>
      </div>
      <div className="flex flex-row items-center flex-wrap">
        <span className="font-medium min-w-[130px]">Total (wei):</span>
        <span className="break-all">
          {sumBigIntStrings(parseAmounts(amounts)).toString()}
        </span>
      </div>
    </>
  );

  const isReady =
    Array.isArray(tokenData) &&
    tokenData.length === 4 &&
    tokenData.every((d) => d && typeof d.status === "string");

  const allFailed =
    isReady && [0, 1, 2, 3].every((i) => tokenData[i]?.status === "failure");

  useEffect(() => {
    if (allFailed) {
      toast(
        <span className="text-destructive text-base font-bold">Error</span>,
        {
          description: (
            <pre className="break-all whitespace-pre-wrap text-muted-foreground">
              The token may not exist on this network!
            </pre>
          ),
          id: `token-error-${tokenAddress}`,
        }
      );
    }
  }, [allFailed, tokenAddress]);

  if (!tokenData) {
    return !formStateErrors.amounts && amounts?.trim() ? (
      <div className="mb-6 py-2 px-4 rounded-md border border-input bg-transparent text-sm text-muted-foreground dark:bg-input/30 shadow-xs">
        <div className="space-y-1">{renderTotalAmount()}</div>
      </div>
    ) : null;
  }

  return (
    <div className="mb-6 py-2 px-4 rounded-md border border-input bg-transparent text-sm text-muted-foreground dark:bg-input/30 shadow-xs">
      <div className="space-y-1">
        {allFailed && (
          <p className="text-destructive mb-2">
            Error fetching token data on network chain Id {chainId}!
          </p>
        )}
        {/* Token Name */}
        {renderField("Token", tokenName, tokenData?.[1])}
        {/* Decimals */}
        {renderField("Decimals", tokenDecimals, tokenData?.[0])}
        {/* Balance */}
        {renderField("Balance", tokenBalance, tokenData?.[2], (v) =>
          formatEther(BigInt(v))
        )}
        {/* Balance (wei) */}
        {renderField("Balance (wei)", tokenBalance, tokenData?.[2], (v) =>
          v.toString()
        )}
        {/* Allowance */}
        {renderField("Allowance", allowance, tokenData?.[3], (v) =>
          formatEther(BigInt(v))
        )}
        {/* Allowance (wei) */}
        {renderField("Allowance (wei)", allowance, tokenData?.[3], (v) =>
          v.toString()
        )}
        {/* Total */}
        {!formStateErrors.amounts && amounts?.trim() && renderTotalAmount()}
      </div>
    </div>
  );
};
