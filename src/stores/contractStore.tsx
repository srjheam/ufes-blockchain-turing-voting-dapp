import { Candidate } from "@/types/Candidate";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ContractStore = {
  address?: `0x${string}`;
  currentClientCodename: string | null;
  status: "ready" | "loading" | "error";
  candidates: Candidate[] | null;
}

const useContractStore = create<ContractStore>()(
  persist(
    () => {
      const initialState: ContractStore = {
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ? 
          (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS.toLowerCase() as `0x${string}`) : 
          undefined,
        currentClientCodename: null,
        status: "loading",
        candidates: null,
      };
      return initialState;
    },
    {
      name: "contract-store",
    }
  )
);

export default useContractStore;
