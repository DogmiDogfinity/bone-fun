import { Principal } from '@dfinity/principal';
// import { getAccountIdentifier } from '../../artemis-web3-adapter/src/libs/identifier-utils.js';
import tokenStore from '@/store/token.js';
import axios from 'axios';
import Big from 'big.js';

export function generateDeadline() {
  return BigInt((new Date().getTime() + 10 ** 14) * 10 ** 5);
}

export function truncateDecimal(num: number, decimals = 3) {
  const x = Big(num);
  // floor
  const y = x.round(decimals, 0);
  return Number(y.toString());
}

export function minus(a: number, b: number) {
  const x = new Big(a);
  const y = x.minus(b);
  return Number(y.toString());
}

export function multiply(a: number, b: number) {
  const x = new Big(a);
  const y = x.times(b);
  return Number(y.toString());
}
export function multiplyAndConvertToBigInt(value: number | string | undefined, exponent: number | bigint): bigint {
  if (typeof exponent === 'bigint') {
    exponent = Number(exponent);
  }
  if (value === undefined || value.toString().trim() === '') {
    value = '0';
  } else {
    value = value.toString();
  }
  const x = new Big(value).times(10 ** exponent);
  // round down
  const y = x.round(0, Big.roundDown);
  return BigInt(y.toString());
}

export function divide(dividend: bigint | number | string, divisor: number, decimals = 18): number {
  if (divisor === 0) return 0;
  const x = Big(dividend.toString()).div(divisor);
  const y = x.round(decimals, 0);
  return Number(y.toString());
}

export function divideAndConvertToNumber(dividend: bigint | number, exponent: number | bigint, decimals = 18): number {
  if (typeof exponent === 'bigint') {
    exponent = Number(exponent);
  }
  const x = Big(dividend.toString()).div(10 ** exponent);
  // floor
  const y = x.round(decimals, 0);
  const res = Number(y.toString());
  //console.log("y:", y.toString(), "res:", res)
  return res;
}

export function divideAndConvertToBig(
  dividend: bigint | number | string,
  exponent: number | bigint,
  decimals = 18,
): Big {
  if (typeof exponent === 'bigint') {
    exponent = Number(exponent);
  }
  const x = Big(dividend.toString()).div(10 ** exponent);
  // floor
  const y = x.round(decimals, 0);
  //console.log("y:", y.toString(), "res:", res)
  return y;
}

export function capitalizeFirstLetter(str: string): string {
  if (!str?.length) return str;

  const firstLetter = str.charAt(0).toUpperCase();
  const remainingLetters = str.slice(1);

  return firstLetter + remainingLetters;
}

export function divideAndPercentage(dividend: bigint | number, divisor: bigint | number, decimals: number) {
  dividend = Number(dividend);
  divisor = Number(divisor);
  if (divisor === 0) throw new Error('Divisor cannot be zero.');

  const result = (dividend / divisor) * 100;
  const roundedResult = Number.parseFloat(result.toFixed(decimals));
  return roundedResult;
}

export const getBase64 = (img: Blob, callback: (...args: any[]) => any) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
};

export const sleep = (interval = 100, fn?: (...args: any[]) => any) =>
  new Promise((resolve) => {
    const sleep = setTimeout(resolve, interval);
    fn && fn(sleep);
  });

export function formatBigNumberDisplay(num: Big | undefined): string {
  if (num === undefined) {
    return '0';
  }
  const bigNum = new Big(num);
  const integerPart = bigNum.round(0, 0).toString();  
  let formattedNumber: string;

  if (integerPart.length > 5) {
    formattedNumber = bigNum.toFixed(2, 0);  
  } else if (integerPart.length > 3) {
    formattedNumber = bigNum.toFixed(5, 0);  
  } else if (integerPart.length > 0 && num.gt(Big(1))) {
    formattedNumber = bigNum.toFixed(8, 0);  
  } else {
    formattedNumber = bigNum.toString();  
  }

  
  if (formattedNumber.includes('.')) {
    formattedNumber = formattedNumber.replace(/\.?0+$/, '');
  }
  const parts = formattedNumber.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return parts.join('.');
}

export function transferToNumber(inputNumber: number | string) {
  if (Number.isNaN(~~inputNumber) || !inputNumber || +inputNumber === 0) return inputNumber;

  let inputNumberStr: number | string = `${inputNumber}`;
  inputNumberStr = Number.parseFloat(inputNumberStr);
  const eformat = inputNumberStr.toExponential();
  const tmpArray = eformat.match(/\d(?:\.(\d*))?e([+-]\d+)/);
  const dotLen = Math.max(0, (tmpArray?.[1] || '').length - (tmpArray ? Number(tmpArray[2]) : 0));

  const number = inputNumberStr.toFixed(dotLen > 7 ? 7 : dotLen);

  if (Number(number).toString().includes('e')) {
    return number;
  }

  return Number(number);
}

export const verifyNumber = (n: string, max: number = 100) => {
  const v = n?.replace(/[^\-?\d]/g, '');

  if (Number(v) > max) return `${max}`;

  return v;
};

export const verifyNumberDotSimple = (n: string, max: number = 100, limit: number = 2) => {
  const v = n?.replace(/[^\-?\d.]/g, '');
  const reg = new RegExp(`^\\d*(\\.?\\d{0,${limit}})`, 'g');

  if (Number(v) > max) return max;

  return (
    n
      .replace(/[^\d^\.]+/g, '')
      .replace(/^0+(\d)/, '$1')
      .replace(/^\./, '0.')
      .match(reg)?.[0] || ''
  );
};

export const verifyNumberDot = (n: string, max: number = 100, limit: number = 2) => {
  const v = n?.replace(/[^\-?\d.]/g, '');

  if (Number(v) > max) return `${transferToNumber(max)}`;

  const limitV = verifyNumberDotSimple(n, max, limit);

  return transferToNumber(limitV);
};

