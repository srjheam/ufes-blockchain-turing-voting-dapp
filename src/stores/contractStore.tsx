import { Candidate } from "@/types/Candidate";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ContractState {
  address?: `0x${string}`;
  currentClientCodename: string | null;
  status: "ready" | "loading" | "error";
  candidates: Candidate[] | null;
}

const useContractStore = create<ContractState>()(
  persist(
    (set) => ({
      address:
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.toLowerCase() as `0x${string}`,
      currentClientCodename: null,
      status: "loading",
      candidates: null,
    }),
    {
      name: "contract-store",
    }
  )
);

export default useContractStore;
