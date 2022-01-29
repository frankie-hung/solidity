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

const contractAddress = process.env.contractAddress;
const accountAddress = process.env.accountAddress;
const privateKey = process.env.privateKey;
const apiKey = process.env.AlchemyAPIKey;

const contract = require("./contract/gasReportContract.json");

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
            console.log("Calling smart contract updateGas function with params", timestamp, result.total_gas, result.total_block);
            const tx = await gasReportContract.updateGas(timestamp, result.total_gas, result.total_block);
            await tx.wait();
            console.log("Transaction completed.");
        }

    } else {
        console.log("Value already exists in smart contract. Update aborted.");
    }

}

// get total gas and block count from DB
// if success, return {total_gas, total_block}
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
            "total_gas": { "$sum": "$gasUsed" },
            "min_height": { "$min": "$height" },
            "max_height": { "$max": "$height" }
        }
    }]);
    //console.log('result:', result)
    if (result) {
        if (result.length == 0) {
            console.log("Record not found for the date", _date);
            return null;
        } else {
            const { min_height, max_height } = result[0];
            const min_block = await Block.findOne({ height: min_height });
            const max_block = await Block.findOne({ height: max_height });
            const min_block_td = (min_block.timestamp - startDate) / 1000; // time difference between start date 00:00 and first block timestamp (in sec)
            const max_block_td = (endDate - max_block.timestamp) / 1000; //time difference between end date 00:00 and the last block timestamp (in sec)

            if (min_block_td > 60 || max_block_td > 60) { // check if the DB has all blocks required for the day; assume block time is less than 15 sec
                console.log("DB does not have all records for the date", _date);
                return null;
            } else {
                return {
                    total_gas: result[0].total_gas,
                    total_block: result[0].total_count
                };          
            }
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


