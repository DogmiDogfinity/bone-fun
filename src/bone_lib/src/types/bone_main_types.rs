use std::borrow::Cow;
use std::collections::HashMap;
use candid::{CandidType, decode_one, Deserialize, encode_one, Int, Nat, Principal};
use ic_cdk::api::time;
use crate::utils::{new_zero, OreHash};
use ic_stable_structures::{BoundedStorable, Storable};
use crate::types::bone_dog_types::{DogLevel, MiningState, MiningType};

const MRECORD_MAX_VALUE_SIZE: u32 = 1024;

const POOLINFO_MAX_VALUE_SIZE: u32 = 12196;
// 1000 pool
const MYPOOLIDS_MAX_VALUE_SIZE: u32 = 8019;
// 1000 dogs
const MYVEC_MAX_VALUE_SIZE: u32 = 12034;


#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct DogContextOut {
    pub name: String,
    pub dog_level: DogLevel,
    pub owner: Principal,
    pub mining_type: MiningType,
    pub mining_state: MiningState,
    pub mining_alliance: Option<u64>,
    pub ore_amount: Nat,
    pub ore_cnt: usize,
    pub dog_id: Principal,
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct MRecordSearchVo {
    pub record_vec: Vec<(u64, MRecord)>,
    pub start: u64,
    pub end: u64,
}


#[derive(CandidType, Clone, Debug, Deserialize)]
pub struct RecordIndex {
    pub start_idx: u64,
    pub end_idx: u64,
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct CalcMainInfo {
    pub block_24h_cnt: u32,
    pub block_reward: Nat,
    pub total_number_of_minder: usize,
    pub current_avtive_minders: usize,
    pub owner_top: Vec<(Principal, u64, u64, u64, u64, Nat)>,
    pub alliance_top: Vec<(String, u64, u64, u64, u64, u64, Nat)>,
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct HomepageCalcInfo {
    pub block_reward: Nat,
    pub total_number_of_minder: usize,
    pub current_avtive_minders: usize,
}


impl Default for CalcMainInfo {
    fn default() -> Self {
        CalcMainInfo {
            block_24h_cnt: 0,
            block_reward: new_zero(),
            total_number_of_minder: 0usize,
            current_avtive_minders: 0usize,
            owner_top: vec![],
            alliance_top: vec![],
        }
    }
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct MainBaseContext {
    // miners: Vec<Principal>,
    // mining_alliances: Vec<Principal>,
    pub ore_difficulty: usize,
    pub owner: Principal,
    pub reward_rate: Nat,
    pub mining_output_amount: Nat,
    pub dog_wasm: Vec<u8>,
    pub bone_token: Principal,
    pub dogmi_token: Principal,
    pub icp_token: Principal,
    pub create_alliance_fee: Nat,
    pub join_alliance_fee: Nat,
    pub create_dog_fee: Nat,
    pub up_level_bone_fee: Nat,
    pub up_level_dogmi_fee: Nat,
    pub ore: String,
    pub cycle_time_template: u64,
    pub create_time: u64,
}

impl Default for MainBaseContext {
    fn default() -> Self {
        MainBaseContext {
            ore_difficulty: 6usize,
            owner: Principal::anonymous(),
            reward_rate: Nat::from(300u64),
            mining_output_amount: Nat::from(500_00000000u64),
            join_alliance_fee: Nat::from(10_00000000u64),
            create_alliance_fee: Nat::from(200_00000000u64),
            up_level_bone_fee: Nat::from(100_00000000u64),
            up_level_dogmi_fee: Nat::from(1000000_00000000u64),
            create_dog_fee: Nat::from(1_00000000u64),
            dog_wasm: vec![],
            bone_token: Principal::anonymous(),
            dogmi_token: Principal::anonymous(),
            icp_token: Principal::anonymous(),
            ore: "".to_string(),
            cycle_time_template: 100,
            create_time: 1731060276901837727u64,
        }
    }
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct MRecord {
    pub high: u64,
    pub ore: String,
    pub dog_canister: Principal,
    pub alliance_id: Option<u64>,
    pub timestamp: u64,
    pub utc: u64,
    pub reward_amount: Nat,
    pub owner: Principal,
    pub dog_level: DogLevel,
    pub hash_record: Option<HashRecord>,
}


#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct OreHashOut {
    pub old_ore_rev: String,
    pub dog_ore_rev: String,
    pub time: u64,
    pub cycle_num: u64,
}
#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct HashRecord {
    pub new_ore: String,
    pub old_ore: String,
    pub process_ore: OreHashOut,
    pub process_result_ore: String,
    pub ore_difficulty: String,
}



impl BoundedStorable for MRecord {
    const MAX_SIZE: u32 = MRECORD_MAX_VALUE_SIZE;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for MRecord {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        decode_one(&bytes).unwrap()
    }
}

#[derive(CandidType, Deserialize, Clone, PartialOrd, Ord, Eq, PartialEq)]
pub struct MyPrincipal(pub Principal);

impl Storable for MyPrincipal {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for MyPrincipal {
    const MAX_SIZE: u32 = 45;
    const IS_FIXED_SIZE: bool = false;
}

impl MyPrincipal {
    pub fn get_principal(&self) -> Principal {
        self.0.clone()
    }
}

#[derive(CandidType, Deserialize, Clone)]
pub struct MyVec(pub Vec<Principal>);

impl Storable for MyVec {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for MyVec {
    const MAX_SIZE: u32 = MYVEC_MAX_VALUE_SIZE;
    const IS_FIXED_SIZE: bool = false;
}

impl MyVec {
    pub fn get_vec(&self) -> Vec<Principal> {
        self.0.clone()
    }
}

#[derive(CandidType, Deserialize, Clone)]
pub struct MyPoolIds(pub Vec<u64>);

impl Storable for MyPoolIds {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for MyPoolIds {
    const MAX_SIZE: u32 = MYPOOLIDS_MAX_VALUE_SIZE;
    const IS_FIXED_SIZE: bool = false;
}

impl MyPoolIds {
    pub fn get_vec(&self) -> Vec<u64> {
        self.0.clone()
    }
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct OutPoolInfo {
    pub owner: Principal,
    pub name: String,
    pub id: u64,
    pub dogs: Vec<Principal>,
    pub dogs_cnt: Vec<String>,
    pub mining_weight: Nat,
}


#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct PoolInfo {
    pub owner: Principal,
    pub name: String,
    pub id: u64,
    pub dogs: Vec<Principal>,
    pub mining_weight: Nat,
}

impl Storable for PoolInfo {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        decode_one(&bytes).unwrap()
    }
}

impl BoundedStorable for PoolInfo {
    const MAX_SIZE: u32 = POOLINFO_MAX_VALUE_SIZE;
    const IS_FIXED_SIZE: bool = false;
}

impl Default for PoolInfo {
    fn default() -> Self {
        PoolInfo {
            owner: Principal::anonymous(),
            name: "".to_string(),
            id: 0u64,
            dogs: vec![],
            mining_weight: new_zero(),
        }
    }
}
