use std::collections::{HashMap, VecDeque};
use std::borrow::Cow;
use candid::{CandidType, decode_one, Deserialize, encode_one, Int, Nat, Principal};
use ic_stable_structures::{BoundedStorable, Storable};
use crate::utils::new_zero;


#[derive( Deserialize, CandidType, Clone, Debug, PartialEq)]
pub enum DogLevel {
    CopperDog,
    SilverDog,
    GoldDog,
    DiamondDog,
}

impl DogLevel {
    pub fn weight(&self) -> u32 {
        match self {
            DogLevel::CopperDog => 1,
            DogLevel::SilverDog => 2,
            DogLevel::GoldDog => 3,
            DogLevel::DiamondDog => 5,
        }
    }

    pub fn time_frequency(&self) -> u64 {
        match self {
            DogLevel::CopperDog => 120,
            DogLevel::SilverDog => 110,
            DogLevel::GoldDog => 100,
            DogLevel::DiamondDog => 90,
        }
    }


}

impl From<String> for DogLevel {
    fn from(value: String) -> Self {
        match value.as_str() {
            "CopperDog" => Self::CopperDog,
            "SilverDog" => Self::SilverDog,
            "GoldDog" => Self::GoldDog,
            "DiamondDog" => Self::DiamondDog,
            _ => panic!("type error"),
        }
    }
}

impl ToString for DogLevel {
    fn to_string(&self) -> String {
        match self {
            DogLevel::CopperDog => String::from("CopperDog"),
            DogLevel::SilverDog => String::from("SilverDog"),
            DogLevel::GoldDog => String::from("GoldDog"),
            DogLevel::DiamondDog => String::from("DiamondDog"),
            _ => panic!("type error"),
        }
    }
}

#[derive( PartialEq, CandidType, Deserialize, Clone, Debug)]
pub enum MiningState {
    ACTIVITY,
    STOP,
}

impl From<String> for MiningState {
    fn from(value: String) -> Self {
        match value.as_str() {
            "ACTIVITY" => Self::ACTIVITY,
            "STOP" => Self::STOP,
            _ => panic!("type error"),
        }
    }
}

impl ToString for MiningState {
    fn to_string(&self) -> String {
        match self {
            MiningState::ACTIVITY => String::from("ACTIVITY"),
            MiningState::STOP => String::from("STOP"),
            _ => panic!("type error"),
        }
    }
}

#[derive( PartialEq, CandidType, Deserialize, Clone, Debug)]
pub enum MiningType {
    ALONE,
    POOL,
}

impl From<String> for MiningType {
    fn from(value: String) -> Self {
        match value.as_str() {
            "ALONE" => Self::ALONE,
            "POOL" => Self::POOL,
            _ => panic!("type error"),
        }
    }
}

impl ToString for MiningType {
    fn to_string(&self) -> String {
        match self {
            MiningType::ALONE => String::from("ALONE"),
            MiningType::POOL => String::from("POOL"),
            _ => panic!("type error"),
        }
    }
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct DogContext {
    pub name: String,
    pub main_pid: Principal,
    pub dog_level: DogLevel,
    pub owner: Principal,
    pub mining_type: MiningType,
    pub mining_state: MiningState,
    pub mining_alliance: Option<u64>,
    pub ores: VecDeque<DogHash>,
    pub ore: String,
    pub create_time: u64,
    pub ore_amount: Nat,
    pub ore_cnt: usize,
    pub ore_difficulty: usize,
}

impl Default for DogContext {
    fn default() -> Self {
        DogContext {
            name: "".to_string(),
            main_pid: Principal::anonymous(),
            dog_level: DogLevel::CopperDog,
            owner: Principal::anonymous(),
            mining_type: MiningType::ALONE,
            mining_state: MiningState::STOP,
            mining_alliance: None,
            ores: VecDeque::new(),
            ore: "".to_string(),
            create_time: ic_cdk::api::time(),
            ore_amount: new_zero(),
            ore_cnt: 0,
            ore_difficulty: 5usize
        }
    }
}


impl BoundedStorable for DogContext {
    const MAX_SIZE: u32 = 2048;
    const IS_FIXED_SIZE: bool = false;
}
impl Storable for DogContext {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        decode_one(&bytes).unwrap()
    }
}

#[derive( Deserialize, CandidType, Clone, Debug)]
pub struct DogHash {
    pub ores: Vec<String>,
    pub timestamp: u64,
    pub owner: Principal,
    pub mining_alliance: Option<u64>,
}

#[derive( Deserialize, CandidType, Clone, Debug)]
pub struct VerifyDogHash {
    pub dog_hash: DogHash,
    pub create_time: u64,
}




