import { Artemis } from 'artemis-web3-adapter';
import { host, whitelist } from '@/utils/env';
import appStore, { setAppConnect, setAppDisconnect, setAppConnectType, setAccountId } from '@/store/app';
// import { getBaseUserInfo, setUserInfo } from '@/api/fomowell_launcher';
// import { account_balance, decimals } from '@/api/ledger';
import { AccountIdentifier } from '@dfinity/ledger-icp';
import { Principal } from '@dfinity/principal';
import Big from 'big.js';
import { get_homepage_calc } from '@/api/bone_main';
import { icrc1_decimals } from '@/api/icp';

export const artemisWalletAdapter = new Artemis();
export const STORE_PRINCIPALID = 'principalId';
export const STORE_WALLETTYPE = 'walletType';
export async function requestConnect(type = 'plug') {
  try {
    const publicKey = await artemisWalletAdapter.connect(type, { whitelist, host });
    if (publicKey) {
      // console.log(publicKey);
      localStorage.setItem(STORE_PRINCIPALID, publicKey);
      localStorage.setItem(STORE_WALLETTYPE, type);
      // // set app state
      setAppConnect(publicKey);
      setAppConnectType(publicKey, type);
      setAccountId(publicKey);
      // let decimal = (await decimals()).decimals;
      // const balance = await account_balance([{ account: AccountIdentifier.fromHex(appStore.accountId).toNumbers() }]);
      // await seticpaccount(new Big(Number(balance.e8s)).div(new Big(10).pow(Number(decimal))).toString());
    } else {
      // localStorage.clear();
    }
    return !!publicKey;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    return false;
  }
}
export async function disconnect() {
  const timer = new Promise((resolve) => setTimeout(() => resolve(true), 1000));
  let result;
  try {
    // bug: sometimes disconnect always in pending status
    await artemisWalletAdapter.disconnect();
    // const agree_res = localStorage.getItem('agreeRisk')
    localStorage.clear();
    appStore.userId = '';
    // localStorage.setItem('agreeRisk', agree_res ? 'false' : 'true')
    result = await Promise.race([timer, disconnect]);
  } catch (error) {
    console.error(error);
  }
  // set app state
  setAppDisconnect();
  return result;
}
export async function verifyConnectionAndAgent() {
  let principalId = localStorage.getItem(STORE_PRINCIPALID);
  let type: any = localStorage.getItem(STORE_WALLETTYPE);
  if (!!principalId && principalId !== 'false') {
    await icrc1_decimals();
    await requestConnect(type);
    await setAccountId(principalId);
    return true;
  } else {
    return false;
  }
}
