"use client";

import turingAbi from "@/web3/abi";
import useContractStore from "@/stores/contractStore";
import React, { useEffect } from "react";
import CandidateCard from "@/app/candidate-card";
import { Candidate } from "@/types/Candidate";
import { getContract as getContractViem } from "viem";

const getContract = async (contractAddress: `0x${string}`) => {
  // @ts-expect-error - window will be available at runtime thanks to import
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  if (
    !contractAddress ||
    contractAddress === "0x0000000000000000000000000000000000000000"
  ) {
    throw new Error("Contract address is not defined");
  }

  const { publicClient } = await import("@/web3/clients");

  const contract = getContractViem({
    address: contractAddress,
    abi: turingAbi,
    client: publicClient,
  });

  console.log("contract", contract);

  return contract;
};

const fetchCandidates = async (contractAddress: `0x${string}`) => {
  const contract = await getContract(contractAddress);

  console.log("fetching candidates");

  const candidates: Candidate[] = await contract.read
    .getCandidates()
    .then((result) =>
      result[0].map((candidate, index) => ({
        codename: candidate,
        saTuringAmmount: Number(result[1][index]),
      }))
    );

  console.table(candidates);

  return candidates;
};

const CandidateList: React.FC = () => {
  const contractInfo = useContractStore();

  const setContract = async () => {
    useContractStore.setState({ status: "loading" });

    console.log("setting contract");

    if (!contractInfo.address) {
      useContractStore.setState({ status: "error" });
      return;
    }

    await fetchCandidates(contractInfo.address)
      .then((candidates) => useContractStore.setState({ candidates }))
      .then(() => useContractStore.setState({ status: "ready" }))
      .catch(() => useContractStore.setState({ status: "error" }));
  };

  useEffect(() => {
    setContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractInfo.address]); // re-fetch candidates when contract address changes

  useEffect(() => {
    if (!contractInfo.address || contractInfo.status != "ready") return;
    const watchEvent = async () => {
      const { publicClient } = await import("@/web3/clients");

      const unwatch = publicClient.watchEvent({
        address: contractInfo.address,
        event: turingAbi
          .filter((item) => item.type === "event")
          .find((item) => item.name === "Transfer"),
        onLogs: () => setContract(),
      });

      return unwatch;
    };

    const unwatch = watchEvent();

    return () => {
      unwatch.then((unwatch) => unwatch());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractInfo.address]);

  return (
    <main>
      {contractInfo.status === "loading" && (
        <p>Loading... {contractInfo.address}</p>
      )}
      {contractInfo.status === "error" && (
        <p>Error loading contract {contractInfo.address}</p>
      )}
      {contractInfo.status === "ready" && (
        <ul className="grid grid-cols-1 gap-4">
          {(contractInfo.candidates ?? [])
            .filter((candidate) =>
              contractInfo.currentClientCodename
                ? candidate.codename !== contractInfo.currentClientCodename
                : true
            )
            .sort((a, b) => {
              if (a.saTuringAmmount === b.saTuringAmmount) {
                return a.codename.localeCompare(b.codename);
              } else {
                return Number(b.saTuringAmmount) - Number(a.saTuringAmmount);
              }
            })
            .map((candidate) => (
              <li key={candidate.codename}>
                <CandidateCard candidate={candidate} />
              </li>
            ))}
        </ul>
      )}
    </main>
  );
};

export default CandidateList;
