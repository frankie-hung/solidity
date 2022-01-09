const Web3 = require("web3");
const nconf = require("nconf");
const Block = require("./models/block");
require("./db/mongoose");

const BATCH_SIZE = 10;

nconf.use("file", { file: "./config/config.json" });
nconf.load();
nconf.set("batchSize", 100);
nconf.set("initBlock", 13970703);

//console.log(nconf.get('dessert'));

// Ethereum node service connection
const provider =
    "https://mainnet.infura.io/v3/849e286604eb4c98a043c93a5545e738";
const web3Provider = new Web3.providers.HttpProvider(provider);
const web3 = new Web3(web3Provider);

// Fetch a block and save to DB
const saveBlock = async (blockNum) => {
    const result = await web3.eth.getBlock(blockNum);
    if (!result) throw Error("Failed to fetch block " + blockNum);

    const isExist = await Block.exists({ height: result.number });
    if (isExist) {
        console.log("Block", result.number, "already exists in DB");
        return result;
    }

    const block = new Block({
        height: result.number,
        txns: result.transactions,
        gasUsed: result.gasUsed,
        timestamp: new Date(result.timestamp * 1000),
    });

    block
        .save()
        .then(() => {
            console.log("Block", block.height, "saved to DB");
            return result;
        })
        .catch((e) => {
            throw Error("Failed to write to DB", e);
        });
};

// const saveBlock = (blockNum) => {
const init_block = 13970703;

// fetch new blocks and save them to DB
const saveNewBlocks = async () => {
    const latestBlock = await web3.eth.getBlockNumber();
    console.log("Latest block: " + latestBlock);

    newBlocks = latestBlock - init_block;
    console.log("Number of new blocks to save: " + newBlocks);

    var counter = 0;
    var results = [];
    var i;

    for (i = init_block + 1; i <= latestBlock; i++) {
        //await saveBlock(i)
        results.push(saveBlock(i));
        if (counter >= BATCH_SIZE) {
            console.log("Batch size reached");
            // update lastProcessedBlock in DB
            break;
        }
        counter++;
        console.log("Saving block", i);
    }
    const allResults = await Promise.all(results);
    if (allResults) {
        nconf.set("savedBlock", i + results.length);
        console.log("Saved block", i + results.length);
    }

    //
    // Save the configuration object to disk
    //
    nconf.save(function (err) {
        if (err) {
            console.error(err.message);
            return;
        }
        console.log("Configuration saved successfully.");
    });

    //   nconf.save(function (err) {
    //     fs.readFile('path/to/your/config.json', function (err, data) {
    //       console.dir(JSON.parse(data.toString()))
    //     });
    //   });

    return allResults;
};

let startTime = Date.now();
console.log("begin");
//saveBlock(13970702).then(()=>console.log('success'))
saveNewBlocks().then(() => {
    console.log("finish");
    let finishTime = Date.now();
    let timeTaken = finishTime - startTime;
    console.log("Time taken in milliseconds: " + timeTaken);
});

// async function timeTest() {
//     const timeoutPromiseResolve1 = timeoutPromiseResolve(5000);
//     const timeoutPromiseReject2 = timeoutPromiseReject(2000);
//     const timeoutPromiseResolve3 = timeoutPromiseResolve(3000);

//     const results = await Promise.all([timeoutPromiseResolve1, timeoutPromiseReject2, timeoutPromiseResolve3]);
//     return results;
// }

// web3.eth.getBlock('latest').then((obj) => {
// //    console.log(obj)
//     const block = new Block({
//         height: obj.number,
//         txns: obj.transactions,
//         gasUsed: obj.gasUsed,
//         timestamp: new Date(obj.timestamp * 1000)
//     })
//     block.save().then(() => {
//         console.log('Block', block.height, 'saved to DB')
//     }).catch((err) => {
//         console.log('Error: ', err)
//     })
// })

//console.log(Date.now())
//1641722493513
//1641722295

// timestamp
// var d = new Date(timestamp)

//let block = web3.eth.getBlock('latest');
//console.log(block.gasUsed);
