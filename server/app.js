'use strict'
const web3 = require('Web3')
const { v4: uuidv4 } = require('uuid');
const fs = require("fs");
const {ethers} = require("ethers");

module.exports = {
    init: init
};

const abi = JSON.parse(fs.readFileSync("./abi.js", "utf8"));
const ctx = new web3.eth.Contract(abi, process.env.CONTRACT);

function init(http) {
    // we setup our default signing key
    const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    // endpoint that sign withdraw, warning: must be protected
    http.get('/api/v1/sign/:wallet/:value', sign);
}

function sign(req, res) {
    const wallet = req.params.wallet;
    const value = req.params.value;
    if( ! isWithdrawAllowed(wallet, value) )
        return res.json({error: "not allowed"});

    // generate an uuid from  your database/backend
    const transaction = uuidv4();

    // sign the request
    const signature = rcrecover(wallet, value, transaction);

    // construct the response to your ui
    const response = {
        v: signature.v,
        r: signature.r,
        s: signature.s,
        signature: signature,
        wallet: wallet,
        value: value
    }
    res.json(response);
}

function isWithdrawAllowed(wallet, value ){
    // here do your database withdraw debit and allowance here
    console.log('allowed by database query', wallet, value);
    return true;
}

async function rcrecover(wallet, value, transaction){
    const hashParams = await ctx.hashParams(wallet, value, transaction);
    const signature = await web3.eth.sign(hashParams, web3.eth.defaultAccount);
    const { v, r, s } = ethers.utils.splitSignature(signature);

}
