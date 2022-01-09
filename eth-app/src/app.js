const Web3 = require("web3");
const nconf = require("nconf");
const Block = require("./models/block");
require("./db/mongoose");

nconf.use("file", { file: "./config/config.json" });
nconf.load();
const BATCH_SIZE = nconf.get("batchSize");

// Ethereum node service connection
//const provider = "https://mainnet.infura.io/v3/849e286604eb4c98a043c93a5545e738";
const provider = nconf.get("web3Provider")
const web3Provider = new Web3.providers.HttpProvider(provider);
const web3 = new Web3(web3Provider);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Fetch a block and save to DB
const saveBlock = async (blockNum) => {
    const result = await web3.eth.getBlock(blockNum);
    if (!result) throw Error("Failed to fetch block " + blockNum);

    const isExist = await Block.exists({ height: result.number });
    if (isExist) {
        // console.log("Block", result.number, "already exists in DB");
        return result;
    }

    const block = new Block({
        height: result.number,
        txns: result.transactions,
        gasUsed: result.gasUsed,
        timestamp: new Date(result.timestamp * 1000),
    });

    block.save()
        .then(() => {
            // console.log("Block", block.height, "saved to DB")
            return result;
        })
        .catch((e) => {
            throw Error("Failed to write to DB", e)
        });
};

// const saveBlock = (blockNum) => {
const init_block = nconf.get("savedBlock") // get the last succesfully saved block from config file

// fetch new blocks and save them to DB
// support concurrent processes up to BATCH_SIZE
// upon 100% update success of a batch, write the last saved block number to config file
const saveNewBlocks = async () => {
    const latestBlock = await web3.eth.getBlockNumber();
    if (!latestBlock) throw Error("Web3 provider error!");
    console.log("Latest block:", latestBlock);
    nconf.set("latestBlock", latestBlock);

    const newBlocks = latestBlock - init_block;
    console.log("Number of new blocks pending to save:", newBlocks);

    var counter = 0;
    var totalBlockSaved = 0;
    var results = [];
    var i = init_block + 1;
    var j;

    while (i <= latestBlock) {
        counter = 0;
        for (; i <= latestBlock && counter < BATCH_SIZE; i++) {
            //await saveBlock(i)
            results.push(saveBlock(i));
            totalBlockSaved++;
            counter++;
        }
        const allResults = await Promise.all(results);
        if (allResults) {
            nconf.set("savedBlock", i - 1);
            console.log("Saved", totalBlockSaved + "/" + newBlocks , "blocks. Last saved block:", i - 1, (totalBlockSaved * 100 / newBlocks).toFixed(1) + "% complete.");
        }

        // Save the configuration object to disk
        nconf.save(function (err) {
            if (err) {
                console.error(err.message);
                return;
            }
            //console.log("Configuration saved successfully.");
        });
        //await sleep(1000);
    }
};

let startTime = Date.now();
console.log("begin");
//saveBlock(13970702).then(()=>console.log('success'))
saveNewBlocks().then(() => {
    let finishTime = Date.now();
    let timeTaken = finishTime - startTime;
    console.log("Time taken in milliseconds: " + timeTaken);
});

