const hre = require("hardhat");

async function initSmartContracts() {

  // Variables for MasterChef Deployment
  var currentBlock = await hre.ethers.provider.getBlockNumber();
  var timestamp = (await hre.ethers.provider.getBlock(currentBlock)).timestamp;
  var emmissionPerBlock = ethers.utils.parseEther("0.5");

  const [owner, addr1, addr2] = await hre.ethers.getSigners();

  // Deploy Native
  contractFactory = await hre.ethers.getContractFactory("Native");
  const nativeContract = await contractFactory.deploy();
  await nativeContract.deployed();

  // Deploy dETH-WETH LP
  contractFactory = await hre.ethers.getContractFactory('DETHWETHLP');
  const lpContract = await contractFactory.deploy({gasLimit: 10000000});
  await lpContract.deployed();

  // Deploy USDC
  contractFactory = await hre.ethers.getContractFactory('USDC');
  const usdcContract = await contractFactory.deploy({gasLimit: 10000000});
  await usdcContract.deployed();

  // Deploy MasterChef
  contractFactory = await hre.ethers.getContractFactory('MasterChef');
  const masterChefContract = await contractFactory.deploy(nativeContract.address, timestamp, emmissionPerBlock);
  await masterChefContract.deployed();

  return [
    lpContract,
    masterChefContract,
    usdcContract,
    nativeContract
  ];

}

initSmartContracts()

module.exports = {
  initSmartContracts,
};