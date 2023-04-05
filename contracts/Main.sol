// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";

contract Main is Ownable {

    // payment token instance
    IERC20 public TOKEN;
    using SafeERC20 for IERC20;

    // Player Info
    struct PlayerInfo {
        // deposited amount
        uint deposited_amount;
        // timestamp when withdraw
        uint last_withdraw_ts;
        uint last_deposit_ts;
    }

    // withdraw reward via server signature / gasless
    mapping(uint => uint) public transactions;

    // check if game is paused
    bool public isGamePaused;
    // useWhitelist
    bool public useWhitelist = false;

    // game version
    uint public game_version = 1;

    // TOKEN amount whenever play game
    // e.g. 1 TOKEN
    uint public deposit_amount = 1 * 10 ** 18;

    // Limit token amount per deposit
    uint public MAX_DEPOSIT_AMOUNT;
    // Limit token amount per withdraw
    uint public MAX_WITHDRAW_AMOUNT;
    // Limit token amount per withdraw
    uint public MIN_WITHDRAW_AMOUNT;

    uint public WITHDRAW_EXPIRATION_SECONDS = 60; // 1 Minute

    // a rate limit so that the game cannot withdraw to a user repeatedly
    uint public PLAYER_WITHDRAW_RATE;

    uint public FEE = 1000; // 10%

    // Admin wallet address (game wallet)
    // Only this wallet will call withdrawToPlayer function
    address public signerAddress;

    // address that receive fees
    address public treasureAddress;

    // address => playerInfo
    mapping(address => PlayerInfo) public players;

    // BlackList for check sanctions
    mapping(address => bool) public blacklist;
    // WhiteList
    mapping(address => bool) public whitelist;

    // Check if game is paused.
    modifier isNotPaused {
        require(isGamePaused == false, "Game paused");
        _;
    }

    // Check if sender is not in blacklist
    modifier notBlacklist {
        if(blacklist[msg.sender])
            revert AddressBlacklisted();
        _;
    }

    // Check game version
    modifier checkVersion (uint _version) {
        if(game_version != _version)
            revert InvalidGameVersion();
        _;
    }

    // Check if sender is in whitelist
    modifier inWhiteList {
        if (useWhitelist == true) {
            if( ! whitelist[msg.sender])
                revert NotWhitelisted();
        }
        _;
    }

    // EVENTs
    event Deposited(address indexed sender, uint amount, uint time);
    event Withdraw(address indexed sender, uint amount, uint time);
    event UpdatedAdmin(address indexed new_admin, uint time);
    event UpdatedMaxWithdrawAmount(uint new_amount, uint time);

    error InvalidAdminAddress();
    error InvalidTreasureAddress();
    error AddressBlacklisted();
    error InvalidGameVersion();
    error NotWhitelisted();
    error DepositExceedLimit();
    error InvalidWithdrawSignature();
    error TxAlreadyProcessed();
    error InsufficientFundsInContract();
    error WithdrawTooFrequent();
    error InvalidPlayerWallet();
    error WithdrawAmountTooHigh();
    error WithdrawAmountTooLow();
    error WithdrawExpired();

    constructor (address _TOKEN, address _admin, address _treasure) {

        if( _admin == address(0x0))
            revert InvalidAdminAddress();

        if( _treasure == address(0x0))
            revert InvalidTreasureAddress();

        TOKEN = IERC20(_TOKEN);
        TOKEN.balanceOf(address(this));

        signerAddress = _admin;
        treasureAddress = _treasure;

        MAX_DEPOSIT_AMOUNT = 10 ether;
        MAX_WITHDRAW_AMOUNT = 1 ether;
        MIN_WITHDRAW_AMOUNT = 0.1 ether;
        // Player can withdraw one time per 6 hours
        PLAYER_WITHDRAW_RATE = 21600;

    }

    function appHashParams(address payTo, uint amount, uint _tx, uint timestamp) public pure returns (bytes32) {
        bytes32 h = sha256(abi.encodePacked(payTo, amount, _tx, timestamp));
        return h;
    }

    function isTxProcessed(uint _tx) public view returns (bool) {
        return (transactions[_tx] != 0);
    }

    function isWithdrawTimestampExpired(uint timestamp) public view returns (bool) {
        return (timestamp < block.timestamp) && ((block.timestamp - timestamp) > WITHDRAW_EXPIRATION_SECONDS);
    }

    function getTimeStamp() public view returns (uint) {
        return block.timestamp;
    }

    // add wallet into blacklist
    function setFee(uint _fee) external onlyOwner {
        FEE = _fee;
    }

    // add wallet into blacklist
    function add_blacklist(address wallet) external onlyOwner {
        require(blacklist[wallet] == false, "Blacklist: Address is already in list");
        blacklist[wallet] = true;
    }

    // remove wallet from blacklist
    function remove_blacklist(address wallet) external onlyOwner {
        require(blacklist[wallet] == true, "Blacklist: Address is not in list");
        blacklist[wallet] = false;
    }

    // add wallet into whitelist
    function add_whitelists(address wallet) external onlyOwner {
        require(whitelist[wallet] == false, "Whitelist: Address is already in list");
        whitelist[wallet] = true;
    }

    // remove wallet from whitelist
    function remove_whitelist(address wallet) external onlyOwner {
        require(whitelist[wallet] == true, "Whitelist: Address is not in list");
        whitelist[wallet] = false;
    }

    /**
      * update the deposit ammount to determine deposit amount for playing game.
      * TOKEN token
      * this should be called by only owner
      */
    function updateDepositAmount(uint _amount) external onlyOwner {
        require(deposit_amount != _amount, "Update: This value has already been set");
        deposit_amount = _amount;
    }

    /**
      * update the max withdrawal token amount to player
      * this should be called by only owner
      */
    function updateMaxWithdrawAmount (uint _amount) external onlyOwner {
        require(MAX_WITHDRAW_AMOUNT != _amount, "Update amount: This value has already been set");
        MAX_WITHDRAW_AMOUNT = _amount;

        emit UpdatedMaxWithdrawAmount(MAX_WITHDRAW_AMOUNT, block.timestamp);
    }

    /**
      * update the max withdrawal token amount to player
      * this should be called by only owner
      */
    function updateMaxDepositAmount (uint _amount) external onlyOwner {
        require(MAX_DEPOSIT_AMOUNT != _amount, "Update amount: This value has already been set");
        MAX_DEPOSIT_AMOUNT = _amount;
    }

    /**
      * update the min withdrawal token amount to player
      * this should be called by only owner
      */
    function updateMinWithdrawAmount (uint _amount) external onlyOwner {
        require(MIN_WITHDRAW_AMOUNT != _amount, "Update amount: This value has already been set");
        MIN_WITHDRAW_AMOUNT = _amount;
    }


    /**
      * update the max withdrawable count to a player
      * this should be called by only owner
      */
    function updatePlayerWithdrawRate (uint _rate) external onlyOwner {
        require(PLAYER_WITHDRAW_RATE != _rate, "Update rate: This value has already been set");
        PLAYER_WITHDRAW_RATE = _rate;
    }


    /**
      * update admin(game) wallet address.
      * this sould be called by only owner
      */
    function updateAdminWallet (address new_wallet) external onlyOwner {
        require(signerAddress != new_wallet, "Update: This wallet address has already been set");
        require( new_wallet != address(0), "invalid signerAddress");
        signerAddress = new_wallet;

        emit UpdatedAdmin(signerAddress, block.timestamp);
    }

    // update game version by only owner
    function updateGameVersion (uint _version) external onlyOwner {
        require(game_version != _version, "Same game version");
        game_version = _version;
    }

    /**
      * make game as pause or not
      * this should be able to call with only owner
      */
    function setGamePaused(bool _paused) onlyOwner external{
        require(isGamePaused == _paused, "Update pause: same state with prev");
        isGamePaused = _paused;
    }

    // For test version or unlikly case, we need to use whitelist or not
    function setWhitelistUsable(bool _state) external onlyOwner{
        require(useWhitelist != _state, "Already set");
        useWhitelist = _state;
    }

    function updateWithdrawExpirationSeconds(uint _seconds) external onlyOwner
    {
        require(WITHDRAW_EXPIRATION_SECONDS != _seconds, "Update Withdraw Expiry: This value has already been set");
        WITHDRAW_EXPIRATION_SECONDS = _seconds;
    }

    // withdraw all BNB from pool
    // In case anyone sent their BNB into pool accidently, we need to send back to him
    function withdrawBNB (uint _amount) external onlyOwner {
        uint balance = address(this).balance;
        require(balance > _amount);
        _withdraw(msg.sender, _amount);
    }

    function _withdraw(address _address, uint _amount) private {
        (bool success, ) = _address.call{value: _amount}("");
        require(success, "Transfer failed.");
    }

    // withdraw all TOKEN from pool
    function withdrawTOKEN(uint _amount) external onlyOwner {
        require(_amount <= TOKEN.balanceOf(address(this)), "Insufficient pool");
        TOKEN.safeTransfer(msg.sender, _amount);
    }



    // Deposit TOKEN Token to play the game

    function deposit(uint amount, uint _version) checkVersion(_version)
    external notBlacklist inWhiteList isNotPaused
    {
        if(amount > MAX_DEPOSIT_AMOUNT)
            revert DepositExceedLimit();

        // first, deposit tokens
        TOKEN.safeTransferFrom(msg.sender, address(this), amount);

        // we emit the deposit event before any fee deduction as fee may vary
        emit Deposited(msg.sender, amount, block.timestamp);

        // now, send the fee, if any
        if( FEE > 0 ){
            uint fee = (amount * FEE) / 10000;
            amount = amount - fee; // deduct the fee
            TOKEN.safeTransfer(treasureAddress, fee);
        }

        PlayerInfo storage player = players[msg.sender];
        player.deposited_amount = player.deposited_amount + amount;
        player.last_deposit_ts = block.timestamp;

    }

    function withdraw(address player_wallet, uint amount, uint _version,
        uint _tx, uint timestamp, uint8 v, bytes32 r, bytes32 s)
    external
    isNotPaused notBlacklist
    checkVersion(_version)
    {

        if(amount > TOKEN.balanceOf(address(this)))
            revert InsufficientFundsInContract();

        // attention: server app must send a unique tx each withdraw
        if(transactions[_tx] > 0)
            revert TxAlreadyProcessed();

        if(player_wallet == address(0x0))
            revert InvalidPlayerWallet();

        if(amount > MAX_WITHDRAW_AMOUNT)
            revert WithdrawAmountTooHigh();

        if( amount < MIN_WITHDRAW_AMOUNT)
            revert WithdrawAmountTooLow();

        if(isWithdrawTimestampExpired(timestamp))
            revert WithdrawExpired();

        // check if we have the signerAddress signature
        bytes32 _hashOfAuthorization = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32",
            appHashParams(player_wallet, amount, _tx, timestamp)
            ));

        if(ECDSA.recover(_hashOfAuthorization, v, r, s) != signerAddress)
            revert InvalidWithdrawSignature();
        // prevent double withdraw, server must send a unique tx to every withdraw

        // mark this tx as spent
        transactions[_tx] = block.timestamp;

        // msg.sender is game wallet
        PlayerInfo memory playerInfo = players[player_wallet];

        if(block.timestamp - playerInfo.last_withdraw_ts < PLAYER_WITHDRAW_RATE)
            revert WithdrawTooFrequent();

        PlayerInfo storage player = players[player_wallet];
        player.last_withdraw_ts = block.timestamp;

        // transfer TOKEN from contract to game player
        TOKEN.safeTransfer(player_wallet, amount);

        emit Withdraw(player_wallet, amount, block.timestamp);

    }
}
