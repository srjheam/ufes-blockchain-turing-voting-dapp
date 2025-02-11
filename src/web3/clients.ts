import { createPublicClient, createWalletClient, custom, http } from "viem";
import { sepolia, hardhat } from "viem/chains";

export const publicClient = createPublicClient({
  chain: process.env.NODE_ENV === "development" ? hardhat : sepolia,
  transport: http(),
});

// eg: Metamask
export const walletClient = createWalletClient({
  chain: process.env.NODE_ENV === "development" ? hardhat : sepolia,
  // @ts-expect-error - window will be defined thanks to import
  transport: custom(window.ethereum!),
});
