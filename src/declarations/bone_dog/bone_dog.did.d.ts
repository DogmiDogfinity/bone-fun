import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface DogContext {
  'ore' : string,
  'ore_cnt' : bigint,
  'ore_amount' : bigint,
  'owner' : Principal,
  'name' : string,
  'ores' : Array<DogHash>,
  'mining_alliance' : [] | [bigint],
  'dog_level' : DogLevel,
  'ore_difficulty' : bigint,
  'create_time' : bigint,
  'main_pid' : Principal,
  'mining_state' : MiningState,
  'mining_type' : MiningType,
}
export interface DogHash {
  'owner' : Principal,
  'ores' : Array<string>,
  'mining_alliance' : [] | [bigint],
  'timestamp' : bigint,
}
export type DogLevel = { 'SilverDog' : null } |
  { 'GoldDog' : null } |
  { 'CopperDog' : null } |
  { 'DiamondDog' : null };
export type MiningState = { 'STOP' : null } |
  { 'ACTIVITY' : null };
export type MiningType = { 'POOL' : null } |
  { 'ALONE' : null };
export type Result = { 'Ok' : null } |
  { 'Err' : string };
export interface _SERVICE {
  'cycles' : ActorMethod<[], bigint>,
  'dog_info' : ActorMethod<[], DogContext>,
  'dog_level_upgrade' : ActorMethod<[DogLevel], Result>,
  'dog_mining_state_update' : ActorMethod<[string], Result>,
  'dog_mining_type_update' : ActorMethod<[MiningType, [] | [bigint]], Result>,
  'get_dog_state' : ActorMethod<[], [MiningState, MiningType, DogLevel]>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
