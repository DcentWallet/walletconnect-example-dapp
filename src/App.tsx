import * as React from "react";
import styled from "styled-components";
import WalletConnect from "@strusth/client";
import QRCodeModal from "@strusth/qrcode-modal"
import { convertUtf8ToHex } from "@walletconnect/utils";
import { IInternalEvent, } from "@walletconnect/types";
// IPushServerOptions
import Button from "./components/Button";
import Column from "./components/Column";
import Wrapper from "./components/Wrapper";
import Modal from "./components/Modal";
import Header from "./components/Header";
import Loader from "./components/Loader";
import { fonts } from "./styles";
import { apiGetAccountAssets, apiGetGasPrices } from "./helpers/api"; // apiGetAccountNonce
import {
  sanitizeHex,
  verifySignature,
  hashTypedDataMessage,
  hashMessage,
} from "./helpers/utilities";
import { convertAmountToRawNumber, convertStringToHex } from "./helpers/bignumber";
import { IAssetData } from "./helpers/types";
import Banner from "./components/Banner";
import AccountAssets from "./components/AccountAssets";
import { eip712 } from "./helpers/eip712";
import { apiGetAccounts, apiGetBalance, apiGetBlockNumber, apiGetGasPrice, apiGetNonce, apiGetTransactionCount } from './helpers/web3_utils'
import { getAccounts, getBalance, getProviderGasPrice } from "./helpers/ethers_utils";
const SLayout = styled.div`
  position: relative;
  width: 100%;
  /* height: 100%; */
  min-height: 100vh;
  text-align: center;
`;

const SContent = styled(Wrapper as any)`
  width: 100%;
  height: 100%;
  padding: 0 16px;
`;

const SLanding = styled(Column as any)`
  height: 600px;
`;

const SButtonContainer = styled(Column as any)`
  width: 250px;
  margin: 50px 0;
`;

const SConnectButton = styled(Button as any)`
  border-radius: 8px;
  font-size: ${fonts.size.medium};
  height: 44px;
  width: 100%;
  margin: 12px 0;
`;

const SContainer = styled.div`
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  word-break: break-word;
`;

const SModalContainer = styled.div`
  width: 100%;
  position: relative;
  word-wrap: break-word;
`;

const SModalTitle = styled.div`
  margin: 1em 0;
  font-size: 20px;
  font-weight: 700;
`;

const SModalParagraph = styled.p`
  margin-top: 30px;
`;

// @ts-ignore
const SBalances = styled(SLanding as any)`
  height: 100%;
  & h3 {
    padding-top: 30px;
  }
`;

const STable = styled(SContainer as any)`
  flex-direction: column;
  text-align: left;
`;

const SRow = styled.div`
  width: 100%;
  display: flex;
  margin: 6px 0;
`;

const SKey = styled.div`
  width: 30%;
  font-weight: 700;
`;

const SValue = styled.div`
  width: 70%;
  font-family: monospace;
`;

const STestButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
`;

const STestButton = styled(Button as any)`
  border-radius: 8px;
  font-size: ${fonts.size.medium};
  height: 44px;
  width: 100%;
  max-width: 175px;
  margin: 12px;
