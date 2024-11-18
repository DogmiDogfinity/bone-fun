import { createWalletActor, createActor } from '@/utils/agent/create-actor.js';
import type {
  _SERVICE,
  Account,
  Memo,
  Result_2,
  Result_3,
  Subaccount,
  Timestamp,
  Tokens,
} from '@/canisters/icp/icp.did';
import { idlFactory } from '@/canisters/icp/icp.did';
import { ActorMethod } from '@dfinity/agent';
export let canisterId: string;
if (process.env.CANISTER_ID_ICP) {
  canisterId = process.env.CANISTER_ID_ICP;
  // console.log(canisterId);
} else if (process.env.ICP_CANISTER_ID) {
  canisterId = process.env.ICP_CANISTER_ID;
} else {
  console.error('No CANISTER_ID found in environment variables.');
}
// /icrc2_approve
export async function icrc2_approve(
  params: [
    {
      fee: [] | [Tokens];
      memo: [] | [Memo];
      from_subaccount: [] | [Subaccount];
      created_at_time: [] | [Timestamp];
      amount: bigint;
      expected_allowance: [] | [bigint];
      expires_at: [] | [bigint];
      spender: Account;
    },
  ],
  canisterIdparams?: string,
): Promise<Result_2> {
  let Actor: _SERVICE;
  if (canisterIdparams) {
    Actor = await createWalletActor(canisterIdparams, idlFactory);
  } else {
    Actor = await createWalletActor(canisterId, idlFactory);
  }
  return Actor.icrc2_approve(...params);
}
// /icrc1_decimals
export async function icrc1_decimals(): Promise<number> {
  const Actor = await createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.icrc1_decimals();
}
export async function icrc1_fee(): Promise<bigint> {
  const Actor = await createActor<_SERVICE>('ryjl3-tyaaa-aaaaa-aaaba-cai', idlFactory);
  return Actor.icrc1_fee();
}
export async function icrc1_balance_of(params: [Account]): Promise<Tokens> {
  const Actor = await createActor<_SERVICE>('ryjl3-tyaaa-aaaaa-aaaba-cai', idlFactory);
  return Actor.icrc1_balance_of(...params);
}
export async function icp_icrc1_transfer(
  params: [
    {
      to: Account;
      fee: [] | [Tokens];
      memo: [] | [Memo];
      from_subaccount: [] | [Subaccount];
      created_at_time: [] | [Timestamp];
      amount: Tokens;
    },
  ],
): Promise<Result_3> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.icrc1_transfer(...params);
}
