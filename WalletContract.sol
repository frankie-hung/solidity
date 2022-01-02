// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.1;

contract WalletContract {

    address payable public owner;
    mapping (address=>uint) public allowance;
    mapping (address=>uint) public totalWithdrawAmt;

    constructor(){
        owner = payable(msg.sender);
    }

    function deposit() public payable{

    }

    function withdraw(address payable receivingAcct, uint amount) public {
        if (msg.sender != owner){
            require(amount +  totalWithdrawAmt[receivingAcct] <= allowance[receivingAcct], "Transfer denied! Ask owner to increase allowance.");
        }
        require(amount <= this.getBalance(), "Insufficient funds!");
        receivingAcct.transfer(amount);
        totalWithdrawAmt[receivingAcct] += amount;
    }

    function setAllowance(address acct, uint amount) public {
        require(msg.sender == owner, "You are not owner!");
        allowance[acct] = amount;
    }

    function getBalance() public view returns(uint){
        return address(this).balance;
    }

    // fallback function to accept funds to contract account
    receive() external payable {
        deposit();
    }

}
