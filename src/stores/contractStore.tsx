import { Candidate } from "@/types/Candidate";
import { create } from "zustand";

interface ContractState {
  address?: `0x${string}`;
  currentClientCodename: string | null;
  status: "ready" | "loading" | "error";
  candidates: Candidate[] | null;
}

const useContractStore = create<ContractState>()(() => ({
  address:
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.toLowerCase() as `0x${string}`,
  currentClientCodename: null,
  status: "loading",
  candidates: null,
}));

export default useContractStore;
