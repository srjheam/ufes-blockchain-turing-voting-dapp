"use client";
import React, { useState } from "react";
import useContractStore from "@/stores/contractStore";
import { getContract, parseEther } from "viem";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Candidate } from "@/types/Candidate";
import turingAbi from "@/web3/abi";
import { useToast } from "@/hooks/use-toast";

interface CandidateCardProps {
  candidate: Candidate;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saTuringAmount, setSaTuringAmount] = useState("");
  const { toast } = useToast();

  const contractInfo = useContractStore();

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractInfo.address) return;
    try {
      const { walletClient } = await import("@/web3/clients");

      const contract = getContract({
        address: contractInfo.address,
        abi: turingAbi,
        client: walletClient,
      });
      const account = await walletClient.requestAddresses();

      console.log("account", account[0], "voting for", candidate.codename);

      // Call the vote function on the contract with candidate codename and the amount.
      await contract.write.vote(
        [candidate.codename, parseEther(`${saTuringAmount}`)],
        {
          account: account[0],
        }
      );
      
      toast({
        title: "Sucess",
        description: "Vote submitted successfully",
      });

      setDrawerOpen(false);

      //await new Promise((resolve) => setTimeout(resolve, 5000));
      //window.location.reload();

    } catch {
      toast({
        title: "Uh oh! Something went wrong",
        description: "You cannot vote for this candidate",
        variant: "destructive",
      });
    } finally {
      setDrawerOpen(false);
    }
  };

  return (
    <div>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <div className="w-full justify-start border border-gray-200 rounded-lg p-4 flex items-center space-x-4">
            <h3 className="text-lg font-semibold">{candidate.codename}</h3>
            <p className="text-sm">
              {candidate.saTuringAmmount * 10 ** -18} votes
            </p>
          </div>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Vote for {candidate.codename}</DrawerTitle>
            <DrawerDescription>
              Enter the number of tokens you want to vote with.
            </DrawerDescription>
            <DrawerClose />
          </DrawerHeader>
          <form onSubmit={handleVoteSubmit} className="space-y-4 p-4">
            <div className="flex flex-col">
              <label htmlFor="voteAmount" className="mb-1 text-sm font-medium">
                Vote Amount
              </label>
              <Input
                id="voteAmount"
                type="number"
                step="any"
                value={saTuringAmount}
                onChange={(e) => setSaTuringAmount(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="submit">Submit Vote</Button>
              <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default CandidateCard;
