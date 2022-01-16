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

const contract = require("./contract/gasReportContract.json");

const abi = contract.abi;
const MIN_BLOCK_PER_DAY = 6000;

const updateContract = async () => {

    // Using HTTPS
    const web3 = createAlchemyWeb3(process.env.AlchemyProvider);
  
    // Alchemy Provider
    const alchemyProvider = new ethers.providers.AlchemyProvider(network = "rinkeby", "B21Bb7zEchGknjjByOos-Ak5ilRE-do9");
    const signer = new ethers.Wallet(privateKey, alchemyProvider);
    console.log(alchemyProvider);
    const gasReportContract = new ethers.Contract(contractAddress, abi, signer);

    const owner = await gasReportContract.owner();
    console.log("Owner: " + owner);

    // console.log("Calling updateGas function...");
    // const tx = await gasReportContract.updateGas(1, 1000, 2000);
    // await tx.wait();
    // console.log("Done");

}

updateContract();


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
// const inputDate = new Date(process.argv[2]);
// if (isNaN(inputDate)) {
//     console.log("Invalid date! Please use the format YYYY-MM-DD"); 
//     exit(1);
// }

// getTotalGas(inputDate).then((result) => {
//     console.log(result);
// }).catch((e) => {
//     console.log(e);
// })

