// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.1;

contract GasReportContract {

    address payable public owner;
    
    // the key of the variables below is a timestamp representing a date
    mapping (uint=>uint) public totalGas;
    mapping (uint=>uint) public totalBlock;

    constructor(){
        owner = payable(msg.sender);
    }

    function updateGas(uint _date, uint _totalGas, uint _totalBlock) public {
        require(msg.sender == owner, "You are not owner!");
        totalGas[_date] = _totalGas;
        totalBlock[_date] = _totalBlock;
    }
}