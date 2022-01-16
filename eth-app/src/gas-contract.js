const Web3 = require("web3");
const util = require("util");
const nconf = require("nconf");
const Block = require("./models/block");
require("./db/mongoose");

nconf.use("file", { file: __dirname + "/config/config.json" });
nconf.load();

// Ethereum node service connection
const provider = nconf.get("web3Provider")
const web3Provider = new Web3.providers.HttpProvider(provider);
const web3 = new Web3(web3Provider);

const accountAddress = nconf.get("accountAddress");
const privateKey = nconf.get("accountPrivateKey");
const contractAddress = nconf.get("contractAddress");

const contract = require("./contract/gasReportContract.json");
const { utils } = require("ethers");
const abi = contract.abi;
const MIN_BLOCK_PER_DAY = 6000;

/*
let contract = new web3.eth.Contract(abi, contractAddress, {
    from: accountAddress,
    gasPrice: "20000"
});

contract.methods.owner().call().then(console.log); // get the owner address
contract.methods.updateGas(1, 12345, 6789).send({ from: accountAddress }).then(console.log)
*/

const getTotalGas = async (_date) => {
    console.log("_date: " + _date);
    const startDate = new Date(_date);
    console.log("start_date: " + startDate);
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
    console.log('result:', result)
    if (result) {
        if (result.count < MIN_BLOCK_PER_DAY) {
            console.log("DB does not have all records for the date " + _date);
            return null;
        } else if (result.length == 0) {
            console.log("Record not found for the date " + _date);
            return null;
        } else {
            return result;
        }

    } else {
        throw Error("DB error");
    }

}

// parse input
const inputDate = new Date(process.argv[2]);

getTotalGas(inputDate).then((result) => {
    console.log(result);
}).catch((e) => {
    console.log(e);
})

