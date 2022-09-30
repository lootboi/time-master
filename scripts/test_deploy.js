const hre = require("hardhat");
const chalk = require('chalk');
const { exec } = require('child_process');
const { ethers } = require("ethers");
const { exit } = require("process");
require('dotenv').config();

// function runShellCommands(commands) {
//     exec(commands, (err, stdout, stderr) => {
//       if (err) {
//         //some error occurred
//         console.log(chalk.red(err));
//       }
//       else {
//         console.log(chalk.green(stdout));
//         console.log(chalk.red(stderr));
//       }
//     })
//   }

// Let us create time between each transaction
var sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
    }
  


async function testDeploy() {

        ////////////////////////////////////
       ///     Wallet Configuration     ///
      ////////////////////////////////////

    [owner] = await hre.ethers.getSigners();
    const addr1 = ethers.Wallet.createRandom();
    const addr2 = ethers.Wallet.createRandom();

    // Create provider
    const provider = new ethers.providers.JsonRpcProvider(process.env.TEST_URL);
    const wallet1 = new ethers.Wallet(addr1.privateKey, provider);
    const wallet2 = new ethers.Wallet(addr2.privateKey, provider);

    // Print the addresses of the accounts
    console.log(chalk.blue.underline("Deployment Addresses:"));
    console.log("Owner address:", owner.address);
    console.log("Addr1 address:", addr1.address);
    console.log("Addr2 address:", addr2.address);
    console.log(chalk.cyan("Wallet Configuration: Success!"));
    console.log('\n');

        ////////////////////////////////////
       ///     Contract Depployment     ///
      ////////////////////////////////////

    console.log(chalk.blue.underline("Deployment Beginning:"));


    // deploy IterableMapping
    let contractFactory = await hre.ethers.getContractFactory('IterableMapping');
    const lib = await contractFactory.deploy();
    await lib.deployed();
    console.log("          lib:", lib.address);
    await sleep(2500);

    // deploy dETH
    contractFactory = await hre.ethers.getContractFactory('dETHV3', {
        libraries: {
            IterableMapping: lib.address,
        },
    });
    const dethContract = await contractFactory.deploy({gasLimit: 12500000});
    await dethContract.deployed();
    console.log(" dethContract:", dethContract.address);
    await sleep(2500);

    // Create LP pair 
    await dethContract.adminCreatePair("0xaFd37A86044528010d0E70cDc58d0A9B5Eb03206");
    console.log("LP created at:", await dethContract.uniswapV2Pair());
    await sleep(2500);

    // Create instance of router to add liquidity + swap
    const routerAbi = [
        "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
        "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable",
        "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external"
    ];
    const routerAddress = "0xaFd37A86044528010d0E70cDc58d0A9B5Eb03206";
    const routerContract = new ethers.Contract(routerAddress, routerAbi, owner);

    // Add liquidity
    await dethContract.approve(routerContract.address, ethers.utils.parseEther("1000000"));
    await routerContract.addLiquidityETH(
        dethContract.address,
        ethers.utils.parseEther("1000000"),
        0,
        0,
        owner.address,
        Math.floor(Date.now() / 1000) + 600,
        {
            value: 100000000000000,
            gasLimit: 2500000
    });

    await sleep(2500);

    // Get block timestamp
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    const timestamp = (await hre.ethers.provider.getBlock(currentBlock)).timestamp;

    // Deploy MasterChef
    contractFactory = await hre.ethers.getContractFactory("MasterChef");
    const masterChefContract = await contractFactory.deploy(dethContract.address, timestamp, ethers.utils.parseEther("0.5"));
    await masterChefContract.deployed();
    console.log("MasterChef at:", masterChefContract.address);
    console.log(chalk.cyan("Deployment: Success!"));
    console.log('\n');

        ////////////////////////////////////
       ///    Contract Verification     ///
      ////////////////////////////////////

    // console.log(chalk.blue.underline("Verification Beginning:"));

    // try {
    //     runShellCommands('npx hardhat verify ' + lib.address + ' --network optimistic-goerli');
    //     console.log('lib verified:', 'https://goerli-optimism.etherscan.io/address/' + lib.address);
    // }
    // catch (error) {
    //     console.log(chalk.red(error));
    // }

    // try {
    // runShellCommands('npx hardhat verify ' + masterChefContract.address + ' ' + dethContract.address + ' ' + timestamp + ' ' + ethers.utils.parseEther("0.5") + ' --network optimistic-goerli');
    // console.log('masterChefContract verified:', 'https://goerli-optimism.etherscan.io/address/' + masterChefContract.address);
    // }
    // catch (error) {
    //     console.log(chalk.red(error));
    // }

    // try {
    // runShellCommands('npx hardhat verify ' + dethContract.address + ' --network optimistic-goerli');
    // console.log('dethContract verified:', 'https://goerli-optimism.etherscan.io/address/' + dethContract.address);
    // console.log(chalk.cyan("Verification: Success!"));
    // }
    // catch (error) {
    //     console.log(chalk.red(error));
    // }
    
    // console.log('\n');

        ////////////////////////////////////
       ///    Contract Configuration    ///
      ////////////////////////////////////

    console.log(chalk.blue.underline("Configuration Beginning:"));
    await sleep(2500);

    // Exempt MasterChef from fees
    await dethContract.excludeFromFees(masterChefContract.address, true);
    console.log("MasterChef excluded from fees");

    await sleep(2500);

    // Get LP pair address
    const lpPairAddress = await dethContract.uniswapV2Pair();

    // Create pools in MasterChef
    await masterChefContract.add(100, dethContract.address, 0, 600, true, 3600);
    console.log("Pool created for dETH");
    await sleep(2500);

    await masterChefContract.add(100, lpPairAddress, 0, 600, true, 3600);
    console.log("Pool created for LP pair");
    await sleep(2500);

    // Transfer reward tokens to MasterChef
    const currentBlock2 = await hre.ethers.provider.getBlockNumber();
    const timestamp2 = (await hre.ethers.provider.getBlock(currentBlock2)).timestamp;
    await dethContract.transfer(masterChefContract.address, ethers.utils.parseEther("1000000"));
    console.log("Reward tokens transferred to MasterChef");
    await sleep(2500);

    await masterChefContract.addBalance(timestamp2 + 1000000);
    console.log("Reward tokens configured to MasterChef");
    await sleep(2500);

    // Send Eth to addr1
    const tx = {
        from: owner.address,
        to: addr1.address,
        value: ethers.utils.parseEther("0.005"),
        nonce: await hre.ethers.provider.getTransactionCount(owner.address, "latest"),
        gasLimit: ethers.utils.hexlify(2500000),
    };

    owner.sendTransaction(tx).then(() => {
        console.log("Eth sent to addr1");
    });

    await sleep(2500);

    // Enable dETH to swap
    await dethContract.Launch();
    console.log("dETH launched");
    console.log(chalk.cyan("Contract Configuration: Success!"));
    console.log('\n');

        ////////////////////////////////////
       ///       dETH Reflections       ///
      ////////////////////////////////////

    console.log(chalk.blue.underline("Testing dETh Reflections:"));
    await sleep(2500);

    // Swap Eth for dETH
    await dethContract.connect(wallet1).approve(routerAddress, ethers.utils.parseEther("10000000"), {gasLimit: 2500000});
    console.log("Addr1 approved dETh for Router");
    await sleep(20000);

    const wethAddress = "0x25d5AD21dA5312202AFB5ff7271F3D4c98d6d2c0";
    await routerContract.connect(wallet1).swapExactETHForTokensSupportingFeeOnTransferTokens(
        0,
        [wethAddress, dethContract.address],
        addr1.address,
        Math.floor(Date.now() / 1000) + 600,
        {
            value: ethers.utils.parseEther("0.001"),
            gasLimit: 2500000
    });
    console.log("Eth swapped for dETH #1");
    await sleep(2500);
    
    // Swap dETH for Eth
    await routerContract.connect(wallet1).swapExactTokensForETHSupportingFeeOnTransferTokens(
        ethers.utils.parseEther("1000"),
        0,
        [dethContract.address, wethAddress],
        addr1.address,
        Math.floor(Date.now() / 1000) + 600,
        {
            gasLimit: 2500000
    });
    console.log("dETH swapped for Eth #1");
    await sleep(2500);

    // Swap Eth for dETH
    await routerContract.connect(wallet1).swapExactETHForTokensSupportingFeeOnTransferTokens(
        0,
        [wethAddress, dethContract.address],
        addr1.address,
        Math.floor(Date.now() / 1000) + 600,
        {
            value: ethers.utils.parseEther("0.001"),
            gasLimit: 2500000
    });
    console.log("Eth swapped for dETH #2");
    await sleep(2500);

    // Swap dETH for Eth
    await routerContract.connect(wallet1).swapExactTokensForETHSupportingFeeOnTransferTokens(
        ethers.utils.parseEther("1000"),
        0,
        [dethContract.address, wethAddress],
        addr1.address,
        Math.floor(Date.now() / 1000) + 600,
        {
            gasLimit: 2500000
    });
    console.log("dETH swapped for Eth #2");
    await sleep(2500);

    // Attempt to withdraw Ether from MasterChef
    await masterChefContract.retrieveDividends();
    console.log("Ether withdrawn from MasterChef");
    await sleep(2500);

    console.log("dETH deposited into MasterChef");
    console.log(chalk.cyan("Testing dETH Reflections: Success!"));
    console.log('\n');

        ////////////////////////////////////
       ///      Emissions Testing       ///
      ////////////////////////////////////

    console.log(chalk.blue.underline("Testing Emissions:"));

    // Deposit dETH into MasterChef
    await dethContract.connect(wallet1).approve(masterChefContract.address, ethers.utils.parseEther("10000000"));
    console.log("Addr1 approved dETH for MasterChef");
    await sleep(5000);
    await masterChefContract.connect(wallet1).deposit(0, ethers.utils.parseEther("1000"), {gasLimit: 2500000});
    console.log("dETH deposited into MasterChef as addr1");
    
    await sleep(60000);

    // Claim dETH from MasterChef
    await masterChefContract.connect(wallet1).withdraw(0, 0, {gasLimit: 2500000});
    console.log("dETH Claimed from MasterChef");

    // Check dETH balance of wallet1
    const dethBalance = await dethContract.balanceOf(wallet1.address);
    console.log("dETH balance of addr1: " + ethers.utils.formatEther(dethBalance));
    console.log(chalk.cyan("Testing Emissions: Success!"));
    console.log('\n');

        ////////////////////////////////////
       /// Deposits/Withdrawals Testing ///
      ////////////////////////////////////

    console.log(chalk.blue.underline("Testing Deposits & Withdrawals in MasterChef:"));

    // Deposit dETH into MasterChef as owner
    await dethContract.connect(owner).approve(masterChefContract.address, ethers.utils.parseEther("10000000"));
    console.log("Owner approved dETH for MasterChef");
    await masterChefContract.connect(owner).deposit(0, ethers.utils.parseEther("1000"), {gasLimit: 2500000});
    console.log("dETH deposited into MasterChef as owner");

    await sleep(60000);

    // Claim dETH from MasterChef as owner
    await masterChefContract.connect(owner).withdraw(0, 0, {gasLimit: 2500000});
    console.log("dETH Claimed from MasterChef as owner");

    await sleep(2500);

    // Check dETH balance of owner
    const dethBalance2 = await dethContract.balanceOf(owner.address);
    console.log("dETH balance of owner: " + ethers.utils.formatEther(dethBalance2));

    await sleep(2500);

    // Deposit dETH into MasterChef as wallet1
    await masterChefContract.connect(wallet1).deposit(0, ethers.utils.parseEther("1000"), {gasLimit: 2500000});
    console.log("dETH deposited into MasterChef as addr1");

    await sleep(60000);

    // Claim dETH from MasterChef as wallet1
    await masterChefContract.connect(wallet1).withdraw(0, 0, {gasLimit: 2500000});
    console.log("dETH Claimed from MasterChef as addr1");

    await sleep(2500);

    // Check dETH balance of wallet1
    const dethBalance3 = await dethContract.balanceOf(wallet1.address);
    console.log("dETH balance of addr1: " + ethers.utils.formatEther(dethBalance3));

    await sleep(2500);

    console.log(chalk.cyan("Testing Deposits & Withdrawals in MasterChef: Success!"));
    console.log('\n');
    console.log(chalk.cyan("✨ Testing Complete! ✨"));

}

testDeploy().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});