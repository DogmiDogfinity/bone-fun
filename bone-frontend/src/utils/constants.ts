// import { canisterId as platTokenId } from '@/canisters/icrc2_ledger'
// import { canisterId as localIcpId } from '@/canisters/icrc1_ledger'

export const IS_PRODUCTION = process.env.DFX_NETWORK === 'ic';

export const BASE_URL = process.env.NODE_ENV === 'production' ? 'https://metrics.icpex.org/' : '/service';

export const DECIMALS = 18;

export const PRICE_DECIMALS = 18;

export const TOKEN_PROTOCOLS = ['DIP20', 'ICRC-1', 'ICRC-2'];

// export const PLAT_TOKEN_CANISTER_ID = platTokenId;

export const ANONYMOUS_PRINCIPAL_ID = '2vxsx-fae';

// export const ICP_CANISTER_ID = IS_PRODUCTION ? 'ryjl3-tyaaa-aaaaa-aaaba-cai' : localIcpId;
