# TimeMaster (Time Restricted MasterChef)

This project includes an implmentation of a MasterChef contract that allows a deployer to control lockup periods for staked balances, as well as intervals in which users are allowed to collect rewards

## Requirements:
  ```npm```

## Setup

This project utilizes the Hardhat framework in order to test and deploy contracts:

1. ```npm install``` to install all of the dependencies within the repository
2. ```.env``` You will need to create file using ENV_EXAMPLE to setup hardhat 

*If you would like to change which network you test or deploy to, you must configure the ```hardhat.config.js``` file with the relevant information

## Testing

All of the tests are located in the ```/test``` folder 
- ```common.js``` Is a contract factory that is used in ```masterchef.js``` to easily deploy each contract for each test
- ```masterchef.js``` Holds all of the negative and positive scenerio testing for the actual MasterChef contract

In order to run the tests you can use the ```npx hardhat test``` command
If you would like to run a specific test file, you can use ```npx hardhat test test/<filename>```
If you would like to run a specific test, or a handful of specific tests, change the following:

```it("This is a unit test...```

**Into**

```it.only("This is a unit test...```

If you would like add your own tests, you can add them to masterchef.js 
**OR**
You can create your own file within the ```/test``` folder

## Deployment

In order to deploy **you have to have your .env file setup**. After making sure that it is set up, you have two scripts to choose from within the ```/scripts``` folder:

- ```mc_deploy.js``` This only deploys the masterchef contract
- ```test_deploy.js``` This is an end to end test meant to be used to look for full functionality within the MasterChef contract. While it is useful to use this script on the local Hardhat environment, I would stress that using at least a testnet network is ideal for testing before production. This can be accessed by adding the spcific testnet you wish to use into the ```hardhat.config.js``` file then using the command ```npx hardhat scripts/test_deply.js --network <name of network>```

## To Do
- Correct functionality for programmatic contract verification on etherscan
- Cleanup ```test_deploy.js```
