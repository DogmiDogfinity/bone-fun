export const idlFactory = ({ IDL }) => {
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
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  return IDL.Service({
    'cycles' : IDL.Func([], [IDL.Nat64], ['query']),
    'dog_info' : IDL.Func([], [DogContext], ['query']),
    'dog_level_upgrade' : IDL.Func([IDL.Text], [Result], []),
    'dog_mining_state_update' : IDL.Func([IDL.Text], [Result], []),
    'dog_mining_type_update' : IDL.Func(
        [MiningType, IDL.Opt(IDL.Nat64)],
        [Result],
        [],
      ),
    'get_dog_level' : IDL.Func([], [DogLevel], ['query']),
    'get_dog_state' : IDL.Func(
        [],
        [MiningState, MiningType, DogLevel],
        ['query'],
      ),
  });
};
export const init = ({ IDL }) => {
  return [IDL.Principal, IDL.Opt(IDL.Principal), IDL.Text, IDL.Text, IDL.Nat64];
};
