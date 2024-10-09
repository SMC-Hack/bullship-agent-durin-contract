# Durin NFT Contracts

These contracts, developed with Unruggable, allow you to issue NFT subnames on an L2 network. Follow the steps below to set up and deploy the contracts.

## Prerequisites

Ensure [Foundry](https://book.getfoundry.sh/) is installed.

## Setup and Deployment

1. **Clone the repository**

   ```shell
   git clone git@github.com:resolverworks/durin-nft-contracts.git
   cd durin-nft-contracts
   ```

2. **Set up environment variables**

   Copy `example.env` to `.env` and update the following values:

   ```env
   # NFTRegistry contract deployment
   RPC_URL=https://your-rpc-url-here
   ETHERSCAN_API_KEY=your-etherscan-api-key
   PRIVATE_KEY=your-private-key-here
   BASE_URI=https://your-base-uri.com/nft/
   ```

- RPC_URL: RPC endpoint for your L2 (e.g., Alchemy or Infura)
- ETHERSCAN_API_KEY: For contract verification (available from your L2's block explorer)
- BASE_URI: URL for your NFT metadata (modifiable later via setBaseURI)

3. **Deploy NFTRegistry contract**

   ```shell
   bash deploy/deployNFTRegistry.sh
   ```

Take note of the deployed contract address.

4. **Update .env for NFTRegistrar deployment**

   Update the following values on your `.env` file:

   ```env
   # NFTRegistrar contract deployment
   REGISTRY_ADDRESS=0x1234567890123456789012345678901234567890
   USD_ORACLE_ADDRESS=0x9876543210987654321098765432109876543210
   MIN_CHARS=1
   MAX_CHARS=42
   MAX_FREE_REGISTRATIONS=7
   MIN_COMMITMENT_AGE=0
   MAX_COMMITMENT_AGE=120
   MIN_REGISTRATION_DURATION=2592000
   MAX_REGISTRATION_DURATION=15552000
   CHAR_AMOUNTS="0 2029426686960 507356671740 126839167935 31709791983"
   ```

   Explanations:

   - `REGISTRY_ADDRESS`: Address of the NFTRegistry contract
   - `USD_ORACLE_ADDRESS`: Oracle address for USD/L2 currency conversion ([Chainlink Data Feeds](https://data.chain.link/feeds))
   - `MIN_CHARS` and `MAX_CHARS`: Minimum and maximum characters allowed for names
   - `MAX_FREE_REGISTRATIONS`: Free name limit per wallet
   - `MIN_COMMITMENT_AGE` and `MAX_COMMITMENT_AGE`: Lockup times (in seconds) to prevent multiple claims on the same name. The defaults are ok if you are unsure.
   - `MIN_REGISTRATION_DURATION` and `MAX_REGISTRATION_DURATION`: Minimum and maximum duration a wallet can own a name (in seconds)
   - `CHAR_AMOUNTS`: Pricing for names by length (in USD/second, 18 decimal precision). See the Notes at the bottom of the page for an in depth explanation.

Note: Except for commitment ages, these parameters can be modified later via the contract.

5. **Deploy NFTRegistrar contract**

   ```shell
   bash deploy/deployNFTRegistrar.sh
   ```

   Note the deployed contract address.

6. **Grant permissions to NFTRegistrar**

   Update the Registrar address in your `.env`:

   ```env
   REGISTRAR_ADDRESS=0x1234567890123456789012345678901234567890
   ```

   Then run:

   ```shell
   bash deploy/grantPermission.sh
   ```

This grants the Registrar the ability to mint names on the Registry.

7. **Connect base name to resolver and registry**

(Instructions coming soon)

## Usage

You can now mint names via the Registrar. Check out our example frontend or build your own.

## Notes

### CHAR_AMOUNTS Calculation

CHAR_AMOUNTS defines the price for different name lengths in USD per second, with 18 decimal precision.

Steps:

Set the yearly price in USD for each name length.
Convert it to a per-second price.
Multiply by 10^18 for precision.
Example for 1-character names:

Yearly price: $1
Per-second price: $1 / (365 _ 24 _ 60 _ 60) ≈ $0.0000000317098
18 decimal precision: 0.0000000317098 _ 10^18 = 31709791983
The array in this example corresponds to:

0-character names: free
1-character names: $1/year = 2029426686960
2-character names: $4/year = 507356671740
3-character names: $16/year = 126839167935
4-character names: $64/year = 31709791983
Adjust the values to fit your pricing structure.
