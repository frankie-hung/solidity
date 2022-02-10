const assert = require('assert')
const ganache = require('ganache-cli')
const Web3 = require('web3')
const web3 = new Web3(ganache.provider());
const { interface, bytecode } = require('../compile')

let lottery;
let accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: bytecode })
        .send({ from: accounts[0], gas: '1000000' })
})

describe('Lottery Contract', () => {
    it('deploy a contract', () => {
        assert.ok(lottery.options.address)
    })

    it('allow one account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        })

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(accounts[0], players[0])
        assert.equal(1, players.length)
    })

    it('allow multiple accounts to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        })

        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.02', 'ether')
        })

        await lottery.methods.enter().send({
            from: accounts[3],
            value: web3.utils.toWei('0.02', 'ether')
        })

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(players[0], accounts[0])
        assert.equal(players[1], accounts[2])
        assert.equal(players[2], accounts[3])
        assert.equal(players.length, 3)
    })

    it('requires a min amount of ether to enter (negative)', async () => {
        let executed
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: web3.utils.toWei('0.0001', 'ether')
            })
            executed = 'success'
        } catch (err) {
            executed = 'fail'
        }

        assert.equal('fail', executed)
    })

    it('only manager can call pickWinner', async () => {
        let executed
        try {
            // At least one person must enter the lottery else pickWinner will fail
            // even if invoked by the manager and this test will pass
            // because the error will be caught by the catch block.
            await lottery.methods.enter().send({
                from: accounts[1],
                value: web3.utils.toWei('0.02', 'ether')
            });

            await lottery.methods.pickWinner().send({
                from: accounts[1]
            });

            executed = 'success'
        } catch (err) {
            executed = 'fail'
        }

        assert.equal('fail', executed)
    })

    it('send money to winner and reset players', async () => {
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('2', 'ether')
        });

        const initialBalance = await web3.eth.getBalance(accounts[1])

        await lottery.methods.pickWinner().send({
            from: accounts[0]
        });
        
        const finalBalance = await web3.eth.getBalance(accounts[1])
        const diff = finalBalance - initialBalance

        assert.equal(diff, web3.utils.toWei('2', 'ether'))

    })

})

