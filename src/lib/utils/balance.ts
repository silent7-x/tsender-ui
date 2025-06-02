import { readContract } from "@wagmi/core";
import { erc20Abi, type Address } from "viem";
import type { Config } from "wagmi";

export async function getTokenBalance(
  config: Config,
  tokenAddress: Address,
  accountAddress: Address
): Promise<bigint> {
  try {
    const balance = await readContract(config, {
      abi: erc20Abi,
      address: tokenAddress,
      functionName: "balanceOf",
      args: [accountAddress],
    });
    return balance as bigint;
  } catch {
    return 0n;
  }
}
