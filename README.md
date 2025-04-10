Seismic-Juswa-Bot - JUSWA Airdrops
A multi-wallet deployer and token transfer bot for the Seismic platform, with support for deploying custom ERC-20 tokens and transferring them across multiple wallets.

Register
Register here (Seismic Devnet)

🌟 Features
Multi-wallet support (via environment variables)

Deploy custom ERC-20 tokens

Automatic wallet deployment and token creation

Batch token transfers to random addresses

Proxy support (optional)

Easy configuration via CLI

Graceful error handling

👌 Prerequisites
Node.js (v16 or higher)

npm (Node Package Manager)

Ethereum private keys for wallet deployment

Seismic RPC URL for devnet interaction

🛠️ Installation
1. Clone the repository:
```bash
git clone https://github.com/yourusername/seismic-multi-wallet-deployer.git
cd seismic-multi-wallet-deployer
```
2. Install dependencies:
```bash
npm install
```
3. Create a .env file and add your private keys:
```bash
PRIVATE_KEYS=0xYourPrivateKey1,0xYourPrivateKey2
```
📝 Configuration
1.(Optional) Set up proxy support by creating a proxies.txt file:
```bash
nano proxies.txt
```
Example:
```bash
http://user:pass@host:port
socks5://user:pass@host:port
```
2. Ensure the Seismic RPC URL is correctly set in your .env file or directly in the code:
```bash
SEISMIC_RPC_URL=https://node-2.seismicdev.net/rpc
```
🚀 Usage
Run the deployer bot:
```bash
npm run start
```
The bot will prompt you to:

Enter the token name, symbol, and total supply

Choose whether you want to transfer tokens after deployment

Set the number of transfers and amount per transfer

⚙️ Configuration Options
You can modify the following settings in index.js:

-PRIVATE_KEYS: Set your Ethereum private keys for wallet deployment
-SEISMIC_RPC_URL: Set the Seismic devnet RPC URL
-rateLimitConfig: Adjust rate limiting parameters (if any proxies are used)
-numTransfers: Set the number of token transfers per wallet
-amountPerTransfer: Set the amount of tokens per transfer

📛 Support
Join our Telegram channel for updates and support: https://t.me/juswaairdrops

⚠️ Disclaimer
This bot is for educational purposes only. Use at your own risk and ensure compliance with Seismic's terms of service.

🐝 License
MIT License - feel free to use and modify for your own purposes.
