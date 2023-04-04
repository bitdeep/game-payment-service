const hre = require("hardhat");

async function main() {

    const signerAddress = '0x78b3ec25d285f7a9eca8da8eb6b20be4d5d70e84';
    const treasure = '0x78b3ec25d285f7a9eca8da8eb6b20be4d5d70e84';
    const tokenAddress = '0xd9308e74aA62a9c5c14E66B0BF5c4a560F683C39';
    const contractAddress = '0x9607aC5221B91105C29FAff5E282B8Af081B0063';

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
