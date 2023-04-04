const {expect} = require("chai");
const {ethers} = require("hardhat");
const hre = require("hardhat");
let dev, user, none, devAddress, userAddress, noneAddress;
const util = require('ethereumjs-util')
describe("main", function () {
  it("main test", async function () {
    [dev, user, none] = await ethers.getSigners();
    devAddress = dev.address,
        userAddress = user.address,
        noneAddress = none.address;

    const [_dev, _user] = await ethers.getSigners();
    let DEV = _dev.address, USER1 = _user.address;

    const _Token = await ethers.getContractFactory("Token");
    const _main = await ethers.getContractFactory("main");

    const Token = await _Token.deploy('token','token');
    await Token.deployed();

    const main = await _main.deploy(Token.address);
    await main.deployed();

    await Token.mint(main.address,'100');

    const payTo = devAddress;
    const value = '1';
    const transaction = '1';
    const hashParams = await main.hashParams(payTo, value, transaction);
    const signature = await web3.eth.sign(hashParams, payTo);
    const { v, r, s } = ethers.utils.splitSignature(signature);
    await main.withdraw(value, transaction, v, r, s);

    const balanceOfContract = (await Token.balanceOf(main.address)).toString();
    const balanceOfUser = (await Token.balanceOf(payTo)).toString();

    expect(balanceOfContract).to.be.eq('99')
    expect(balanceOfUser).to.be.eq('1')

  });
});
