// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TuringModule = buildModule("TuringModule", (m) => {
  const professor = process.env.TURING_PROFESSOR_ADDRESS;
  if (!professor) throw new Error("Professor address not set in environment");

  const candidatesStr = process.env.TURING_CANDIDATES;
  if (!candidatesStr) throw new Error("Candidates not set in environment");

  // Split into lines and parse each line as "codename address"
  const candidates = candidatesStr.split("\n").map(line => {
    const [codename, address] = line.split(" ");
    return {
      address,
      codename
    };
  });

  // Sort candidates by address
  const sortedCandidates = candidates.sort((a, b) => 
    a.address.toLowerCase().localeCompare(b.address.toLowerCase())
  );
  
  const candidateAddresses = sortedCandidates.map(c => c.address);
  const candidateCodenames = sortedCandidates.map(c => c.codename);

  console.log("Deploying Turing contract with candidates:");
  console.table(sortedCandidates);
  console.log("Professor:", professor);

  const turing = m.contract("Turing", [
    professor,
    candidateAddresses,
    candidateCodenames
  ]);

  return { turing };
});

export default TuringModule;
