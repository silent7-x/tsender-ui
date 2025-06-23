import { readContract } from "@wagmi/core";
import { erc20Abi, type Address } from "viem";
import type { Config } from "wagmi";

export async function getTokenAllowance(
  config: Config,
  erc20TokenAddress: Address,
  ownerAddress: Address,
  spenderAddress: Address
): Promise<bigint> {
  try {
    const allowance = await readContract(config, {
      abi: erc20Abi,
      address: erc20TokenAddress,
      functionName: "allowance",
      args: [ownerAddress, spenderAddress],
    });
    return allowance as bigint;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}
