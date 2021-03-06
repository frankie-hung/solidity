import React, { Component } from "react";
import ItemManagerContract from "./contracts/ItemManager.json";
import ItemContract from "./contracts/Item.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = { loaded:false, cost:0, itemName: "exampleItem1" };


  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();
      console.log (this.web3);

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();
      console.log(this.accounts)

      // Get the contract instance.
      const networkId = await this.web3.eth.net.getId();
      console.log (networkId);
      
      this.itemManager  = new this.web3.eth.Contract(
        ItemManagerContract.abi,
        ItemManagerContract.networks[networkId] && ItemManagerContract.networks[networkId].address,
      );

      console.log ("item manager contract address: ", ItemManagerContract.networks[networkId] && ItemManagerContract.networks[networkId].address);

      this.item  = new this.web3.eth.Contract(
        ItemContract.abi,
        ItemContract.networks[networkId] && ItemContract.networks[networkId].address,
      );


      //console.log ("item contract address: ", ItemContract.networks[networkId] && ItemContract.networks[networkId].address);


      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.listenToPaymentEvent();
      this.setState({ loaded:true });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

 listenToPaymentEvent = () => {
   let self = this;
   this.itemManager.events.SupplyChainStep().on("data", async function(evt){
      if(evt.returnValues._step == 1){
        let itemObj = await self.itemManager.methods.items(evt.returnValues._itemIndex).call();
        alert("item " + itemObj._identifier + " was paid, deliver it now!");
        console.log(itemObj);
      }

      console.log(evt);
   })
 }


  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked: target.value;
    const name = target.name;
    this.setState({
        [name]: value
    });
  }

  handleSubmit = async() => {
    const { cost, itemName } = this.state;
    console.log(itemName, cost, this.itemManager);
    let result = await this.itemManager.methods.createItem(itemName, cost).send({ from:
    this.accounts[0] });
    console.log(result);
    alert("Send "+cost+" Wei to "+result.events.SupplyChainStep.returnValues._itemAddress);
  }


  render() {
    if (!this.state.loaded) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Event Trigger / Supply Chain Example</h1>
        <h2>Items</h2>

        <h2>Add Items</h2>
        Cost in Wei: <input type="text" name="cost" value={this.state.cost} onChange={this.handleInputChange} />
        Item Identifier: <input type="text" name="itemName" value={this.state.itemName} onChange={this.handleInputChange} />
        <button type="button" onClick={this.handleSubmit}>Create new Item</button>

        <div>The stored value is: {this.state.storageValue}</div>
      </div>
    );
  }
}

export default App;