export const verifyNumberLen = (n: string, max: string, maxLen: number) => {
  const v = n?.replace(/[^\-?\d]/g, '');

  return n.length > maxLen ? max : v;
};

export function executionInterrupt<T>(fn: (...args: any[]) => Promise<T>) {
  let count = 0;
  return async function (...args: any[]) {
    count++;
    const innerCount = count;
    // @ts-expect-error use this
    const res = await fn.apply(this, args);
    if (count === innerCount) return res;
    else return Promise.reject(new Error('interrupt'));
  };
}

export const formatNumber = (num: number) => {
  return num.toString().replace(/\d+/, (n) => {
    return n.replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
  });
};

export function formatAmountByUnit(num: number | null | string | undefined, unit: number = 4): string {
  if (num == null || undefined) return '0';
  if (typeof num === 'string') {
    num = Number.parseFloat(num);
  }
  if (num === 0) {
    return '0';
  }
  const units = ['', 'K', 'M', 'B', 'T'];
  let unitIndex = 0;

  while (num >= 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }
  const intPart = num.toFixed(18).split('.')[0] || ''; // Extract decimal part
  const decimalPart = num.toFixed(18).split('.')[1] || ''; // Extract decimal part
  // If decimal part is less than 0.00001, show as 0.0{5}32
  if (intPart === '0') {
    const numZeros = decimalPart.match(/^0+/)?.[0].length || 0;
    if (numZeros >= 2) {
      const nonZeroPart = decimalPart
        .replace(/^0+/, '')
        .substring(0, unit)
        .replace(/\.?0+$/, '');
      return `0.${'0'}{${numZeros}}${nonZeroPart}`;
    }
  }
  const formattedNum = num.toFixed(2).replace(/\.?0+$/, ''); // Remove trailing zeros
  return `${formattedNum} ${units[unitIndex]}`;
}
export function formatAmountByUnitToT(
  num: number | null | string | undefined,
  unit: number = 4,
  isneedT: boolean = true,
): string {
  if (num == null) return '0';
  if (typeof num === 'string') {
    num = Number.parseFloat(num);
  }
  if (num === 0) {
    return '0';
  }
  num /= 1000000000000;
  const intPart = num.toFixed(18).split('.')[0] || ''; // Extract decimal part
  const decimalPart = num.toFixed(18).split('.')[1] || ''; // Extract decimal part
  // If decimal part is less than 0.00001, show as 0.0{5}32
  if (intPart === '0' && isneedT) {
    const numZeros = decimalPart.match(/^0+/)?.[0].length || 0;
    if (numZeros >= 2) {
      const nonZeroPart = decimalPart
        .replace(/^0+/, '')
        .substring(0, unit)
        .replace(/\.?0+$/, '');
      return `0.${'0'}{${numZeros}}${nonZeroPart} ${isneedT ? 'T' : ''}`;
    }
  }
  if (isneedT) {
    const formattedNum = num.toFixed(2).replace(/\.?0+$/, ''); // Remove trailing zeros
    return `${formattedNum} T`;
  } else {
    const formattedNum = num.toString().replace(/\.?0+$/, ''); // Remove trailing zeros
    return `${formattedNum}`;
  }
}
export function isZero(variable: string | undefined | null | number) {
  const num = Number(variable);
  if (Number.isNaN(num) || num === 0) {
    return true;
  }
  return false;
}

export function isValidAmount(amount: string) {
  const regex = /^(0|[1-9]\d*)(\.\d{0,18})?$|^$/;
  return regex.test(amount);
}
export function isValidAmountNull(amount: string) {
  const regex = /^(0|[1-9]\d*)(\.\d{0,18})?$/;
  return regex.test(amount);
}
export function isValidAccountId(str: string) {
  const hexRegex = /^[0-9a-fA-F]{64}$/;
  return hexRegex.test(str);
}
export function isValidPrincipal(str: string) {
  try {
    Principal.fromText(str);
    return true;
  } catch (e) {
    return false;
  }
}

export const STORE_ICP_PRICE = 'ICP_Price';

export function connectWebSocket() {
  const ws = new WebSocket('wss://stream.binance.com:9443/ws/icpusdt@ticker');
  ws.addEventListener('open', () => {
    console.log('WebSocket connection opened.');
    ws.send(JSON.stringify({ event: 'subscribe', symbol: 'icpusdt@ticker' }));
  });

  ws.addEventListener('message', (event) => {
    const price = JSON.parse(event.data);
    if (price.a !== undefined) {
      const curPrice = transferToNumber(1 / +price.a);
      localStorage.setItem(STORE_ICP_PRICE, curPrice.toString());
      tokenStore.setDollar2ICP(curPrice);
    } else if (localStorage.getItem(STORE_ICP_PRICE) !== undefined) {
      tokenStore.setDollar2ICP(Number(localStorage.getItem(STORE_ICP_PRICE)));
    }
  });

  ws.addEventListener('close', () => {
    console.log('WebSocket connection closed.');
    setTimeout(connectWebSocket, 5000);
  });
}

export const coinbase_icp_price = async (): Promise<any> => {
  try {
    const response = await axios.get('https://api.coinbase.com/v2/prices/ICP-USD/spot');
    if (response.status === 200) {
      const price = response.data.data.amount;
      const curPrice = transferToNumber(1 / +price);
      console.log('icp price:', price);
      localStorage.setItem(STORE_ICP_PRICE, curPrice.toString());
      tokenStore.setDollar2ICP(curPrice);
    } else {
      console.warn('coinbase error:', response.statusText);
    }
  } catch (error) {
    console.warn('coinbase error:', error);
  }
};
