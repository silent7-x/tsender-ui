import { readContract } from "@wagmi/core";
import { erc20Abi, type Address } from "viem";
import type { Config } from "wagmi";

export async function getApprovedAmount(
  config: Config,
  spenderAddress: Address,
  erc20TokenAddress: Address,
  ownerAddress: Address
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
