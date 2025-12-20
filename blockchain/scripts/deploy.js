import hre from "hardhat";

async function main() {
  const TicketNFT = await hre.ethers.deployContract("TicketNFT");
  await TicketNFT.waitForDeployment();
  console.log("Deployed at:", TicketNFT.target);
}

main();
