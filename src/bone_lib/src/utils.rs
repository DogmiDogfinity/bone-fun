use std::collections::hash_map::DefaultHasher;
use std::fmt::format;
use fxhash::FxHasher32;
use std::hash::{Hash, Hasher};
use ic_cdk::api::time;
use ic_cdk::print;
use sha2::{Sha256, Digest};
use candid::{CandidType, Deserialize, Int, Nat, Principal};
use regex::Regex;

pub const MAX_CYCLES_SIZE: u64 = 100_00000_0000u64;
pub const BASE_CYCLES_SIZE: u64 = 300_00000_0000u64;
pub const CREATE_CYCLES_SIZE: u128 = 1000_00000_0000u128;
pub const PAGE_LIMIT: u64 = 1000u64;
pub const BASE_ORE_DIFFICULTY: usize = 6usize;
pub const MAST_OUT_CNT: u32 = 150;

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct OreHash {
    pub one: String,
    pub tow: String,
    pub time: u64,
    pub cycle_num: u64,
}


impl Hash for OreHash {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.one.hash(state);
        self.tow.hash(state);
        self.time.hash(state);
        self.cycle_num.hash(state);
    }
}

impl OreHash {
    pub fn hash_order(&self) -> String {
        let mut hasher = DefaultHasher::new();
        self.hash(&mut hasher);
        let hash_value = hasher.finish();
        let data = hash_value.to_string();
        let mut hasher = Sha256::new();
        hasher.update(data);
        let result = hasher.finalize();
        format!("{:x}", result)
    }
}

/*pub fn get_hash(hash_one: &str, hash_tow: &str, timestamp: u64) -> String {
    let hashstr = format!("{}{}{}", hash_one, hash_tow, timestamp);
    let mut hasher = FxHasher32::default();
    hashstr.hash(&mut hasher);
    let hash32 = format!("{:08x}-{}", hasher.finish() as u32, ic_cdk::api::canister_balance());
    let digest = md5::compute(hash32);
    format!("{:x}", digest)
}*/

pub fn contains_illegal_str(input: &str) -> Result<(), String> {
    if input.len() > 20 {
        return Err("The name must not exceed 20 characters.".to_string());
    }
    let patterns = vec![
        r"(?i)--",
        r"(?i)#",
        r"(?i)select\s",
        r"(?i)insert\s",
        r"(?i)drop\s",
        r"<script.*?>",
    ];
    let b = patterns.iter().any(|pattern| {
        let re = Regex::new(pattern).unwrap();
        re.is_match(input)
    });
    if b {
        return Err("Input contains illegal characters!".to_string());
    }

    return Ok(());
}

pub fn new_zero() -> Nat {
    Nat::from(0u8)
}

pub fn throw<V>(r: Result<V, String>) -> V {
    match r {
        Ok(v) => { v }
        Err(e) => { panic!("{}", e) }
    }
}

pub fn get_day(create_time: u64, now_time: u64, cycle_time_template: u64) -> u64 {
    let out_day = (now_time - create_time) / 1000_000_000 / (24 * 60 * 60);
    cycle_time_template.clone() - out_day % cycle_time_template.clone()
}




