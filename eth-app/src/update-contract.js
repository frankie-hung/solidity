const Web3 = require("web3");
const util = require("util");
const nconf = require("nconf");
const dotenv = require("dotenv");
const Block = require("./models/block");
const ethers = require("ethers");
require("./db/mongoose");

nconf.use("file", { file: __dirname + "/config/config.json" });
nconf.load();
dotenv.config();


const providerURL = process.env.web3Provider;
//const web3Provider = new Web3.providers.HttpProvider(provider);

const contractAddress = process.env.contractAddress;
const accountAddress = process.env.accountAddress;
const privateKey = process.env.privateKey;
const apiKey = process.env.AlchemyAPIKey;

const contract = require("./contract/gasReportContract.json");
const MIN_BLOCK_PER_DAY = 6000;

const updateContract = async (_date) => {

    // Alchemy Provider
    const alchemyProvider = new ethers.providers.AlchemyProvider(network = "rinkeby", apiKey);
    const signer = new ethers.Wallet(privateKey, alchemyProvider);
    const gasReportContract = new ethers.Contract(contractAddress, contract.abi, signer);

    const timestamp = Date.parse(_date) / 1000;
    console.log("Prepared to update for the date ", _date, "timestamp", timestamp);
    const totalBlock = await gasReportContract.totalBlock(timestamp);

    if (totalBlock == 0) {
        // update contract with totalGas and totalBlock
        const result = await getTotalGas(_date);

        if (result) {
            console.log(result);
            console.log("Calling smart contract updateGas function with params", timestamp, result.total_gas, result.total_count);
            const tx = await gasReportContract.updateGas(timestamp, result.total_gas, result.total_count);
            await tx.wait();
            console.log("Transaction completed.");
        }

    } else {
        console.log("Value already exists in smart contract. Update aborted.");
    }

}

// get total gas and block count from DB
// if success, return {total_count, total_gas}
const getTotalGas = async (_date) => {

    const startDate = _date;
    if (!util.types.isDate(startDate)) throw Error("Invalid Date!", _date);

    const endDate = new Date(+startDate);
    endDate.setDate(startDate.getUTCDate() + 1);

    const result = await Block.aggregate([{
        "$match": {
            "timestamp": {
                "$gte": startDate,
                "$lt": endDate
            }
        }
    }, {
        "$group": {
            "_id": null,
            "total_count": { "$sum": 1 },
            "total_gas": { "$sum": "$gasUsed" }
        }
    }]);
    //console.log('result:', result)
    if (result) {
        if (result.count < MIN_BLOCK_PER_DAY) {
            console.log("DB does not have all records for the date " + _date);
            return null;
        } else if (result.length == 0) {
            console.log("Record not found for the date " + _date);
            return null;
        } else {
            return result[0];
        }
    } else {
        throw Error("DB error");
    }

}

// parse input argument as date
const inputDate = new Date(process.argv[2]);
if (isNaN(inputDate)) {
    console.log("Invalid date! Please use the format YYYY-MM-DD");
    process.exit(1);
}

updateContract(inputDate);


