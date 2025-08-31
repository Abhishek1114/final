import { expect } from "chai";
import { ethers } from "hardhat";
import { HydroCredToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("HydroCredToken", function () {
  let hydroCredToken: HydroCredToken;
  let owner: SignerWithAddress;
  let certifier: SignerWithAddress;
  let producer: SignerWithAddress;
  let buyer: SignerWithAddress;

  beforeEach(async function () {
    [owner, certifier, producer, buyer] = await ethers.getSigners();

    const HydroCredToken = await ethers.getContractFactory("HydroCredToken");
    hydroCredToken = await HydroCredToken.deploy(owner.address);
    await hydroCredToken.waitForDeployment();

    // Set certifier
    await hydroCredToken.setCertifier(certifier.address);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await hydroCredToken.name()).to.equal("HydroCred Token");
      expect(await hydroCredToken.symbol()).to.equal("HCT");
    });

    it("Should set the deployer as admin and certifier", async function () {
      const adminRole = await hydroCredToken.DEFAULT_ADMIN_ROLE();
      const certifierRole = await hydroCredToken.CERTIFIER_ROLE();
      
      expect(await hydroCredToken.hasRole(adminRole, owner.address)).to.be.true;
      expect(await hydroCredToken.hasRole(certifierRole, owner.address)).to.be.true;
    });
  });

  describe("Credit Issuance", function () {
    it("Should allow certifier to batch issue credits", async function () {
      const amount = 10;
      
      await expect(hydroCredToken.connect(certifier).batchIssue(producer.address, amount))
        .to.emit(hydroCredToken, "CreditsIssued")
        .withArgs(producer.address, amount, 1, 10);

      expect(await hydroCredToken.balanceOf(producer.address)).to.equal(amount);
    });

    it("Should not allow non-certifier to issue credits", async function () {
      await expect(
        hydroCredToken.connect(producer).batchIssue(producer.address, 5)
      ).to.be.revertedWithCustomError(hydroCredToken, "AccessControlUnauthorizedAccount");
    });

    it("Should not issue more than 1000 credits at once", async function () {
      await expect(
        hydroCredToken.connect(certifier).batchIssue(producer.address, 1001)
      ).to.be.revertedWith("Cannot issue more than 1000 credits at once");
    });
  });

  describe("Credit Transfer", function () {
    beforeEach(async function () {
      await hydroCredToken.connect(certifier).batchIssue(producer.address, 5);
    });

    it("Should allow transfer of non-retired credits", async function () {
      await hydroCredToken.connect(producer).transferFrom(producer.address, buyer.address, 1);
      expect(await hydroCredToken.ownerOf(1)).to.equal(buyer.address);
    });

    it("Should not allow transfer of retired credits", async function () {
      await hydroCredToken.connect(producer).retire(1);
      
      await expect(
        hydroCredToken.connect(producer).transferFrom(producer.address, buyer.address, 1)
      ).to.be.revertedWith("Cannot transfer retired credit");
    });
  });

  describe("Credit Retirement", function () {
    beforeEach(async function () {
      await hydroCredToken.connect(certifier).batchIssue(producer.address, 5);
      await hydroCredToken.connect(producer).transferFrom(producer.address, buyer.address, 1);
    });

    it("Should allow owner to retire credit", async function () {
      const tx = await hydroCredToken.connect(buyer).retire(1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      await expect(tx)
        .to.emit(hydroCredToken, "CreditRetired")
        .withArgs(buyer.address, 1, block.timestamp);

      expect(await hydroCredToken.isRetired(1)).to.be.true;
      expect(await hydroCredToken.retiredBy(1)).to.equal(buyer.address);
    });

    it("Should not allow non-owner to retire credit", async function () {
      await expect(
        hydroCredToken.connect(producer).retire(1)
      ).to.be.revertedWith("Only owner can retire credit");
    });

    it("Should not allow retiring already retired credit", async function () {
      await hydroCredToken.connect(buyer).retire(1);
      
      await expect(
        hydroCredToken.connect(buyer).retire(1)
      ).to.be.revertedWith("Credit already retired");
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to set new certifier", async function () {
      await expect(hydroCredToken.setCertifier(certifier.address))
        .to.emit(hydroCredToken, "CertifierUpdated")
        .withArgs(certifier.address, owner.address);

      const certifierRole = await hydroCredToken.CERTIFIER_ROLE();
      expect(await hydroCredToken.hasRole(certifierRole, certifier.address)).to.be.true;
    });

    it("Should not allow non-admin to set certifier", async function () {
      await expect(
        hydroCredToken.connect(producer).setCertifier(producer.address)
      ).to.be.revertedWithCustomError(hydroCredToken, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Token Enumeration", function () {
    beforeEach(async function () {
      await hydroCredToken.connect(certifier).batchIssue(producer.address, 3);
    });

    it("Should return correct tokens of owner", async function () {
      const tokens = await hydroCredToken.tokensOfOwner(producer.address);
      expect(tokens.length).to.equal(3);
      expect(tokens[0]).to.equal(1);
      expect(tokens[1]).to.equal(2);
      expect(tokens[2]).to.equal(3);
    });
  });
});