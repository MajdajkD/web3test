const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;

var web3Modal = null;
var provider = null;

async function sendWeb3Request(message) {
  if (provider == null) {
    return null;
  }

  try {
    var response = await provider.request(message);
    return response;
  }
  catch (e) {
    return e;
  }
}

window.NethereumWeb3Interop =
{
  web3Modal: window.Web3Modal.default,
  provider: null,
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        // Mikko's test key - don't copy as your mileage may vary
        infuraId: "8043bb2cf99347b1bfadfb233c5325c0",
      }
    },
    //fortmatic: {
    //  package: Fortmatic,
    //  options: {
    //    // Mikko's TESTNET api key
    //    key: "pk_test_391E26A3B43A3350"
    //  }
    //}
  },

  SetupWeb3: async function () {
    /*    setTimeout(() => { //need to wait some time because of metamask warmup bug*/
    web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: false,
      disableInjectedProvider: false,
      providerOptions: this.providerOptions
    });
    web3Modal.clearCachedProvider();
    console.log("Web3Modal instance is", web3Modal);
    //}, 3000);
    return true;
  },

  SetupWeb3Provider: async function () {
    console.log("Opening a dialog");
    try {
      provider = await web3Modal.connect();

      // Subscribe to accounts change
      provider.on("accountsChanged", (accounts) => {
        console.log(accounts);
        DotNet.invokeMethodAsync('MosaicPlatform.Web.Web3Integration', 'SelectedAccountChanged', accounts[0]);
      });

      // Subscribe to chainId change
      provider.on("chainChanged", (chainId) => {
        console.log(chainId);
        DotNet.invokeMethodAsync('MosaicPlatform.Web.Web3Integration', 'SelectedNetworkChanged', chainId);
      });

      // Subscribe to provider connection
      provider.on("connect", (info) => {
        console.log("Connect: ");
        console.log(info);
      });

      // Subscribe to provider disconnection
      provider.on("disconnect", (error) => {
        console.log(error);
      });

      console.log("Done.")
      return true;
    }
    catch (e) {
      console.log("Could not get a wallet connection", e);
      return false;
    }
  },

  GetAccount: async function () {
    var accounts = await sendWeb3Request({ method: 'eth_accounts' })
    console.log("Current account: ", accounts[0]);
    return accounts[0];
  },

  GetNetwork: async function () {
    return provider.chainId;
  },

  Sign: async (message) => {
    try {
      const response = await provider.request(
        {
          method: 'personal_sign',
          params: [message, provider.selectedAddress]
        }
      );
      return response;
    } catch (e) {
      console.log("Could not get signature", e);
      return null;
    }
  },

  SwitchChain: async (chainId, rpc) => {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainId }],
      });
      return true;
    } catch (e) {
      if (error.code === 4902) { //chain is not in provider yet
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: chainId, rpcUrl: rpc }],
          });
          return true;
        } catch (e) {
          console.log("Could not add new chain", e);
          return false;
        }
      }
      console.log("Could not switch chain", e);
      return false;
    }
  },

  WatchAsset: async (type, address, symbol, decimals, image) => {
    try {
      await provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: type,
          options: {
            address: address,
            symbol: symbol,
            decimals: decimals,
            image: image,
          },
        },
      });
      return true;
    } catch (e) {
      console.log("Could not add asset", e);
      return false;
    }
  },

  Request: async (message) => {
    let parsedMessage = JSON.parse(message);
    try {     
      parsedMessage.params[0].gas = null;
      parsedMessage.params[0].gasPrice = null;
      console.log("Sending message", parsedMessage);
      const response = await provider.request(parsedMessage);
      let rpcResonse = {
        jsonrpc: "2.0",
        result: response,
        id: parsedMessage.id,
        error: null
      }
      console.log(rpcResonse);

      return JSON.stringify(rpcResonse);
    } catch (e) {
      let rpcResonseError = {
        jsonrpc: "2.0",
        id: parsedMessage.id,
        error: {
          message: e.data?.message ?? e.message,
        }
      }
      return JSON.stringify(rpcResonseError);
    }
  },
};