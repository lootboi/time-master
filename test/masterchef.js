const { expect } = require("chai");
const { ethers } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { chalk } = require("chalk");
const { initSmartContracts } = require("./common.js");

describe("Masterchef", function() {
    beforeEach("Check Deployment", async function () {

        [ lpContract, masterChefContract, usdcContract, nativeContract ] = await initSmartContracts();
        [owner, staker, addr1] = await ethers.getSigners();

    })
    it("Check initial values", async function () {

        // Check that owner is the dev and fee address
        expect(await masterChefContract.devAddress()).to.equal(owner.address);
        expect(await masterChefContract.feeAddress()).to.equal(owner.address);
        
        // Check that initial values are correct
        expect(await masterChefContract.tokenPerSecond()).to.equal(ethers.utils.parseEther("0.5")); 
        expect(await masterChefContract.totalAllocPoint()).to.equal(0);
        expect(await masterChefContract.poolLength()).to.equal(0);
        expect(await masterChefContract.token()).to.equal(nativeContract.address); 

    });
    it("Check emissions are expected", async function() {

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 500, true, 500);

        // Deposit Native Tokens
        await nativeContract.transfer(masterChefContract.address, ethers.utils.parseEther("1000"));

        // Add Balance to LP Contract
        var currentBlock = await hre.ethers.provider.getBlockNumber();
        var timestamp = (await hre.ethers.provider.getBlock(currentBlock)).timestamp;
        await masterChefContract.addBalance(timestamp + 1000);

        // Check that deposit info updated correctly for poolInfo
        const perBlockBig = await masterChefContract.tokenPerSecond();
        const perBlock = ethers.utils.formatEther(perBlockBig); 
        expect(String(perBlock)).to.be.a('string').and.satisfy(msg => msg.startsWith('1.00'));
        expect(await masterChefContract.treasure()).to.equal(ethers.utils.parseEther("1000"));

        // Deposit 1000 LP Tokens to Stake
        await lpContract.approve(masterChefContract.address, ethers.utils.parseEther("1000"));
        await masterChefContract.deposit(0, ethers.utils.parseEther("1000"));

        // Check that the masterChef now has the owners balance of LP Tokens
        expect(await lpContract.balanceOf(masterChefContract.address)).to.equal(ethers.utils.parseEther("1000"));
        expect(await lpContract.balanceOf(owner.address)).to.equal(0);

        // Mine 1000 blocks +  to fake time passing
        await ethers.provider.send("evm_increaseTime", [1000]);
        await ethers.provider.send("evm_mine");

        // Withdraw 1000 LP Tokens from Stake
        await masterChefContract.withdraw(0, ethers.utils.parseEther("1000"));

        // Check that the owner now has 1000 LP Tokens + 1000 Native Tokens
        expect(await lpContract.balanceOf(masterChefContract.address)).to.equal(0);
        expect(await lpContract.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("1000"));
        expect(await nativeContract.balanceOf(owner.address)).to.be.within(ethers.utils.parseEther("9995"), ethers.utils.parseEther("10000"));
        expect(await nativeContract.balanceOf(masterChefContract.address)).to.be.within(0, ethers.utils.parseEther("5"));

    })
    it("Check add pool with ownership - Expect Success", async function () {

        console.log("  Positive Scenerios:");

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 3600, true, 3600);

        // Check poolInfo updated correctly
        const poolInfo = await masterChefContract.poolInfo(0);
        expect(poolInfo.allocPoint).to.equal(100);
        expect(poolInfo.accTokenPerShare).to.equal(0);
        expect(poolInfo.lpToken).to.equal(lpContract.address);
        expect(poolInfo.depositFeeBP).to.equal(0);
        expect(poolInfo.harvestInterval).to.equal(3600);
        expect(poolInfo.withdrawLockPeriod).to.equal(3600);
        expect(poolInfo.balance).to.equal(0);

        // Check that global variables updated correctly
        expect(await masterChefContract.poolLength()).to.equal(1);
        expect(await masterChefContract.totalAllocPoint()).to.equal(100);

    });
    it("Check update pool with ownership - Expect Success", async function () {

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 3600, true, 3600);

        // Update pool
        await masterChefContract.updatePool(0);

        // Check that global variables updated correctly
        expect(await masterChefContract.poolLength()).to.equal(1);
        expect(await masterChefContract.totalAllocPoint()).to.equal(100);

    });
    it("Check set dev address with ownership - Expect Success", async function () {
            
        // Check that owner is the dev address
        expect(await masterChefContract.devAddress()).to.equal(owner.address);
        
        // Set dev address
        await masterChefContract.setDevAddress(addr1.address);

        // Check that dev address updated correctly
        expect(await masterChefContract.devAddress()).to.equal(addr1.address);
    
    });
    it("Check set fee address with ownership - Expect Success", async function () {
                
        // Check that owner is the fee address
        expect(await masterChefContract.feeAddress()).to.equal(owner.address);

        // Set fee address
        await masterChefContract.setFeeAddress(addr1.address);

        // Check that fee address updated correctly
        expect(await masterChefContract.feeAddress()).to.equal(addr1.address);
        
    });
    it("Check set pool with ownership - Expect Success", async function() {

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 3600, true, 3600);

        // Set pool
        await masterChefContract.set(0, 200, 0, 3600, true, 3600);

        // Check poolInfo updated correctly
        const poolInfo = await masterChefContract.poolInfo(0);
        expect(poolInfo.allocPoint).to.equal(200);
        expect(poolInfo.accTokenPerShare).to.equal(0);
        expect(poolInfo.lpToken).to.equal(lpContract.address);
        expect(poolInfo.depositFeeBP).to.equal(0);
        expect(poolInfo.harvestInterval).to.equal(3600);
        expect(poolInfo.withdrawLockPeriod).to.equal(3600);
        expect(poolInfo.balance).to.equal(0);

        // Check that global variables updated correctly
        expect(await masterChefContract.poolLength()).to.equal(1);
        expect(await masterChefContract.totalAllocPoint()).to.equal(200);

    });
    it("Check that deposit info updates correctly - Expect Success", async function () {

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 3600, true, 3600);

        // Deposit 1000 LP Tokens
        await lpContract.approve(masterChefContract.address, ethers.utils.parseEther("1000"));
        await masterChefContract.deposit(0, ethers.utils.parseEther("1000"));

        // Check that deposit info updated correctly for poolInfo
        const depositInfo = await masterChefContract.userInfo(0, owner.address);
        expect(depositInfo.amount).to.equal(ethers.utils.parseEther("1000"));
        expect(depositInfo.rewardDebt).to.equal(0);
        expect(depositInfo.lastDepositTime).to.not.equal(0);

        // Check that deposit info updated correctly for userInfo
        const userInfo = await masterChefContract.userInfo(0, owner.address);
        expect(userInfo.amount).to.equal(ethers.utils.parseEther("1000"));

    });
    it("Check that withdrawal lockup period and reward claim can be different - Expect Success", async function() {

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 86400, true, 604800);

        // Deposit Native Tokens for Rewards
        var block = await ethers.provider.getBlock();
        var timestamp = block.timestamp;
        await nativeContract.transfer(masterChefContract.address, ethers.utils.parseEther("1000"));
        await masterChefContract.addBalance(timestamp + 2628000);

        // Deposit 1000 LP Tokens
        await lpContract.approve(masterChefContract.address, ethers.utils.parseEther("1000"));
        await masterChefContract.deposit(0, ethers.utils.parseEther("1000"));

        // Mine 1000 blocks +  to fake time passing
        await ethers.provider.send("evm_increaseTime", [86400]);
        await ethers.provider.send("evm_mine");

        // Withdraw 1000 LP Tokens from Stake
        await masterChefContract.withdraw(0, 0);

        // Check that the owner now has 1000 LP Tokens + 1000 Native Tokens
        expect(await lpContract.balanceOf(masterChefContract.address)).to.equal(ethers.utils.parseEther("1000"));
        expect(await nativeContract.balanceOf(masterChefContract.address)).to.equal("967122882134000000000");
        expect(await nativeContract.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("9032.877117866"));

        // Attempt to withdraw 1000 LP Tokens from Stake before withdraw lockup period
        try {
            await masterChefContract.withdraw(0, ethers.utils.parseEther("1000"));

        }
        catch (err) {
            expect(err.message).to.equal("VM Exception while processing transaction: reverted with reason string 'withdraw still locked'");
        }

        // Fake 1 week passing
        await ethers.provider.send("evm_increaseTime", [604800]);
        await ethers.provider.send("evm_mine");

        // Withdraw 1000 LP Tokens from Stake
        await masterChefContract.withdraw(0, ethers.utils.parseEther("1000"));
        expect(await lpContract.balanceOf(masterChefContract.address)).to.equal(0);

    });
    it("Attempt to withdraw after 1 hour - Expect success", async function() {

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 3600, true, 3600);

        // Deposit 1000 LP Tokens
        await lpContract.approve(masterChefContract.address, ethers.utils.parseEther("1000"));
        await masterChefContract.deposit(0, ethers.utils.parseEther("1000"));

        // Check owner balance before withdraw
        expect(await lpContract.balanceOf(owner.address)).to.equal(0);

        // Wait 1 hour
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine");

        // Withdraw 1000 LP Tokens
        await masterChefContract.withdraw(0, ethers.utils.parseEther("1000"));

        // Check that deposit info updated correctly for poolInfo
        const depositInfo = await masterChefContract.userInfo(0, owner.address);
        expect(depositInfo.amount).to.equal(0);
        expect(depositInfo.rewardDebt).to.equal(0);

        // Check that deposit info updated correctly for userInfo
        const userInfo = await masterChefContract.userInfo(0, owner.address);
        expect(userInfo.amount).to.equal(0);

        // Check owner balance after withdraw
        expect(await lpContract.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("1000"));

    });
    it("Attempt emergency withdraw before 1 hour - Expect Success", async function() {

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 3600, true, 3600);

        // Deposit 1000 LP Tokens
        await lpContract.approve(masterChefContract.address, ethers.utils.parseEther("1000"));
        await masterChefContract.deposit(0, ethers.utils.parseEther("1000"));

        // Check owner balance before withdraw
        expect(await lpContract.balanceOf(owner.address)).to.equal(0);

        // Emergency withdraw 1000 LP Tokens
        await masterChefContract.emergencyWithdraw(0);

        // Check that deposit info updated correctly for poolInfo
        const depositInfo = await masterChefContract.userInfo(0, owner.address);
        expect(depositInfo.amount).to.equal(0);
        expect(depositInfo.rewardDebt).to.equal(0);

        // Check that deposit info updated correctly for userInfo
        const userInfo = await masterChefContract.userInfo(0, owner.address);
        expect(userInfo.amount).to.equal(0);

        // Check owner balance after withdraw
        expect(await lpContract.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("1000"));

    });
    it("Check that Ether can be sent to contract - Expect Success", async function () {

        // Send 1 Ether to contract
        await owner.sendTransaction({
            to: masterChefContract.address,
            value: ethers.utils.parseEther("1")
        });
        
        // Check that contract balance is 1 Ether
        expect(await ethers.provider.getBalance(masterChefContract.address)).to.equal(ethers.utils.parseEther("1"));

    });
    it("Check that Ether can be withdrawn from contract as owner - Expect Success", async function () {

        // Send 1 Ether to contract
        await owner.sendTransaction({
            to: masterChefContract.address,
            value: ethers.utils.parseEther("1")
        });

        // Check that contract balance is 1 Ether
        expect(await ethers.provider.getBalance(masterChefContract.address)).to.equal(ethers.utils.parseEther("1"));

        // Withdraw 1 Ether from contract
        await masterChefContract.retrieveDividends();

        // Check that contract balance is 0 Ether
        expect(await ethers.provider.getBalance(masterChefContract.address)).to.equal(0);

    });
    it("Check that variable amounts of deposit can be deposited - Expect success", async function() {

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 3600, true, 3600);

        // Deposit 1000 LP Tokens
        await lpContract.approve(masterChefContract.address, ethers.utils.parseEther("1000"));
        await masterChefContract.deposit(0, ethers.utils.parseEther("250"));

        // Check that balances are correct
        expect(await lpContract.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("750"));
        expect(await lpContract.balanceOf(masterChefContract.address)).to.equal(ethers.utils.parseEther("250"));

        // Check that deposit info updated correctly for poolInfo
        const depositInfo = await masterChefContract.userInfo(0, owner.address);
        expect(depositInfo.amount).to.equal(ethers.utils.parseEther("250"));
        expect(depositInfo.lastDepositTime).to.not.equal(0);

        // Deposit 500 LP Tokens
        await masterChefContract.deposit(0, ethers.utils.parseEther("500"));

        // Check that balances are correct
        expect(await lpContract.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("250"));
        expect(await lpContract.balanceOf(masterChefContract.address)).to.equal(ethers.utils.parseEther("750"));

        // Check that deposit info updated correctly for poolInfo
        const depositInfo2 = await masterChefContract.userInfo(0, owner.address);
        expect(depositInfo2.amount).to.equal(ethers.utils.parseEther("750"));
        expect(depositInfo2.lastDepositTime).to.not.equal(0);

    });
    it("Check that variable amounts of withdraw can be withdrawn", async function() {

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 3600, true, 3600);

        // Deposit 1000 LP Tokens
        await lpContract.approve(masterChefContract.address, ethers.utils.parseEther("1000"));
        await masterChefContract.deposit(0, ethers.utils.parseEther("1000"));

        // Check that balances are correct
        expect(await lpContract.balanceOf(owner.address)).to.equal(0);
        expect(await lpContract.balanceOf(masterChefContract.address)).to.equal(ethers.utils.parseEther("1000"));

        // Check that deposit info updated correctly for poolInfo
        const depositInfo = await masterChefContract.userInfo(0, owner.address);
        expect(depositInfo.amount).to.equal(ethers.utils.parseEther("1000"));
        expect(depositInfo.lastDepositTime).to.not.equal(0);

        // Fast forward 1 hour
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine");

        // Withdraw 500 LP Tokens
        await masterChefContract.withdraw(0, ethers.utils.parseEther("500"));

        // Check that balances are correct
        expect(await lpContract.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("500"));
        expect(await lpContract.balanceOf(masterChefContract.address)).to.equal(ethers.utils.parseEther("500"));

        // Check that deposit info updated correctly for poolInfo
        const depositInfo2 = await masterChefContract.userInfo(0, owner.address);
        expect(depositInfo2.amount).to.equal(ethers.utils.parseEther("500"));
        expect(depositInfo2.lastDepositTime).to.not.equal(0);

        // Withdraw 250 LP Tokens
        await masterChefContract.withdraw(0, ethers.utils.parseEther("250"));

        // Check that balances are correct
        expect(await lpContract.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("750"));
        expect(await lpContract.balanceOf(masterChefContract.address)).to.equal(ethers.utils.parseEther("250"));

        // Check that deposit info updated correctly for poolInfo
        const depositInfo3 = await masterChefContract.userInfo(0, owner.address);
        expect(depositInfo3.amount).to.equal(ethers.utils.parseEther("250"));
        expect(depositInfo3.lastDepositTime).to.not.equal(0);

    });
    it("Check that Ether can be withdrawn from contract as non-owner - Expect Fail", async function () {

        console.log("  Positive Scenerios:");

        // Send 1 Ether to contract
        await owner.sendTransaction({
            to: masterChefContract.address,
            value: ethers.utils.parseEther("1")
        });

        // Check that contract balance is 1 Ether
        expect(await ethers.provider.getBalance(masterChefContract.address)).to.equal(ethers.utils.parseEther("1"));

        // Attempt to withdraw 1 Ether from contract
        try {
            await masterChefContract.connect(addr1).retrieveDividends();
        }
        catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
        }

        // Check that contract balance is 1 Ether
        expect(await ethers.provider.getBalance(masterChefContract.address)).to.equal(ethers.utils.parseEther("1"));

    });
    it("Attempt to withdraw before 1 hour - Expect fail", async function() {

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 3600, true, 3600);

        // Deposit 1000 LP Tokens
        await lpContract.approve(masterChefContract.address, ethers.utils.parseEther("1000"));
        await masterChefContract.deposit(0, ethers.utils.parseEther("1000"));

        // Check owner balance before withdraw
        expect(await lpContract.balanceOf(owner.address)).to.equal(0);

        // Attempt to withdraw 1000 LP Tokens
        try {
            await masterChefContract.withdraw(0, ethers.utils.parseEther("1000"));
        }
        catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: reverted with reason string 'withdraw still locked'");
        }

        // Check that deposit info updated correctly for poolInfo
        const depositInfo = await masterChefContract.userInfo(0, owner.address);
        expect(depositInfo.amount).to.equal(ethers.utils.parseEther("1000"));
        expect(depositInfo.rewardDebt).to.equal(0);

        // Check that deposit info updated correctly for userInfo
        const userInfo = await masterChefContract.userInfo(0, owner.address);
        expect(userInfo.amount).to.equal(ethers.utils.parseEther("1000"));

        // Check owner balance after withdraw
        expect(await lpContract.balanceOf(owner.address)).to.equal(0);

    });
    it("Check add pool without ownership - Expect Fail", async function () {
            
        // Add LP Pool without ownership
        try {
            await masterChefContract.connect(addr1).add(100, lpContract.address, 0, 3600, true, 3600);
        }
        catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
        }
    
     });
     it("Check update pool without ownership - Expect Fail", async function () {
            
        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 3600, true, 3600);

        // Update pool without ownership
        try {
            await masterChefContract.connect(addr1).updatePool(0);
        }
        catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
        }
    
    });
    it("Check set dev address without ownership - Expect Fail", async function () {
                
        // Set dev address without ownership
        try {
            await masterChefContract.connect(addr1).setDevAddress(addr1.address);
        }
        catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: reverted with reason string 'setDevAddress: FORBIDDEN'");
        }
        
        // Check that dev address is not updated
        expect(await masterChefContract.devAddress()).to.equal(owner.address);

    });
    it("Check set fee address without ownership - Expect Fail", async function () {
                        
        // Set fee address without ownership
        try {
            await masterChefContract.connect(addr1).setFeeAddress(addr1.address);
        }
        catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: reverted with reason string 'setFeeAddress: FORBIDDEN'");
        }
        
        // Check that fee address is not updated
        expect(await masterChefContract.feeAddress()).to.equal(owner.address);
    
    });
    it("Check withdrawal without a staked balance - Expect Fail", async function() {

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 3600, true, 3600);

        // Check owner balance before withdraw
        expect(await lpContract.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("1000"));

        // Attempt to withdraw 1000 LP Tokens
        try {
            await masterChefContract.withdraw(0, ethers.utils.parseEther("1000"));
        }
        catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: reverted with reason string 'withdraw: not good'");
        }
        await lpContract.transfer(addr1.address, ethers.utils.parseEther("500"));
        await lpContract.connect(addr1).approve(masterChefContract.address, ethers.utils.parseEther("500"));
        await masterChefContract.connect(addr1).deposit(0, ethers.utils.parseEther("500"));

        // Attempt to withdraw when others are staked
        try {
            await masterChefContract.withdraw(0, 0);
        }
        catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: reverted with reason string 'withdraw: not good'");
        }

        // Check that the owners balance is still 500
        expect(await lpContract.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("500"));

    });
    it("Check withdraw more than staked balance - Expect fail", async function() {

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 3600, true, 3600);

        // Deposit 1000 LP Tokens
        await lpContract.approve(masterChefContract.address, ethers.utils.parseEther("1000"));
        await masterChefContract.deposit(0, ethers.utils.parseEther("1000"));

        // Check owner balance before withdraw
        expect(await lpContract.balanceOf(owner.address)).to.equal(0);

        // Fake time
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine");

        // Attempt to withdraw 1001 LP Tokens
        try {
            await masterChefContract.withdraw(0, ethers.utils.parseEther("1001"));
        }
        catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: reverted with reason string 'withdraw: not good'");
        }

        await masterChefContract.withdraw(0, ethers.utils.parseEther("500"));
        await lpContract.transfer(addr1.address, ethers.utils.parseEther("500"));
        await lpContract.connect(addr1).approve(masterChefContract.address, ethers.utils.parseEther("500"));
        await masterChefContract.connect(addr1).deposit(0, ethers.utils.parseEther("500"));

        // Attempt to withdraw 501 LP Tokens
        try {
            await masterChefContract.withdraw(0, ethers.utils.parseEther("501"));
        }
        catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: reverted with reason string 'withdraw: not good'");
        }

        const depositInfoOwner = await masterChefContract.userInfo(0, owner.address);
        const depositInfoAddr1 = await masterChefContract.userInfo(0, addr1.address);
        expect(depositInfoOwner.amount).to.equal(ethers.utils.parseEther("500"));
        expect(depositInfoAddr1.amount).to.equal(ethers.utils.parseEther("500"));
        expect(await lpContract.balanceOf(owner.address)).to.equal(0);

    });
    it("Check deposit with no balance - Expect Fail", async function() {

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 3600, true, 3600);

        // Attempt to deposit 1000 LP Tokens
        try {
            await lpContract.connect(addr1).approve(masterChefContract.address, ethers.utils.parseEther("1000"));
            await masterChefContract.connect(addr1).deposit(0, ethers.utils.parseEther("1000"));
        }
        catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)");
        }

        // Check that userInfo was not incorrectly updated
        const userInfo = await masterChefContract.userInfo(0, addr1.address);
        expect(userInfo.amount).to.equal(0);

    })
    it("Check set without ownership of MasterChef - Expect Fail", async function() {

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 3600, true, 3600);

        // Attempt to set without ownership
        try {
            await masterChefContract.connect(addr1).set(0, 50, 0, 3600, true, 3600);
        }
        catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'");
        }

    });
    it("Check set with invalid pool id - Expect Fail", async function() {

        // Add LP Pool
        await masterChefContract.add(100, lpContract.address, 0, 3600, true, 3600);

        // Attempt to set with invalid pool id
        try {
            await masterChefContract.set(1, 50, 0, 3600, true, 3600);
        }
        catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: invalid opcode");
        }

    });
});