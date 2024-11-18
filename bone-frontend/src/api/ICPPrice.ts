import { createWalletActor, createActor } from '@/utils/agent/create-actor.js';
import type { _SERVICE } from '@/canisters/ICPPrice/ICPPrice.did';
import { idlFactory } from '@/canisters/ICPPrice/ICPPrice.did';
import { Principal } from '@dfinity/principal';
// if (process.env.CANISTER_ID_ICP) {
//   canisterId = process.env.CANISTER_ID_ICP;
//   // console.log(canisterId);
// } else if (process.env.ICP_CANISTER_ID) {
//   canisterId = process.env.ICP_CANISTER_ID;
// } else {
//   console.error('No CANISTER_ID found in environment variables.');
// }
export let canisterId = '2vf3u-cqaaa-aaaam-ab5ha-cai';
// /icrc2_approve
export async function getICPPrice(params: [Array<Principal>]): Promise<Array<[Principal, bigint]>> {
  const Actor = await createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.pricesBatch(...params);
}
