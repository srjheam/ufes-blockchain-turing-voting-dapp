import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { parseEther, zeroAddress } from "viem";

describe("Turing", function () {
  async function deployTuringFixture() {
    const [owner, professor, candidate1, candidate2] =
      await hre.ethers.getSigners();

    const candidates = [
      {
        signer: candidate1,
        codename: "candidate1",
      },
      {
        signer: candidate2,
        codename: "candidate2",
      },
    ].sort((a, b) =>
      a.signer.address
        .toLowerCase()
        .localeCompare(b.signer.address.toLowerCase())
    );

    const Turing = await hre.ethers.getContractFactory("Turing");
    const turing = await Turing.deploy(
      professor.address,
      candidates.map(({ signer }) => signer.address),
      candidates.map(({ codename }) => codename)
    );

    return { turing, owner, professor, candidates };
  }

  describe("Deployment", function () {
    it("Should set the right professor", async function () {
      const { turing, professor } = await loadFixture(deployTuringFixture);
      expect(await turing.professor()).to.equal(professor.address);
    });

    it("Should initialize voting as open", async function () {
      const { turing } = await loadFixture(deployTuringFixture);
      expect(await turing.votingOpen()).to.be.true;
    });

    it("Should reject empty candidates list", async function () {
      const [ professor ] = await hre.ethers.getSigners();

      const Turing = await hre.ethers.getContractFactory("Turing");
      await expect(
        Turing.deploy(professor.address, [], [])
      ).to.be.revertedWith("Candidates list cannot be empty");
    });

    it("Should reject mismatched addresses and codenames length", async function () {
      const [ professor, candidate1 ] = await hre.ethers.getSigners();
      
      const Turing = await hre.ethers.getContractFactory("Turing");
      await expect(
        Turing.deploy(
          professor.address,
          [candidate1.address],
          ["candidate1", "candidate2"]
        )
      ).to.be.revertedWith("Candidates input length mismatch");
    });

    it("Should reject duplicate codenames", async function () {
      const [ professor, candidate1, candidate2 ] = await hre.ethers.getSigners();

      const Turing = await hre.ethers.getContractFactory("Turing");
      await expect(
        Turing.deploy(
          professor.address,
          [candidate1.address, candidate2.address],
          ["same_codename", "same_codename"]
        )
      ).to.be.revertedWith("Duplicate codename");
    });
  });

  describe("Token Issuance", function () {
    it("Should allow owner to issue tokens", async function () {
      const { turing, owner, candidates } = await loadFixture(
        deployTuringFixture
      );
      const amount = parseEther("1");

      await turing.connect(owner).issueToken(candidates[0].codename, amount);
      expect(await turing.balanceOf(candidates[0].signer.address)).to.equal(
        amount
      );
    });

    it("Should allow professor to issue tokens", async function () {
      const { turing, professor, candidates } = await loadFixture(
        deployTuringFixture
      );
      const amount = parseEther("1");

      await turing
        .connect(professor)
        .issueToken(candidates[0].codename, amount);
      expect(await turing.balanceOf(candidates[0].signer.address)).to.equal(
        amount
      );
    });

    it("Should reject non-owner/non-professor issuance", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await expect(
        turing
          .connect(candidates[0].signer)
          .issueToken(candidates[1].codename, amount)
      ).to.be.revertedWith(
        "Only the contract owner or the professor can issue tokens"
      );
    });

    it("Should reject token issuance with invalid codename", async function () {
      const { turing, owner } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await expect(
        turing.connect(owner).issueToken("invalid_codename", amount)
      ).to.be.revertedWith("Codename not registered");
    });

    it("Should correctly accumulate multiple token issuances", async function () {
      const { turing, owner, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");
      
      await turing.connect(owner).issueToken(candidates[0].codename, amount);
      await turing.connect(owner).issueToken(candidates[0].codename, amount);
      
      expect(await turing.balanceOf(candidates[0].signer.address)).to.equal(parseEther("2"));
    });

    it("Should emit Transfer event on token issuance", async function () {
      const { turing, owner, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");
      
      await expect(turing.connect(owner).issueToken(candidates[0].codename, amount))
        .to.emit(turing, "Transfer")
        .withArgs(zeroAddress, candidates[0].signer.address, amount);
    });
  });

  describe("Voting", function () {
    it("Should allow voting with valid amount", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await turing
        .connect(candidates[0].signer)
        .vote(candidates[1].codename, amount);
      expect(await turing.balanceOf(candidates[1].signer.address)).to.equal(
        amount
      );
      expect(await turing.balanceOf(candidates[0].signer.address)).to.equal(
        parseEther("0.2")
      );
    });

    it("Should reject voting amount over 2 TTK", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("3");

      await expect(
        turing
          .connect(candidates[0].signer)
          .vote(candidates[1].codename, amount)
      ).to.be.revertedWith("Cannot vote more than 2 TTK");
    });

    it("Should prevent voting for self", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await expect(
        turing
          .connect(candidates[0].signer)
          .vote(candidates[0].codename, amount)
      ).to.be.revertedWith("Cannot vote for yourself");
    });

    it("Should prevent double voting", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await turing
        .connect(candidates[0].signer)
        .vote(candidates[1].codename, amount);
      await expect(
        turing
          .connect(candidates[0].signer)
          .vote(candidates[1].codename, amount)
      ).to.be.revertedWith("Already voted for this candidate");
    });

    it("Should verify voter receives exactly 0.2 TTK reward", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await turing
        .connect(candidates[0].signer)
        .vote(candidates[1].codename, amount);
      expect(await turing.balanceOf(candidates[0].signer.address)).to.equal(
        parseEther("0.2")
      );
    });

    it("Should reject voting with invalid codename", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await expect(
        turing.connect(candidates[0].signer).vote("invalid_codename", amount)
      ).to.be.revertedWith("Codename not registered");
    });

    it("Should reject voting from non-candidate address", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const [nonCandidate] = await hre.ethers.getSigners();
      const amount = parseEther("1");
  
      await expect(
        turing.connect(nonCandidate).vote(candidates[0].codename, amount)
      ).to.be.revertedWith("Voter not found");
    });

    it("Should emit Transfer events for both vote and reward", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");
      const reward = parseEther("0.2");

      await expect(turing.connect(candidates[0].signer).vote(candidates[1].codename, amount))
        .to.emit(turing, "Transfer").withArgs(zeroAddress, candidates[1].signer.address, amount)
        .and.to.emit(turing, "Transfer").withArgs(zeroAddress, candidates[0].signer.address, reward);
    });
  });
  
  describe("Voting Control", function () {
    it("Should allow owner to stop voting", async function () {
      const { turing, owner, candidates } = await loadFixture(
        deployTuringFixture
      );

      await turing.connect(owner).votingOff();
      expect(await turing.votingOpen()).to.be.false;
      
      await expect(
        turing
        .connect(candidates[0].signer)
        .vote(candidates[1].codename, parseEther("1"))
      ).to.be.revertedWith("Voting is closed");
    });
    
    it("Should allow professor to control voting", async function () {
      const { turing, professor } = await loadFixture(deployTuringFixture);
      
      await turing.connect(professor).votingOff();
      expect(await turing.votingOpen()).to.be.false;
      
      await turing.connect(professor).votingOn();
      expect(await turing.votingOpen()).to.be.true;
    });
    
    it("Should reject non-owner/non-professor voting control", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);

      await expect(
        turing.connect(candidates[0].signer).votingOff()
      ).to.be.revertedWith(
        "Only the contract owner or the professor can close voting"
      );
      
      await expect(
        turing.connect(candidates[0].signer).votingOn()
      ).to.be.revertedWith(
        "Only the contract owner or the professor can open voting"
      );
    });

    it("Should reject voting when voting is closed", async function () {
      const { turing, owner, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");

      await turing.connect(owner).votingOff();
      await expect(
        turing.connect(candidates[0].signer).vote(candidates[1].codename, amount)
      ).to.be.revertedWith("Voting is closed");
    });

    it("Should allow voting after reopening", async function () {
      const { turing, owner, candidates } = await loadFixture(deployTuringFixture);
      const amount = parseEther("1");
  
      await turing.connect(owner).votingOff();
      await turing.connect(owner).votingOn();
      
      await expect(
        turing.connect(candidates[0].signer).vote(candidates[1].codename, amount)
      ).not.to.be.reverted;
    });
  });
  
  describe("Get Candidates Codenames", function () {
    it("Should return all codenames", async function () {
      const { turing, candidates } = await loadFixture(deployTuringFixture);
      
      const codenames = await turing.getCandidatesCodenames();
      expect(codenames).to.have.lengthOf(candidates.length);
      candidates.forEach((candidate, i) => {
        expect(codenames[i]).to.equal(candidate.codename);
      });
    });
  });
});
