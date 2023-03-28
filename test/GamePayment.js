const BigNumber = require('bignumber.js');
require('dotenv').config()
const {time} = require("@nomicfoundation/hardhat-network-helpers");
const {expect} = require("chai");
const hre = require("hardhat");
const minGas = '150000';
async function timeIncreaseTo(seconds) {
  await time.increaseTo(seconds);
}

function toWei(v) {
  return ethers.utils.parseUnits(v, 'ether').toString();
}

function fromWei(v) {
  return ethers.utils.formatUnits(v, 'ether').toString();
}

async function balanceOf(address) {
  return (await ethers.provider.getBalance(address)).toString();
}

async function deploy(chainId, startMintId, maxMintId, mintPrice) {
  const [DEV, A, B, C] = await ethers.getSigners();
  const Main = await ethers.getContractFactory("GamePayment");
  const main = await Main.deploy(
      minGas,
      endpoint.address,
      startMintId,
      maxMintId,
      startDate,
      endDate,
      tree.root,
      toWei(mintPrice),
      '0x0000000000000000000000000000000000000001'
  );
  return {DEV, A, B, C, main, TREE, endpoint}
}

describe("GamePayment", function () {
  describe("Security", function () {
    it("whitelisted security checks", async function () {
      this.timeout(640000);
      const network = await hre.ethers.provider.getNetwork();
      const {DEV, A, B, C, main, TREE} = await deploy(network.chainId, '1', '2', '0.05');
    });
  });
});
