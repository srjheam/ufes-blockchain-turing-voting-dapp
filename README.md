# Ignite Platform

You may check it out on [Vercel](https://ignite-platform-sand.vercel.app/).

## Built With

* [Hardhat](https://hardhat.org/)
* [Next.js](https://nextjs.org/)
* [Solidity](https://docs.soliditylang.org/)

## Getting Started

1. Clone the repo

    ```bash
    git clone https://github.com/srjheam/ufes-blockchain-turing-voting-dapp.git
    ```

2. Head to the repo directory

    ```bash
    cd ufes-blockchain-turing-voting-dapp/
    ```

3. Install packages

    ```bash
    pnpm i
    ```

5. Start development server and you're done

    ```bash
    pnpm dev
    ```

### Hardhat

1. Compile contracts

    ```bash
    pnpm hardhat compile
    ```

    1.1. Run Wagmi CLI

    ```bash
    pnpm wagmi generate
    ```

2. Run tests

    ```bash
    pnpm hardhat test
    ```

3. Start Hardhat node

    ```bash
    pnpm hardhat node
    ```

4. Set up your environment

    Copy .env.local.example file to .env.local (which will be ignored by Git):
    
    ```bash
    cp .env.local.example .env.local
    ```

5. Deploy contracts

    ```bash
    npx hardhat ignition deploy ./ignition/modules/Turing.ts --network localhost
    ```

6. Update .env file with the deployed contract addresses

    Copy .env.example file to .env (which will be ignored by Git):
    
    ```bash
    cp .env.example .env
    ```

7. Start development server

    ```bash
    pnpm dev
    ```

## License

Licensed under the [MIT License](./LICENSE).
