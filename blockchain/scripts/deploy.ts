import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying HydroCredToken...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy the contract
  const HydroCredToken = await ethers.getContractFactory("HydroCredToken");
  const hydroCredToken = await HydroCredToken.deploy(deployer.address);
  
  await hydroCredToken.waitForDeployment();
  const contractAddress = await hydroCredToken.getAddress();
  
  console.log("✅ HydroCredToken deployed to:", contractAddress);
  console.log("🔑 Default admin and certifier:", deployer.address);
  
  // Save contract address to file
    // Save contract address to file
  const net = await ethers.provider.getNetwork();
  const contractInfo = {
    address: contractAddress,
    network: net.name,
    chainId: net.chainId.toString(), // Fix: BigInt -> string
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(__dirname, "../contract-address.json"),
    JSON.stringify(contractInfo, null, 2)
  );

  
  fs.writeFileSync(
    path.join(__dirname, "../contract-address.json"),
    JSON.stringify(contractInfo, null, 2)
  );
  
  console.log("📄 Contract info saved to contract-address.json");
  
  // Verify contract deployment
  try {
    const name = await hydroCredToken.name();
    const symbol = await hydroCredToken.symbol();
    console.log(`📋 Contract verified: ${name} (${symbol})`);
  } catch (error) {
    console.error("❌ Contract verification failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });