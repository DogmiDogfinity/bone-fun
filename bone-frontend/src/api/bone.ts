import { createWalletActor, createActor } from '@/utils/agent/create-actor.js';
import type {
  _SERVICE,
  Account,
  ApproveArgs,
  MetadataValue,
  Result,
  Result_1,
  StandardRecord,
  TransferArg,
} from '@/canisters/bone/bone.did';
import { idlFactory } from '@/canisters/bone/bone.did';
export let canisterId: string;
if (process.env.CANISTER_ID_BONE) {
  canisterId = process.env.CANISTER_ID_BONE;
  // console.log(canisterId);
} else if (process.env.BONE_CANISTER_ID) {
  canisterId = process.env.BONE_CANISTER_ID;
} else {
  console.error('No CANISTER_ID found in environment variables.');
}
export async function icrc1_total_supply(): Promise<bigint> {
  const Actor = await createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.icrc1_total_supply();
}
// /icrc1_decimals
export async function icrc1_decimals(): Promise<number> {
  const Actor = await createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.icrc1_decimals();
}
export async function icrc1_supported_standards(): Promise<Array<StandardRecord>> {
  const Actor = await createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.icrc1_supported_standards();
}
export async function icrc2_approve(params: [ApproveArgs]): Promise<Result_1> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.icrc2_approve(...params);
}
export async function bone_icrc1_balance_of(params: [Account], canisterIdparams?: string): Promise<bigint> {
  let Actor: _SERVICE;
  if (canisterIdparams) {
    Actor = await createActor(canisterIdparams, idlFactory);
  } else {
    Actor = await createActor(canisterId, idlFactory);
  }
  return Actor.icrc1_balance_of(...params);
}
export async function bone_icrc1_transfer(params: [TransferArg]): Promise<Result> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.icrc1_transfer(...params);
}
export async function bone_icrc1_fee(): Promise<bigint> {
  const Actor: _SERVICE = await createActor(canisterId, idlFactory);
  return Actor.icrc1_fee();
}
