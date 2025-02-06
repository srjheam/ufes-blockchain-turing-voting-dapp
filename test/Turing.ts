import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { parseEther, zeroAddress, } from "viem";
import ERC20ABI from "@openzeppelin/contracts/build/contracts/ERC20.json"  with { type: "json" };

describe("Turing", function () {
  async function deployTuringFixture() {
    const [owner, professor, candidate1, candidate2] = await hre.viem.getWalletClients();

    const candidates = [
      {
        client: candidate1,
        address: candidate1.account.address,
        codename: "candidate1",
      },
      {
        client: candidate2,
        address: candidate2.account.address,
        codename: "candidate2",
      },
    ].sort((a, b) =>
      a.address.toLowerCase().localeCompare(b.address.toLowerCase())
    );

    const turing = await hre.viem.deployContract("Turing", [
      professor.account.address,
      candidates.map(({ address }) => address),
      candidates.map(({ codename }) => codename),
    ]);

    console.log("===================================");
    console.log("Turing deployed to:", turing.address);
    console.log("Owner:", owner.account.address);
    console.log("Professor:", professor.account.address);
    console.log("Candidates:", candidates.map(({ address, codename }) => `${codename} (${address})`).join(", "));
    console.log("===================================");

    return { turing, owner, professor, candidates };
  }

  describe("Deployment", function () {
    it("Should set the right professor", async function () {
      const { turing, professor } = await loadFixture(deployTuringFixture);

      const actualProfessor = await turing.read.professor();
      
      expect(actualProfessor.toLowerCase()).to.equal(professor.account.address.toLowerCase());
    });

    it("Should initialize voting as open", async function () {
      const { turing } = await loadFixture(deployTuringFixture);
      expect(await turing.read.votingOpen()).to.be.true;
    });

    it("Should reject empty candidates list", async function () {
      const walletClients = await hre.viem.getWalletClients();
      const [professor] = walletClients;

      await expect(
        hre.viem.deployContract("Turing", [
          professor.account.address, 
          [], 
          []
        ]) // @ts-ignore
      ).to.be.rejectedWith("Candidates list cannot be empty");
    });

    it("Should reject mismatched addresses and codenames length", async function () {
      const walletClients = await hre.viem.getWalletClients();
      const [professor, candidate1] = walletClients;

      await expect(
        hre.viem.deployContract("Turing", [
          professor.account.address,
          [candidate1.account.address],
          ["candidate1", "candidate2"],
        ]) // @ts-ignore
      ).to.be.rejectedWith("Candidates input length mismatch");
    });

    it("Should reject duplicate codenames", async function () {
      const walletClients = await hre.viem.getWalletClients();
      const [professor, candidate1, candidate2] = walletClients;

      await expect(
        hre.viem.deployContract("Turing", [
          professor.account.address,
          [candidate1.account.address, candidate2.account.address],
          ["same_codename", "same_codename"],
        ]) // @ts-ignore
      ).to.be.rejectedWith("Duplicate codename");
    });
  });

  describe("Token Issuance", function () {
    it("Should allow owner to issue tokens", async function () {
      const { turing, owner, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await turing.write.issueToken([candidates[0].codename, amount], { account: owner.account });
      expect(await turing.read.balanceOf([candidates[0].address])).to.equal(amount);
    });

    it("Should allow professor to issue tokens", async function () {
      const { turing, professor, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await turing.write.issueToken([candidates[0].codename, amount], { account: professor.account });
      expect(await turing.read.balanceOf([candidates[0].address])).to.equal(amount);
    });

    it("Should reject non-owner/non-professor issuance", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await expect(
        turing.write.issueToken([candidates[1].codename, amount], { account: candidates[0].client.account }) // @ts-ignore
      ).to.be.rejectedWith("Only the contract owner or the professor can issue tokens");
    });

    it("Should reject token issuance with invalid codename", async function () {
      const { turing, owner } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await expect(
        turing.write.issueToken(["invalid_codename", amount], { account: owner.account }) // @ts-ignore
      ).to.be.rejectedWith("Codename not registered");
    });

    it("Should correctly accumulate multiple token issuances", async function () {
      const { turing, owner, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await turing.write.issueToken([candidates[0].codename, amount], { account: owner.account });
      await turing.write.issueToken([candidates[0].codename, amount], { account: owner.account });

      expect(await turing.read.balanceOf([candidates[0].address])).to.equal(parseEther("2"));
    });

    it("Should emit Transfer event on token issuance", async function () {
      const { turing, owner, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await turing.write.issueToken([candidates[0].codename, amount], { 
        account: owner.account 
      });

      const publicClient = await hre.viem.getPublicClient();
      const events: any[] = await publicClient.getContractEvents({
          abi: ERC20ABI.abi,
          eventName: 'Transfer',
          strict: true,
      }); // fuck viem and its shitty api

      expect(events).to.have.lengthOf(1);

      // Issue token transfer event
      expect(events[0].args.from).to.equal(zeroAddress);
      expect(events[0].args.to.toLowerCase()).to.equal(candidates[0].address.toLowerCase());
      expect(events[0].args.value).to.equal(amount);
    });
  });

  describe("Voting", function () {
    it("Should allow voting with valid amount", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await turing.write.vote([candidates[1].codename, amount], { account: candidates[0].client.account });
      expect(await turing.read.balanceOf([candidates[1].address])).to.equal(amount);
      expect(await turing.read.balanceOf([candidates[0].address])).to.equal(parseEther("0.2"));
    });

    it("Should reject voting amount over 2 TTK", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("3");

      await expect(
        turing.write.vote([candidates[1].codename, amount], { account: candidates[0].client.account }) // @ts-ignore
      ).to.be.rejectedWith("Cannot vote more than 2 TTK");
    });

    it("Should prevent voting for self", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await expect(
        turing.write.vote([candidates[0].codename, amount], { account: candidates[0].client.account }) // @ts-ignore
      ).to.be.rejectedWith("Cannot vote for yourself");
    });

    it("Should prevent double voting", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await turing.write.vote([candidates[1].codename, amount], { account: candidates[0].client.account });
      await expect(
        turing.write.vote([candidates[1].codename, amount], { account: candidates[0].client.account }) // @ts-ignore
      ).to.be.rejectedWith("Already voted for this candidate");
    });

    it("Should verify voter receives exactly 0.2 TTK reward", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await turing.write.vote([candidates[1].codename, amount], { account: candidates[0].client.account });
      expect(await turing.read.balanceOf([candidates[0].address])).to.equal(parseEther("0.2"));
    });

    it("Should reject voting with invalid codename", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await expect(
        turing.write.vote(["invalid_codename", amount], { account: candidates[0].client.account }) // @ts-ignore
      ).to.be.rejectedWith("Codename not registered");
    });

    it("Should reject voting from non-candidate address", async function () {
      const walletClients = await hre.viem.getWalletClients();
      const [nonCandidate] = walletClients;
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await expect(
        turing.write.vote([candidates[0].codename, amount], { account: nonCandidate.account }) // @ts-ignore
      ).to.be.rejectedWith("Voter not found");
    });

    it("Should emit Transfer events for both vote and reward", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");
      const reward = parseEther("0.2");
      
      await turing.write.vote([candidates[1].codename, amount], { 
        account: candidates[0].client.account 
      });

      const publicClient = await hre.viem.getPublicClient();
      const events: any[] = await publicClient.getContractEvents({
          abi: ERC20ABI.abi,
          eventName: 'Transfer',
          strict: true,
      }); // fuck viem and its shitty api

      expect(events).to.have.lengthOf(2);

      // Vote transfer event
      expect(events[0].args.from).to.equal(zeroAddress);
      expect(events[0].args.to.toLowerCase()).to.equal(candidates[1].address.toLowerCase());
      expect(events[0].args.value).to.equal(amount);

      // Reward transfer event
      expect(events[1].args.from).to.equal(zeroAddress);
      expect(events[1].args.to.toLowerCase()).to.equal(candidates[0].address.toLowerCase());
      expect(events[1].args.value).to.equal(reward);
    });
  });

  describe("Voting Control", function () {
    it("Should allow owner to stop voting", async function () {
      const { turing, owner, candidates } = await loadFixture(deployTuringFixture);

      await turing.write.votingOff({ account: owner.account });
      expect(await turing.read.votingOpen()).to.be.false;

      await expect(
        turing.write.vote([candidates[1].codename, parseEther("1")], { account: candidates[0].client.account }) // @ts-ignore
      ).to.be.rejectedWith("Voting is closed");
    });

    it("Should allow professor to control voting", async function () {
      const { turing, professor } = await loadFixture(deployTuringFixture);

      await turing.write.votingOff({ account: professor.account });
      expect(await turing.read.votingOpen()).to.be.false;

      await turing.write.votingOn({ account: professor.account });
      expect(await turing.read.votingOpen()).to.be.true;
    });

    it("Should reject non-owner/non-professor voting control", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);

      await expect(
        turing.write.votingOff({ account: candidates[0].client.account }) // @ts-ignore
      ).to.be.rejectedWith("Only the contract owner or the professor can close voting");

      await expect(
        turing.write.votingOn({ account: candidates[0].client.account }) // @ts-ignore
      ).to.be.rejectedWith("Only the contract owner or the professor can open voting");
    });

    it("Should reject voting when voting is closed", async function () {
      const { turing, owner, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await turing.write.votingOff({ account: owner.account });
      await expect(
        turing.write.vote([candidates[1].codename, amount], { account: candidates[0].client.account }) // @ts-ignore
      ).to.be.rejectedWith("Voting is closed");
    });

    it("Should allow voting after reopening", async function () {
      const { turing, owner, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await turing.write.votingOff({ account: owner.account });
      await turing.write.votingOn({ account: owner.account });
      
      await expect(
        turing.write.vote([candidates[1].codename, amount], { account: candidates[0].client.account }) // @ts-ignore
      ).not.to.be.rejected;
    });
  });

  describe("Get Candidates", function () {
    it("Should return all candidates", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);

      const cands = await turing.read.getCandidates();
      expect(cands[0]).to.have.lengthOf(candidates.length);
      candidates.forEach((candidate, i) => {
        expect(cands[0][i]).to.equal(candidate.codename);
      });
    });
  });
});
