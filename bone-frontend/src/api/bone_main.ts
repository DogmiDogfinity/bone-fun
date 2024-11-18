import { createWalletActor, createActor } from '@/utils/agent/create-actor.js';
import type {
  _SERVICE,
  DogContext,
  DogContextOut,
  HomepageCalcInfo,
  MRecord,
  OutPoolInfo,
  RecordIndex,
  Result,
  Result_1,
  Result_2,
} from '@/canisters/bone_main/bone_main.did';
import { idlFactory } from '@/canisters/bone_main/bone_main.did';
import { Principal } from '@dfinity/principal';
export let canisterId: string;
if (process.env.CANISTER_ID_BONE_MAIN) {
  canisterId = process.env.CANISTER_ID_BONE_MAIN;
  // console.log(canisterId);
} else if (process.env.BONE_MAIN_CANISTER_ID) {
  canisterId = process.env.BONE_MAIN_CANISTER_ID;
} else {
  console.error('No CANISTER_ID found in environment variables.');
}
export async function get_homepage_calc(): Promise<HomepageCalcInfo> {
  const Actor = await createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.get_homepage_calc();
}
// /get_record_idx
export async function get_record_idx(): Promise<RecordIndex> {
  const Actor = await createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.get_record_idx();
}
//get_record_index
export async function get_record_index(params: [bigint, bigint]): Promise<Array<[bigint, MRecord]>> {
  const Actor = await createActor<_SERVICE>(canisterId, idlFactory);
  return Actor.get_record_index(...params);
}
//create_dog
export async function create_dog(params: [string]): Promise<Result_2> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.create_dog(...params);
}
export async function get_dogs(): Promise<Array<Principal>> {
  const Actor: _SERVICE = await createActor(canisterId, idlFactory);
  return Actor.get_dogs();
}
export async function create_alliance(params: [string]): Promise<Result_1> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.create_alliance(...params);
}
export async function get_mining_alliances(): Promise<BigUint64Array | bigint[]> {
  const Actor: _SERVICE = await createActor(canisterId, idlFactory);
  return Actor.get_mining_alliances();
}
export async function get_mining_alliance(params: [bigint]): Promise<OutPoolInfo> {
  const Actor: _SERVICE = await createActor(canisterId, idlFactory);
  return Actor.get_mining_alliance(...params);
}
export async function join_alliance(params: [Principal, bigint]): Promise<Result> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.join_alliance(...params);
}
export async function top_user(): Promise<Array<[Principal, bigint, bigint, bigint, bigint, bigint]>> {
  const Actor: _SERVICE = await createActor(canisterId, idlFactory);
  return Actor.top_user();
}
export async function top_alliance(): Promise<Array<[string, bigint, bigint, bigint, bigint, bigint, bigint]>> {
  const Actor: _SERVICE = await createActor(canisterId, idlFactory);
  return Actor.top_alliance();
}
export async function leave_alliance(params: [Principal, bigint]): Promise<Result> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.leave_alliance(...params);
}
export async function time_until_next_having_days(): Promise<bigint> {
  const Actor: _SERVICE = await createActor(canisterId, idlFactory);
  return Actor.time_until_next_having_days();
}
export async function dog_level_upgrade(params: [Principal]): Promise<Result> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.dog_level_upgrade(...params);
}
export async function add_cycles(params: [bigint, Principal]): Promise<Result> {
  const Actor: _SERVICE = await createWalletActor(canisterId, idlFactory);
  return Actor.add_cycles(...params);
}
export async function dog_info(params: [Principal]): Promise<Array<DogContextOut>> {
  const Actor: _SERVICE = await createActor(canisterId, idlFactory);
  return Actor.get_dogs_info(...params);
}
export async function get_current_block_reward(): Promise<bigint> {
  const Actor: _SERVICE = await createActor(canisterId, idlFactory);
  return Actor.get_current_block_reward();
}
//get_record_rev
export async function get_record_rev(params: [bigint, bigint]): Promise<Array<[bigint, MRecord]>> {
  const Actor: _SERVICE = await createActor(canisterId, idlFactory);
  return Actor.get_record_rev(...params);
}
