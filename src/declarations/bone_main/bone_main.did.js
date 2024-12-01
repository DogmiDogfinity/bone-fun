export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'Ok' : IDL.Principal, 'Err' : IDL.Text });
  const DogHash = IDL.Record({
    'owner' : IDL.Principal,
    'ores' : IDL.Vec(IDL.Text),
    'mining_alliance' : IDL.Opt(IDL.Nat64),
    'timestamp' : IDL.Nat64,
  });
  const DogLevel = IDL.Variant({
    'SilverDog' : IDL.Null,
    'GoldDog' : IDL.Null,
    'CopperDog' : IDL.Null,
    'DiamondDog' : IDL.Null,
  });
  const MiningState = IDL.Variant({ 'STOP' : IDL.Null, 'ACTIVITY' : IDL.Null });
  const MiningType = IDL.Variant({ 'POOL' : IDL.Null, 'ALONE' : IDL.Null });
  const DogContext = IDL.Record({
    'ore' : IDL.Text,
    'ore_cnt' : IDL.Nat64,
    'ore_amount' : IDL.Nat,
    'owner' : IDL.Principal,
    'name' : IDL.Text,
    'ores' : IDL.Vec(DogHash),
    'mining_alliance' : IDL.Opt(IDL.Nat64),
    'dog_level' : DogLevel,
    'ore_difficulty' : IDL.Nat64,
    'create_time' : IDL.Nat64,
    'main_pid' : IDL.Principal,
    'mining_state' : MiningState,
    'mining_type' : MiningType,
  });
  const DogContextOut = IDL.Record({
    'ore_cnt' : IDL.Nat64,
    'ore_amount' : IDL.Nat,
    'dog_id' : IDL.Principal,
    'owner' : IDL.Principal,
    'name' : IDL.Text,
    'mining_alliance' : IDL.Opt(IDL.Nat64),
    'dog_level' : DogLevel,
    'mining_state' : MiningState,
    'mining_type' : MiningType,
  });
  const HomepageCalcInfo = IDL.Record({
    'total_number_of_minder' : IDL.Nat64,
    'block_reward' : IDL.Nat,
    'current_avtive_minders' : IDL.Nat64,
  });
  const OutPoolInfo = IDL.Record({
    'id' : IDL.Nat64,
    'dogs_cnt' : IDL.Vec(IDL.Text),
    'owner' : IDL.Principal,
    'dogs' : IDL.Vec(IDL.Principal),
    'name' : IDL.Text,
    'mining_weight' : IDL.Nat,
  });
  const RecordIndex = IDL.Record({
    'start_idx' : IDL.Nat64,
    'end_idx' : IDL.Nat64,
  });
  const OreHashOut = IDL.Record({
    'cycle_num' : IDL.Nat64,
    'time' : IDL.Nat64,
    'old_ore_rev' : IDL.Text,
    'dog_ore_rev' : IDL.Text,
  });
  const HashRecord = IDL.Record({
    'new_ore' : IDL.Text,
    'old_ore' : IDL.Text,
    'process_ore' : OreHashOut,
    'ore_difficulty' : IDL.Text,
    'process_result_ore' : IDL.Text,
  });
  const MRecord = IDL.Record({
    'ore' : IDL.Text,
    'utc' : IDL.Nat64,
    'owner' : IDL.Principal,
    'high' : IDL.Nat64,
    'reward_amount' : IDL.Nat,
    'dog_level' : DogLevel,
    'alliance_id' : IDL.Opt(IDL.Nat64),
    'hash_record' : IDL.Opt(HashRecord),
    'timestamp' : IDL.Nat64,
    'dog_canister' : IDL.Principal,
  });
  const VerifyDogHash = IDL.Record({
    'dog_hash' : DogHash,
    'create_time' : IDL.Nat64,
  });
  const Result_3 = IDL.Variant({
    'Ok' : IDL.Tuple(IDL.Text, IDL.Nat, IDL.Nat64),
    'Err' : IDL.Text,
  });
  return IDL.Service({
    'add_cycles' : IDL.Func([IDL.Nat, IDL.Principal], [Result], []),
    'create_alliance' : IDL.Func([IDL.Text], [Result_1], []),
    'create_dog' : IDL.Func([IDL.Text], [Result_2], []),
    'cycles' : IDL.Func([], [IDL.Nat64], ['query']),
    'dog_info' : IDL.Func([IDL.Principal], [DogContext], ['query']),
    'dog_level_upgrade' : IDL.Func([IDL.Principal], [Result], []),
    'get_all_dogs_info' : IDL.Func([], [IDL.Vec(DogContextOut)], ['query']),
    'get_block_24h_cnt' : IDL.Func([], [IDL.Nat32], ['query']),
    'get_create_time' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_current_block_reward' : IDL.Func([], [IDL.Nat], ['query']),
    'get_dog_level_str' : IDL.Func([IDL.Principal], [IDL.Text], ['query']),
    'get_dogs' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'get_dogs_info' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(DogContextOut)],
        ['query'],
      ),
    'get_homepage_calc' : IDL.Func([], [HomepageCalcInfo], ['query']),
    'get_miners' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'get_mining_alliance' : IDL.Func([IDL.Nat64], [OutPoolInfo], []),
    'get_mining_alliances' : IDL.Func([], [IDL.Vec(IDL.Nat64)], ['query']),
    'get_ore' : IDL.Func([], [IDL.Text, IDL.Nat64], ['query']),
    'get_record_idx' : IDL.Func([], [RecordIndex], ['query']),
    'get_record_index' : IDL.Func(
        [IDL.Nat64, IDL.Nat64],
        [IDL.Vec(IDL.Tuple(IDL.Nat64, MRecord))],
        ['query'],
      ),
    'get_record_rev' : IDL.Func(
        [IDL.Nat64, IDL.Nat64],
        [IDL.Vec(IDL.Tuple(IDL.Nat64, MRecord))],
        ['query'],
      ),
    'join_alliance' : IDL.Func([IDL.Principal, IDL.Nat64], [Result], []),
    'leave_alliance' : IDL.Func([IDL.Principal, IDL.Nat64], [Result], []),
    'time_until_next_having_days' : IDL.Func([], [IDL.Nat64], ['query']),
    'top_alliance' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Tuple(
              IDL.Text,
              IDL.Nat64,
              IDL.Nat64,
              IDL.Nat64,
              IDL.Nat64,
              IDL.Nat64,
              IDL.Nat,
            )
          ),
        ],
        ['query'],
      ),
    'top_user' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Tuple(
              IDL.Principal,
              IDL.Nat64,
              IDL.Nat64,
              IDL.Nat64,
              IDL.Nat64,
              IDL.Nat,
            )
          ),
        ],
        ['query'],
      ),
    'update_dog_state' : IDL.Func([MiningState], [], []),
    'verify_ore' : IDL.Func([VerifyDogHash], [Result_3], []),
  });
};
export const init = ({ IDL }) => { return []; };
