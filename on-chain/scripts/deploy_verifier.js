// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  //console.log("Account balance:", (await deployer.getBalance()).toString());

  // const BuyVerifier = await hre.ethers.getContractFactory("contracts/BuyVerifier.sol:Verifier");
  // const buyVerifier = await BuyVerifier.deploy();

  // const SellVerifier = await hre.ethers.getContractFactory("contracts/SellVerifier.sol:Verifier");
  // const sellVerifier = await SellVerifier.deploy();

  const Verifier = await hre.ethers.getContractFactory("contracts/Verifier.sol:Verifier");
  const verifier = await Verifier.deploy();

  await verifier.deployed();

  // await buyVerifier.deployed();
  // await sellVerifier.deployed();

  console.log("Verifier deployed to:", verifier.address);
}

// Hardhat-recommended pattern
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
