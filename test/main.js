const {expect} = require("chai");
const {ethers} = require("hardhat");
const hre = require("hardhat");
let dev, user, none, devAddress, userAddress, treasureAddress, wallet;
const util = require('ethereumjs-util')
const {getCurrentTimestamp} = require("hardhat/internal/hardhat-network/provider/utils/getCurrentTimestamp");
const Web3 = require('web3');
async function timestamp() {
    return (await hre.ethers.provider.getBlock("latest")).timestamp;
}

describe("main", function () {
    it("direct contract test", async function () {
        const web3 = new Web3('http://localhost:8545');
        [dev, user, treasure] = await ethers.getSigners();
        devAddress = dev.address
        userAddress = user.address
        treasureAddress = treasure.address
        wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY);

        const [_dev, _user] = await ethers.getSigners();
        let DEV = _dev.address, USER1 = _user.address;

        const _token = await ethers.getContractFactory("Token");
        const _main = await ethers.getContractFactory("Main");

        const token = await _token.deploy('token', 'token');
        await token.deployed();

        const main = await _main.deploy(token.address, devAddress, treasureAddress);
        await main.deployed();

        const transaction = '1';

        const deposit_amount = (await main.deposit_amount()).toString();
        const version = (await main.game_version()).toString();

        await token.approve(main.address, deposit_amount);
        await token.mint(devAddress, deposit_amount);
        await main.deposit(deposit_amount, version);

        const playerInfo = await main.players(devAddress);
        const withdrawAmount = playerInfo.deposited_amount.toString();
        const ts = await timestamp();
        const hashParams = await main.appHashParams(devAddress, withdrawAmount, transaction, ts);
        const signerAddress = (await main.signerAddress());
        expect(signerAddress).to.be.eq(wallet.address);
        // const signature = await wallet.signMessage(hashParams);
        const signature = await web3.eth.sign(hashParams, devAddress);
        const {v, r, s} = ethers.utils.splitSignature(signature);

        await main.withdraw(devAddress, withdrawAmount, version, transaction, ts, v, r, s);

        const balanceOfContract = (await token.balanceOf(main.address)).toString();
        const balanceOfUser = (await token.balanceOf(devAddress)).toString();

        expect(balanceOfContract).to.be.eq('0')
        expect(balanceOfUser).to.be.eq(withdrawAmount)

    });
});