`;

interface IAppState {
  connector: WalletConnect | null;
  fetching: boolean;
  connected: boolean;
  chainId: number;
  showModal: boolean;
  pendingRequest: boolean;
  uri: string;
  accounts: string[];
  address: string;
  result: any | null;
  assets: IAssetData[];
  token: IToken;
}

interface IToken {
  contractAddress: string;
  decimals: number;
}

const INITIAL_STATE: IAppState = {
  connector: null,
  fetching: false,
  connected: false,
  chainId: 137,
  showModal: false,
  pendingRequest: false,
  uri: "",
  accounts: [],
  address: "",
  result: null,
  assets: [],
  token: {
    contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    decimals: 6,
  }
};

class App extends React.Component<any, any> {
  public state: IAppState = {
    ...INITIAL_STATE,
  };

  public setChainId = (chainNumber: string) => {
    const chainId = parseInt(chainNumber, 10);
    this.setState({
      ...this.state,
      chainId,
    })
  }

  public connect = async () => {
    // bridge url
    const bridge = "https://bridge.walletconnect.org";
    const clientMeta = {
      description: "Connect with D'CENT Wallet",
      url: "https://77f9-58-151-32-202.jp.ngrok.io/",
      icons: ["https://77f9-58-151-32-202.jp.ngrok.io/favicon.ico"],
      name: "Custom WC",
    };
    // const peerMeta = {
    //   description: "Connect with WalletConnect DDDDD",
    //   url: "http://192.168.0.235:3000",
    //   icons: ["http://192.168.0.235:3000/pentabreed.png"],
    //   name: "WalletConnect DDDDDD",
    // }
    // const pushServerOptions : IPushServerOptions= {
    //   url:'',
    //   type : '',
    //   token :'0xdac17f958d2ee523a2206206994597c13d831ec7',
    //   peerMeta : true,
    //   // language
    // }

    // const qrcodeModalOptions = {
    //   serviceName: 'SKYPlay',
    //   accounts: [
    //     {
    //       contractAddress: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    //       networkType: 'ARBITRUM',
    //       name: 'Tether',
    //       symbol: 'USDT'
    //     },
    //     {
    //       contractAddress: '',
    //       networkType: 'HECO',
    //     },
    //     {
    //       contractAddress: '',
    //       networkType: 'BODA',
    //     },
    //     {
    //       contractAddress: '',
    //       networkType: 'SONGBIRD',
    //     },
    //     {
    //       contractAddress: '0x4c665bbafd28ec9e5d792345f470ebfca21e3d15',
    //       networkType: 'POLYGON',
    //       name: 'SKYPlay',
    //       symbol: 'SKP'
    //     },
    //     {
    //       contractAddress: '',
    //       networkType: 'XRP',
    //     },

    //   ],
    // };
    const qrcodeModalOptions = {
      serviceName: 'SKYPlay',
      accounts: [
        {
          contractAddress: '0x4c665bbafd28ec9e5d792345f470ebfca21e3d15',
          networkType: 'POLYGON',
          name: 'SKYPlay',
          symbol: 'SKP'
        },
        {
          contractAddress: '',
          networkType: 'XRP',
        },
      ]
    }
    const connector =  new WalletConnect({ bridge, qrcodeModal: QRCodeModal, qrcodeModalOptions, clientMeta });

    await this.setState({ connector });
    console.log('init ', connector)
    // check if already connected
    if (!connector.connected) {
      // create new session
      console.log('before create session', connector);
      await connector.createSession({ chainId: this.state.chainId });
    }

    // subscribe to events
    console.log('after create session', connector)
    await this.subscribeToEvents();
  };


  public subscribeToEvents = () => {
    const { connector } = this.state;

    if (!connector) {
      return;
    }

    connector.on("session_update", async (error, payload) => {
      console.log(`connector.on("session_update")`);

      if (error) {
        throw error;
      }

      const { chainId, accounts } = payload.params[0];
      this.onSessionUpdate(accounts, chainId);
    });

    connector.on("connect", (error, payload) => {
      console.log(`connector.on("connect")`);

      if (error) {
        throw error;
      }

      this.onConnect(payload);
    });

    connector.on("disconnect", (error, payload) => {
      console.log(`connector.on("disconnect")`);

      if (error) {
        throw error;
      }

      this.onDisconnect();
    });

    if (connector.connected) {
      const { chainId, accounts } = connector;
      console.log(accounts)
      const address = accounts[0];
      this.setState({
        connected: true,
        chainId: 1,
        accounts,
        address,
      });
      this.onSessionUpdate(accounts, chainId);
      console.log('subscribeToEvents connector.connected')
    }
    console.log('subscribeToEvents')
    this.setState({ connector });
  };

  public killSession = async () => {
    const { connector } = this.state;
    if (connector) {
      connector.killSession();
    }
    this.resetApp();
  };

  public resetApp = async () => {
    await this.setState({ ...INITIAL_STATE });
  };

  public onConnect = async (payload: IInternalEvent) => {
    const { chainId, accounts } = payload.params[0];
    // const mappedAccounts = accounts.map(account => account.toLowerCase());
    const address = accounts[0].toLowerCase();
    console.log('current accounts', accounts)
    console.log('payload', payload)
    await this.setState({
      connected: true,
      chainId,
      accounts,
      address,
    });
    this.getAccountAssets();
  };

  public onDisconnect = async () => {
    this.resetApp();
  };

  public onSessionUpdate = async (accounts: string[], chainId: number) => {
    const address = accounts[0];
    await this.setState({ chainId, accounts, address });
    await this.getAccountAssets();
  };

  public getAccountAssets = async () => {
    const { address, chainId } = this.state;
    console.log(`address : ${address}\n chainId : ${chainId}`)
    this.setState({ fetching: true });
    try {
      // get account balances
      const assets = await apiGetAccountAssets(address, chainId);

      await this.setState({ fetching: false, address, assets });
    } catch (error) {
      console.error(error);
      await this.setState({ fetching: false });
    }
  };

  public toggleModal = () => this.setState({ showModal: !this.state.showModal });

  public testAddToken = async () => {
    const { connector, address, chainId, assets } = this.state;
    console.log('assets', assets)

    if (!connector) {
      return;
    }

    // test message
    const message = `add Token`;

    // hash message
    // const hash = hashMessage(message);
    const hexMsg = convertUtf8ToHex(message);

    // eth_sign params
    // const msgParams = [address, hash];
    const msgParams = [hexMsg, address]

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send message
      const result = await connector.signMessage(msgParams);

      // verify signature
      const valid = await verifySignature(address, result, hexMsg, chainId);
      console.log(valid)
      // format displayed result
      const formattedResult = {
        method: "addToken",
        address,
        valid,
        result,
      };

      // display result
      this.setState({
        connector,
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ connector, pendingRequest: false, result: null });
    }
  };
  public testSendTransaction = async () => {
    // const { connector, address, chainId } = this.state;
    const { connector, address } = this.state;

    if (!connector) {
      return;
    }
    // 672324007754989393
    // 150000000000000000
    // from
    const from = address;

    // to
    const to = '0xb10C975b92F563AF88F34DB4d7178352c5bc1311';
    const accounts = await getAccounts();
    console.log(accounts)

    // 0xb10C975b92F563AF88F34DB4d7178352c5bc1311

    // nonce
    // const _nonce = await apiGetAccountNonce(address, chainId);
    // const nonce = sanitizeHex(convertStringToHex(_nonce));


    // const _blockNumber = await apiGetBlockNumber();

    // const _nonce = await apiGetNonce(_blockNumber);
    const _nonce = await apiGetTransactionCount(address);
    console.log('_nonce', _nonce)
    // const nonce = sanitizeHex(convertStringToHex(_nonce));
    // gasPrice
    // const gasPrices = await apiGetGasPrice();
    const gasPrices = await getProviderGasPrice();
    console.log(gasPrices)
    const gasPrice = sanitizeHex(gasPrices);
    // console.log(gasPrice)
    // const _gasPrice = gasPrices;
    // const _gasPrice = gasPrices.slow.price;
    // const _gasPrice = gasPrices;

    // const gasPrice = sanitizeHex(convertStringToHex(convertAmountToRawNumber(_gasPrice, 9)));
    // const gasPrice = sanitizeHex(convertStringToHex(convertAmountToRawNumber(_gasPrice, 18)));
    console.log(gasPrice)
    // gasLimit
    const _gasLimit = 21000;
    const gasLimit = sanitizeHex(convertStringToHex(_gasLimit));

    // value
    const _value = 150000000000000000;
    const value = sanitizeHex(convertStringToHex(_value));

    // data
    // const data = "0x";

    // test transaction
    const tx = {
      from,
      to,
      // nonce,
      gasPrice,
      gasLimit,
      value,
      // data,
    };
    console.log('signed tx', tx)

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send transaction
      const result = await connector.sendTransaction(tx);

      // format displayed result
      const formattedResult = {
        method: "eth_sendTransaction",
        txHash: result,
        from: address,
        to: address,
        value: `${_value} ETH`,
      };

      // display result
      this.setState({
        connector,
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ connector, pendingRequest: false, result: null });
    }
  };

  public testSignTransaction = async () => {
    // const { connector, address, chainId } = this.state;
    const { connector, address } = this.state;

    if (!connector) {
      return;
    }

    // from
    const from = address;

    // to
    const to = address;
    const balance = await getBalance(address);
    console.log(balance);
    // nonce
    // const _nonce = await apiGetAccountNonce(address, chainId);
    const _blockNumber = await apiGetBlockNumber();

    const _nonce = await apiGetNonce(_blockNumber);
    console.log('_nonce', _nonce)
    const nonce = sanitizeHex(convertStringToHex(_nonce));
    console.log('nonce', nonce);
    // gasPrice
    const gasPrices = await apiGetGasPrices();
    console.log(gasPrices)
    const _gasPrice = gasPrices.slow.price;
    const gasPrice = sanitizeHex(convertStringToHex(convertAmountToRawNumber(_gasPrice, 9)));

    // gasLimit
    const _gasLimit = 21000;
    const gasLimit = sanitizeHex(convertStringToHex(_gasLimit));

    // value
    const _value = 0;
    const value = sanitizeHex(convertStringToHex(_value));

    // data
    const data = "0x";

    // test transaction
    const tx = {
      from,
      to,
      nonce,
      gasPrice,
      gasLimit,
      value,
      data,
    };
    console.log('tx', tx)

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send transaction
      const result = await connector.signTransaction(tx);

      // format displayed result
      const formattedResult = {
        method: "eth_signTransaction",
        from: address,
        to: address,
        value: `${_value} ETH`,
        result,
      };

      // display result
      this.setState({
        connector,
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ connector, pendingRequest: false, result: null });
    }
  };

  public testLegacySignMessage = async () => {
    const { connector, address, chainId } = this.state;

    if (!connector) {
      return;
    }

    // test message
    const message = `My email is john@doe.com - ${new Date().toUTCString()}`;

    // hash message
    const hash = hashMessage(message);

    // eth_sign params
    const msgParams = [address, hash];

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send message
      const result = await connector.signMessage(msgParams);

      // verify signature
      const valid = await verifySignature(address, result, hash, chainId);

      // format displayed result
      const formattedResult = {
        method: "eth_sign (legacy)",
        address,
        valid,
        result,
      };

      // display result
      this.setState({
        connector,
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ connector, pendingRequest: false, result: null });
    }
  };

  public testStandardSignMessage = async () => {
    const { connector, address, chainId } = this.state;

    if (!connector) {
      return;
    }

    // test message
    const message = `My email is john@doe.com - ${new Date().toUTCString()}`;

    // encode message (hex)
    const hexMsg = convertUtf8ToHex(message);

    // eth_sign params
    const msgParams = [address, hexMsg];

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send message
      const result = await connector.signMessage(msgParams);

      // verify signature
      const hash = hashMessage(message);
      const valid = await verifySignature(address, result, hash, chainId);

      // format displayed result
      const formattedResult = {
        method: "eth_sign (standard)",
        address,
        valid,
        result,
      };

      // display result
      this.setState({
        connector,
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ connector, pendingRequest: false, result: null });
    }
  };

  public testPersonalSignMessage = async () => {
    const { connector, address, chainId } = this.state;

    if (!connector) {
      return;
    }

    // test message
    const message = `My email is john@doe.com - ${new Date().toUTCString()}`;

    // encode message (hex)
    const hexMsg = convertUtf8ToHex(message);

    // eth_sign params
    const msgParams = [hexMsg, address];

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send message
      const result = await connector.signPersonalMessage(msgParams);

      // verify signature
      const hash = hashMessage(message);
      const valid = await verifySignature(address, result, hash, chainId);

      // format displayed result
      const formattedResult = {
        method: "personal_sign",
        address,
        valid,
        result,
      };

      // display result
      this.setState({
        connector,
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ connector, pendingRequest: false, result: null });
    }
  };

  public testSignTypedData = async () => {
    const { connector, address, chainId } = this.state;

    if (!connector) {
      return;
    }

    const message = JSON.stringify(eip712.example);

    // eth_signTypedData params
    const msgParams = [address, message];

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // sign typed data
      const result = await connector.signTypedData(msgParams);

      // verify signature
      const hash = hashTypedDataMessage(message);
      const valid = await verifySignature(address, result, hash, chainId);
      const web3Accounts = await apiGetAccounts();
      const web3GasPrice = await apiGetGasPrice();
      const web3Balance = await apiGetBalance(address);
      console.log(web3Balance);
      console.log('gas', web3GasPrice)
      console.log(web3Accounts)

      // format displayed result
      const formattedResult = {
        method: "eth_signTypedData",
        address,
        valid,
        result,
      };

      // display result
      this.setState({
        connector,
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ connector, pendingRequest: false, result: null });
    }
  };

  public render = () => {
    const {
      assets,
      address,
      connected,
      chainId,
      fetching,
      showModal,
      pendingRequest,
      result,
    } = this.state;
    return (
      <SLayout>
        <Column maxWidth={1000} spanHeight>
          <Header
            connected={connected}
            address={address}
            chainId={chainId}
            killSession={this.killSession}
          />
          <SContent>
            {!address && !assets.length ? (
              <SLanding center>
                <h3>
                  {`Try out WalletConnect`}
                  <br />
                  <span>{`v${process.env.REACT_APP_VERSION}`}</span>
                </h3>
                <div>
                  <button onClick={() => this.setChainId('1')}>Ethereum</button>
                  <button onClick={() => this.setChainId('8217')}>Klaytn</button>
                </div>
                <SButtonContainer>
                  <SConnectButton left onClick={this.connect} fetching={fetching}>
                    {"Connect to WalletConnect"}
                  </SConnectButton>
                </SButtonContainer>
              </SLanding>
            ) : (
              <SBalances>
                <Banner />
                <h3>Actions</h3>
                <Column center>
                  <STestButtonContainer>
                    <STestButton left onClick={this.testSendTransaction}>
                      {"eth_sendTransaction"}
                    </STestButton>
                    <STestButton left onClick={this.testSignTransaction}>
                      {"eth_signTransaction"}
                    </STestButton>
                    <STestButton left onClick={this.testSignTypedData}>
                      {"eth_signTypedData"}
                    </STestButton>
                    <STestButton left onClick={this.testLegacySignMessage}>
                      {"eth_sign (legacy)"}
                    </STestButton>
                    <STestButton left onClick={this.testStandardSignMessage}>
                      {"eth_sign (standard)"}
                    </STestButton>
                    <STestButton left onClick={this.testPersonalSignMessage}>
                      {"personal_sign"}
                    </STestButton>
                    <STestButton left onClick={this.testAddToken} >
                      {"Add_Token"}
                    </STestButton>
                  </STestButtonContainer>
                </Column>
                <h3>Balances</h3>
                {!fetching ? (
                  <AccountAssets chainId={chainId} assets={assets} />
                ) : (
                  <Column center>
                    <SContainer>
                      <Loader />
                    </SContainer>
                  </Column>
                )}
              </SBalances>
            )}
          </SContent>
        </Column>
        <Modal show={showModal} toggleModal={this.toggleModal}>
          {pendingRequest ? (
            <SModalContainer>
              <SModalTitle>{"Pending Call Request"}</SModalTitle>
              <SContainer>
                <Loader />
                <SModalParagraph>{"Approve or reject request using your wallet"}</SModalParagraph>
              </SContainer>
            </SModalContainer>
          ) : result ? (
            <SModalContainer>
              <SModalTitle>{"Call Request Approved"}</SModalTitle>
              <STable>
                {Object.keys(result).map(key => (
                  <SRow key={key}>
                    <SKey>{key}</SKey>
                    <SValue>{result[key].toString()}</SValue>
                  </SRow>
                ))}
              </STable>
            </SModalContainer>
          ) : (
            <SModalContainer>
              <SModalTitle>{"Call Request Rejected"}</SModalTitle>
            </SModalContainer>
          )}
        </Modal>
      </SLayout>
    );
  };
}

export default App;
