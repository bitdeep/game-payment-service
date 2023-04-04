const hre = require("hardhat");

async function main() {

    const GamePayment = await hre.ethers.getContractFactory("GamePayment");
    const Token = await hre.ethers.getContractFactory("Token");

    const [DEV] = await ethers.getSigners();
    let signerAddress = DEV.address.toLowerCase();
    let treasure = DEV.address.toLowerCase();
    let tokenAddress;

    const network = await hre.ethers.provider.getNetwork();
    const chainId = network.chainId;
    const mainnet = chainId === 56;

    if (mainnet) {
        signerAddress = undefined;
        treasure = undefined;
        tokenAddress = undefined;
    } else {
        const token = await Token.deploy("test", "test");
        await token.deployed();
        tokenAddress = token.address;
    }

    const main = await GamePayment.deploy(tokenAddress, signerAddress, treasure);
    await main.deployed();

    const contractAddress = main.address;

    console.log(`
    - tokenAddress ${tokenAddress}
    - contractAddress ${contractAddress}
    - signerAddress ${signerAddress}
    - treasure ${treasure}
    `);

    const verifyArgs = [tokenAddress, signerAddress, treasure];
    await hre.run("verify:verify", {
        address: contractAddress, constructorArguments: verifyArgs,
    });
    await hre.run("verify:verify", {
        address: tokenAddress, constructorArguments: ["test", "test"],
    });


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
