const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const readline = require("readline");
const solc = require("solc");
const crypto = require("crypto");

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m"
};

const PRIVATE_KEYS = process.env.PRIVATE_KEYS
  ? process.env.PRIVATE_KEYS.split(",").map(k => k.trim())
  : [];

if (PRIVATE_KEYS.length === 0) {
  throw new Error("No private keys provided in PRIVATE_KEYS env variable.");
}

const tokenContractSource = 
pragma solidity ^0.8.13;

contract SeismicToken {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint256 _totalSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * 10**uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address to, uint256 value) public returns (bool success) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool success) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool success) {
        require(value <= balanceOf[from], "Insufficient balance");
        require(value <= allowance[from][msg.sender], "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}
;

function saveContractToFile(contractSource, filename) {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, contractSource);
  return filePath;
}

function compileContract(contractPath, contractName) {
  const contractSource = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      [path.basename(contractPath)]: {
        content: contractSource
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      },
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter(error => error.severity === 'error');
    if (errors.length > 0) {
      throw new Error(Compilation errors: ${JSON.stringify(errors, null, 2)});
    }
  }

  const contractFileName = path.basename(contractPath);
  const compiledContract = output.contracts[contractFileName]["SeismicToken"];

  if (!compiledContract) {
    throw new Error(Contract SeismicToken not found in compilation output);
  }

  return {
    abi: compiledContract.abi,
    bytecode: compiledContract.evm.bytecode.object
  };
}

function generateRandomAddress() {
  const privateKey = "0x" + crypto.randomBytes(32).toString('hex');
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}

function displaySection(title) {
  console.log("\n" + colors.cyan + colors.bright + "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" + colors.reset);
  console.log(colors.cyan + " 🚀 " + title + colors.reset);
  console.log(colors.cyan + colors.bright + "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" + colors.reset);
}

async function deployTokenContract(tokenName, tokenSymbol, totalSupply) {
  const provider = new ethers.providers.JsonRpcProvider("https://node-2.seismicdev.net/rpc");
  const deployments = [];

  for (const [i, privateKey] of PRIVATE_KEYS.entries()) {
    try {
      const wallet = new ethers.Wallet(privateKey, provider);

      displaySection(DEPLOYING FROM WALLET #${i + 1});
      console.log(👛 Wallet Address: ${colors.yellow}${wallet.address}${colors.reset});

      const balance = await wallet.getBalance();
      if (balance.eq(0)) {
        console.log(${colors.red}⚠️ Wallet has no ETH for gas. Skipping...${colors.reset});
        continue;
      }

      const contractPath = saveContractToFile(tokenContractSource, SeismicToken_${i + 1}.sol);
      const { abi, bytecode } = compileContract(contractPath, "SeismicToken");

      const factory = new ethers.ContractFactory(abi, "0x" + bytecode, wallet);
      const contract = await factory.deploy(tokenName, tokenSymbol, totalSupply, {
        gasLimit: 3000000,
      });

      console.log(🔄 Tx Hash: ${colors.yellow}${contract.deployTransaction.hash}${colors.reset});
      await contract.deployTransaction.wait();

      console.log(✅ Deployed at: ${colors.green}${contract.address}${colors.reset});

      deployments.push({ contractAddress: contract.address, abi, wallet });

    } catch (err) {
      console.error(${colors.red}❌ Deployment failed for wallet #${i + 1}: ${err.message}${colors.reset});
    }
  }

  return deployments;
}

async function transferTokens(deployments, numTransfers, amountPerTransfer) {
  for (const [i, { contractAddress, abi, wallet }] of deployments.entries()) {
    try {
      displaySection(TRANSFERS FROM WALLET #${i + 1});
      const tokenContract = new ethers.Contract(contractAddress, abi, wallet);

      for (let j = 0; j < numTransfers; j++) {
        const recipient = generateRandomAddress();
        const formattedAmount = ethers.utils.parseUnits(amountPerTransfer.toString(), 18);

        try {
          const tx = await tokenContract.transfer(recipient, formattedAmount);
          await tx.wait();
          console.log(  ✅ [${j + 1}] ${recipient} ← ${amountPerTransfer});
        } catch (txErr) {
          console.log(  ❌ [${j + 1}] Failed to send to ${recipient}: ${txErr.message});
        }
      }
    } catch (err) {
      console.error(${colors.red}❌ Transfer failed for wallet #${i + 1}: ${err.message}${colors.reset});
    }
  }

  console.log(${colors.green}✅ All transfers completed${colors.reset});
}

async function main() {
  console.log("\n" + colors.cyan + colors.bright + "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" + colors.reset);
  console.log(colors.cyan + colors.bright + "       SEISMIC MULTI-WALLET DEPLOYER - JUSWA AIRDROPS     " + colors.reset);
  console.log(colors.cyan + colors.bright + "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" + colors.reset);
  console.log(${colors.yellow}🌐 Network: Seismic devnet (Chain ID: 5124)${colors.reset});

  rl.question(\n${colors.yellow}📝 Enter token name: ${colors.reset}, (name) => {
    rl.question(${colors.yellow}🔤 Enter token symbol: ${colors.reset}, (symbol) => {
      rl.question(${colors.yellow}💰 Enter total supply: ${colors.reset}, async (supply) => {
        if (!name || !symbol || !supply) {
          console.error(${colors.red}❌ All fields are required!${colors.reset});
          rl.close();
          return;
        }

        try {
          const totalSupply = parseInt(supply);
          if (isNaN(totalSupply) || totalSupply <= 0) {
            throw new Error("Total supply must be a positive number");
          }

          const deployments = await deployTokenContract(name, symbol, totalSupply);

          rl.question(\n${colors.yellow}🔄 Do you want to transfer tokens? (y/n): ${colors.reset}, (choice) => {
            if (choice.toLowerCase() === 'y') {
              rl.question(${colors.yellow}📊 Number of transfers per wallet: ${colors.reset}, (numTransfers) => {
                rl.question(${colors.yellow}💸 Amount per transfer: ${colors.reset}, async (amountPerTransfer) => {
                  try {
                    const transfers = parseInt(numTransfers);
                    const amount = parseFloat(amountPerTransfer);

                    if (isNaN(transfers) || transfers <= 0 || isNaN(amount) || amount <= 0) {
                      throw new Error("Transfers and amount must be positive numbers");
                    }

                    await transferTokens(deployments, transfers, amount);
                  } catch (error) {
                    console.error(${colors.red}❌ Error: ${error.message}${colors.reset});
                  } finally {
                    rl.close();
                  }
                });
              });
            } else {
              console.log(${colors.green}✅ Deployment complete. Exiting.${colors.reset});
              rl.close();
            }
          });

        } catch (err) {
          console.error(${colors.red}❌ ${err.message}${colors.reset});
          rl.close();
        }
      });
    });
  });
}

main();
