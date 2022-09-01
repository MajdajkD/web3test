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
    web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: false,
      disableInjectedProvider: false,
      providerOptions: this.providerOptions
    });
    web3Modal.clearCachedProvider();
    console.log("Web3Modal instance is", web3Modal);
    return true;
  },

  SetupWeb3Provider: async function () {
    console.log("Opening a dialog");
    try {
      provider = await web3Modal.connect();

      // Subscribe to accounts change
      provider.on("accountsChanged", (accounts) => {
        console.log(accounts);
        DotNet.invokeMethodAsync('Web3Providers', 'SelectedAccountChanged', accounts[0]);
      });

      // Subscribe to chainId change
      provider.on("chainChanged", (chainId) => {
        console.log(chainId);
        DotNet.invokeMethodAsync('Web3Providers', 'SelectedNetworkChanged', chainId);
      });

      // Subscribe to provider connection
      provider.on("connect", (info) => {
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
  }
};