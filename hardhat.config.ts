import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-viem";
import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

const config: HardhatUserConfig = {
  solidity: "0.8.28",
};

export default config;
