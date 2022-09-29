const hre = require("hardhat");

async function deployMasterChef() {

    const current = Math.floor(Date.now() / 1000);
    const startBlock = current + 600; // Now + 10 minutes

    const totalRewards = ethers.utils.parseEther("1000000");
    const deltaSeconds = 86400*90; // 1 day
    const emmissionPerBlock = totalRewards.div(deltaSeconds);

    let contractFactory = await hre.ethers.getContractFactory("MasterChef");
    const masterChef = await contractFactory.deploy("dETH_Address", startBlock, emmissionPerBlock);
    await masterChef.deployed();
    
    console.log("MasterChef deployed to:", masterChef.address);
    console.log("MasterChef startBlock:", startBlock);
    console.log("MasterChef emmissionPerBlock:", emmissionPerBlock.toString());

}

deployMasterChef()