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
export interface DogContextOut {
  'ore_cnt' : bigint,
  'ore_amount' : bigint,
  'dog_id' : Principal,
  'owner' : Principal,
  'name' : string,
  'mining_alliance' : [] | [bigint],
  'dog_level' : DogLevel,
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
export interface HashRecord {
  'new_ore' : string,
  'old_ore' : string,
  'process_ore' : OreHashOut,
  'ore_difficulty' : string,
  'process_result_ore' : string,
}
export interface HomepageCalcInfo {
  'total_number_of_minder' : bigint,
  'block_reward' : bigint,
  'current_avtive_minders' : bigint,
}
export interface MRecord {
  'ore' : string,
  'utc' : bigint,
  'owner' : Principal,
  'high' : bigint,
  'reward_amount' : bigint,
  'dog_level' : DogLevel,
  'alliance_id' : [] | [bigint],
  'hash_record' : [] | [HashRecord],
  'timestamp' : bigint,
  'dog_canister' : Principal,
}
export type MiningState = { 'STOP' : null } |
  { 'ACTIVITY' : null };
export type MiningType = { 'POOL' : null } |
  { 'ALONE' : null };
export interface OreHashOut {
  'cycle_num' : bigint,
  'time' : bigint,
  'old_ore_rev' : string,
  'dog_ore_rev' : string,
}
export interface OutPoolInfo {
  'id' : bigint,
  'dogs_cnt' : Array<string>,
  'owner' : Principal,
  'dogs' : Array<Principal>,
  'name' : string,
  'mining_weight' : bigint,
}
export interface RecordIndex { 'start_idx' : bigint, 'end_idx' : bigint }
export type Result = { 'Ok' : null } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : bigint } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : Principal } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : [string, bigint, bigint] } |
  { 'Err' : string };
export interface VerifyDogHash { 'dog_hash' : DogHash, 'create_time' : bigint }
export interface _SERVICE {
  'add_cycles' : ActorMethod<[bigint, Principal], Result>,
  'create_alliance' : ActorMethod<[string], Result_1>,
  'create_dog' : ActorMethod<[string], Result_2>,
  'cycles' : ActorMethod<[], bigint>,
  'dog_info' : ActorMethod<[Principal], DogContext>,
  'dog_level_upgrade' : ActorMethod<[Principal], Result>,
  'get_all_dogs_info' : ActorMethod<[], Array<DogContextOut>>,
  'get_block_24h_cnt' : ActorMethod<[], number>,
  'get_create_time' : ActorMethod<[], bigint>,
  'get_current_block_reward' : ActorMethod<[], bigint>,
  'get_dog_level_str' : ActorMethod<[Principal], string>,
  'get_dogs' : ActorMethod<[], Array<Principal>>,
  'get_dogs_info' : ActorMethod<[Principal], Array<DogContextOut>>,
  'get_homepage_calc' : ActorMethod<[], HomepageCalcInfo>,
  'get_miners' : ActorMethod<[], Array<Principal>>,
  'get_mining_alliance' : ActorMethod<[bigint], OutPoolInfo>,
  'get_mining_alliances' : ActorMethod<[], BigUint64Array | bigint[]>,
  'get_ore' : ActorMethod<[], [string, bigint]>,
  'get_record_idx' : ActorMethod<[], RecordIndex>,
  'get_record_index' : ActorMethod<[bigint, bigint], Array<[bigint, MRecord]>>,
  'get_record_rev' : ActorMethod<[bigint, bigint], Array<[bigint, MRecord]>>,
  'join_alliance' : ActorMethod<[Principal, bigint], Result>,
  'leave_alliance' : ActorMethod<[Principal, bigint], Result>,
  'time_until_next_having_days' : ActorMethod<[], bigint>,
  'top_alliance' : ActorMethod<
    [],
    Array<[string, bigint, bigint, bigint, bigint, bigint, bigint]>
  >,
  'top_user' : ActorMethod<
    [],
    Array<[Principal, bigint, bigint, bigint, bigint, bigint]>
  >,
  'update_dog_state' : ActorMethod<[MiningState], undefined>,
  'verify_ore' : ActorMethod<[VerifyDogHash], Result_3>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
