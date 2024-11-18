import { createWalletActor, createActor } from '@/utils/agent/create-actor.js';
import type { _SERVICE, Account, ApproveArgs, Result, Result_1, TransferArg } from '@/canisters/dogmi/dogmi.did';
import { idlFactory } from '@/canisters/dogmi/dogmi.did';
export let canisterId: string;
if (process.env.CANISTER_ID_DOGMI) {
  canisterId = process.env.CANISTER_ID_DOGMI;
  // console.log(canisterId);
} else if (process.env.DOGMI_CANISTER_ID) {
  canisterId = process.env.DOGMI_CANISTER_ID;
} else {
  console.error('No CANISTER_ID found in environment variables.');
}
export async function dogmi_icrc1_balance_of(params: [Account]): Promise<bigint> {
  const Actor = await createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.icrc1_balance_of(...params);
}
export async function dogmi_icrc2_approve(params: [ApproveArgs]): Promise<Result_1> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.icrc2_approve(...params);
}
export async function dogmi_icrc1_decimals(): Promise<number> {
  const Actor = await createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.icrc1_decimals();
}
export async function dogmi_icrc1_fee(): Promise<bigint> {
  const Actor = await createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.icrc1_fee();
}
export async function dogmi_icrc1_transfer(params: [TransferArg]): Promise<Result> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.icrc1_transfer(...params);
}
