use candid::{candid_method, CandidType, Deserialize, Nat, encode_args, Principal};
use ic_cdk::{call, caller, print, id};
use std::{borrow::Cow, cell::RefCell, cell::Cell};
use std::ffi::c_int;
use std::time::Duration;
use std::ops::{Div, Mul};
use ic_cdk::api::management_canister::main::{canister_status, CanisterIdRecord, CanisterInstallMode, CanisterSettings, create_canister, CreateCanisterArgument, delete_canister, install_code, InstallCodeArgument, stop_canister, update_settings, UpdateSettingsArgument};
use ic_cdk::api::call::{CallResult, RejectionCode};
use ic_cdk_macros::*;
use bone_lib::utils::{BASE_CYCLES_SIZE, BASE_ORE_DIFFICULTY, contains_illegal_str, CREATE_CYCLES_SIZE, get_day, MAST_OUT_CNT, MAX_CYCLES_SIZE, new_zero, OreHash, PAGE_LIMIT, throw};
use bone_lib::types::bone_main_types::{MRecordSearchVo, RecordIndex, MRecord, CalcMainInfo, MainBaseContext, MyPrincipal, MyPoolIds, MyVec, PoolInfo, OutPoolInfo, HomepageCalcInfo, DogContextOut, HashRecord, OreHashOut};
use bone_lib::types::bone_dog_types::{DogContext, DogHash, DogLevel, MiningState, MiningType, VerifyDogHash};
use ic_stable_structures::{BoundedStorable, DefaultMemoryImpl, StableBTreeMap, BTreeMap};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use serde_json::Value;

// use chrono::Utc;
use std::sync::{Arc, Mutex};
use ic_cdk::api::time;
use bone_lib::guard::CallerGuard;
use bone_lib::interface::{idog, itoken};
use bone_lib::interface::idog::IDog;
use bone_lib::interface::itoken::{Account, IToken, mint_cycles, mint_transfer, principal_to_account, TransferArg, TransferResult};
use std::cmp::Reverse;
use std::collections::{HashMap, VecDeque};

type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static LOG_COUNTER: Cell<u64> = Cell::new(0);
    static POOL_COUNTER: Cell<u64> = Cell::new(0);
    static CALC_CONTEXT: Arc<Mutex<CalcMainInfo>> = Arc::new(Mutex::new(CalcMainInfo::default()));
    static BASE_CONTEXT: Arc<Mutex<MainBaseContext>> = Arc::new(Mutex::new(MainBaseContext::default()));

    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    static ORE_RECORD: RefCell<StableBTreeMap<u64, MRecord, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
        )
    );
    // all pools
    static MINING_POOLS_MAP: RefCell<StableBTreeMap<u64, PoolInfo, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
        )
    );
    // my pools
    static MINERS_POOLS_MAP: RefCell<StableBTreeMap<MyPrincipal, MyPoolIds, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3))),
        )
    );
    // my dogs
    static MINERS_MAP: RefCell<StableBTreeMap<MyPrincipal, MyVec, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2))),
        )
    );
    // dogs info
    static DOGS_MAP: RefCell<StableBTreeMap<MyPrincipal, DogContext, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4))),
        )
    );
}

#[cfg(feature = "local")]
pub const ENV: &str = "local";
#[cfg(feature = "pro")]
pub const ENV: &str = "pro";

#[init]
#[candid_method(init)]
fn init() {
    let caller: Principal = caller();
    let cid = Principal::anonymous();
    init_content(caller, cid);
    // calc();
}

fn init_content(caller: Principal, cid: Principal) {
    let oreHash = OreHash {
        one: caller.to_text(),
        tow: cid.to_text(),
        time: time(),
        cycle_num: cycles(),
    };
    let ore = oreHash.hash_order();
    BASE_CONTEXT.with(|con| {
        let mut context = con.lock().unwrap();
        context.owner = caller;
        context.dog_wasm = include_bytes!("../../../target/wasm32-unknown-unknown/release/bone_dog-opt-did.wasm.gz").to_vec();
        let canister_ids = match ENV {
            "local" => include_str!("../../../canisterId/local/canister_ids.json"),
            "pro" => include_str!("../../../canisterId/pro/canister_ids.json"),
            _ => panic!("Unknown environment"),
        };
        let v: Value = serde_json::from_str(canister_ids).expect("JSON was not well-formatted");
        if ENV == "local" {
            context.bone_token = Principal::from_text(v["bone"]["local"].as_str().unwrap()).unwrap();
            context.dogmi_token = Principal::from_text(v["dogmi"]["local"].as_str().unwrap()).unwrap();
            context.icp_token = Principal::from_text(v["icp"]["local"].as_str().unwrap()).unwrap();
        } else {
            context.bone_token = Principal::from_text(v["bone"]["ic"].as_str().unwrap()).unwrap();
            context.dogmi_token = Principal::from_text(v["dogmi"]["ic"].as_str().unwrap()).unwrap();
            context.icp_token = Principal::from_text(v["icp"]["ic"].as_str().unwrap()).unwrap();
        }
        context.ore = ore;
        context.ore_difficulty = 7;
    });
    ic_cdk_timers::set_timer_interval(Duration::from_secs(60 * 60), || ic_cdk::spawn(calc()));
}


#[update]
async fn add_cycles(amount: Nat, canister_id: Principal) -> Result<(), String> {
    if amount <= Nat::from(30_000u64) {
        return Err("The ICP deposit must be greater than 0.0003.".to_string());
    }
    let amount = amount - Nat::from(10_000u64);
    let caller = caller();
    let icp_token = Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap();
    let CYCLE_MINTING_CANISTER = Principal::from_text("rkp4c-7iaaa-aaaaa-aaaca-cai").unwrap();

    let id = id();

    if let Err(e) = transfer_amount(icp_token.clone(), caller.clone(), id.clone(), amount.clone()).await {
        return Err(e);
    }
    to_mint_transfer(CYCLE_MINTING_CANISTER.clone(), canister_id.clone(), icp_token.clone(), amount).await
}

async fn to_mint_transfer(cycles_canister: Principal, to_id: Principal, icp_token: Principal, amount: Nat) -> Result<(), String> {
    match mint_transfer(cycles_canister.clone(), to_id.clone(), icp_token, amount.clone() - Nat::from(10_000u64)).await {
        Ok(high) => {
            match mint_cycles(cycles_canister, high, to_id.clone()).await {
                Ok(_) => {
                    print(format!("to mintXtc {} {} icp success", &to_id, &amount));
                    Ok(())
                }
                Err(e) => Err(e.1)
            }
        }
        Err(e) => {
            return Err(e.1);
        }
    }
}


#[query]
async fn get_homepage_calc() -> HomepageCalcInfo {
    CALC_CONTEXT.with(|cct| {
        let cct = cct.lock().unwrap();
        HomepageCalcInfo {
            block_reward: cct.block_reward.clone(),
            total_number_of_minder: cct.total_number_of_minder.clone(),
            current_avtive_minders: cct.current_avtive_minders.clone(),
        }
    })
}

#[query]
async fn get_block_24h_cnt() -> u32 {
    CALC_CONTEXT.with(|cct| {
        let cct = cct.lock().unwrap();
        cct.block_24h_cnt
    })
}

#[query]
fn get_record_idx() -> RecordIndex {
    // let start = ORE_RECORD.with(|p| p.borrow_mut().first_key_value()).unwrap().0;
    let start = match ORE_RECORD.with(|p| p.borrow().first_key_value()) {
        Some(v) => {
            v.0
        }
        _ => {
            return RecordIndex { start_idx: 0u64, end_idx: 0u64 };
        }
    };

    let end = ORE_RECORD.with(|p| p.borrow_mut().last_key_value()).unwrap().0;
    return RecordIndex {
        start_idx: start,
        end_idx: end,
    };
}

#[query]
async fn top_alliance() -> Vec<(String, u64, u64, u64, u64, u64, Nat)> {
    CALC_CONTEXT.with(|cct| {
        let cct = cct.lock().unwrap();
        cct.alliance_top.clone()
    })
}

#[query]
async fn top_user() -> Vec<(Principal, u64, u64, u64, u64, Nat)> {
    CALC_CONTEXT.with(|cct| {
        let cct = cct.lock().unwrap();
        cct.owner_top.clone()
    })
}

// Upgrade the dog and collect fees.
#[update]
async fn dog_level_upgrade(dog_id: Principal) -> Result<(), String> {
    let caller = caller();
    if Principal::anonymous() == caller {
        return Err("Anonymous user requests are not allowed.".to_string());
    }
    let content = BASE_CONTEXT.with(|con| {
        con.lock().unwrap().clone()
    });
    // assert_eq!(content.owner, caller, "NotOwner");
    let mydog = MyPrincipal(dog_id);
    let miningState = DOGS_MAP.with(|p| p.borrow().get(&mydog).unwrap().mining_state.clone());
    if MiningState::STOP == miningState {
        return Err("Stopped dogs are not allowed to upgrade.".to_string());
    }

    let dogLevel = DOGS_MAP.with(|p| p.borrow().get(&mydog).unwrap().dog_level.clone());
    let (dogLevel, fee, token, accept_user) = match dogLevel {
        DogLevel::CopperDog => (DogLevel::SilverDog, content.up_level_bone_fee.clone(), content.bone_token.clone(), Principal::management_canister()),
        DogLevel::SilverDog => (DogLevel::GoldDog, content.up_level_bone_fee.clone(), content.bone_token.clone(), Principal::management_canister()),
        DogLevel::GoldDog => (DogLevel::DiamondDog, content.up_level_dogmi_fee.clone(), content.dogmi_token.clone(), Principal::from_text("ni4my-zaaaa-aaaaq-aadra-cai").unwrap()),
        DogLevel::DiamondDog => {
            return Err("The dog is at the highest level.".to_string());
        }
    };
    if let Err(e) = transfer_amount(token, caller, accept_user, fee).await {
        return Err(e);
    }
    let idog = IDog {
        cid: dog_id.clone()
    };
    match idog.dog_level_upgrade(dogLevel.clone()).await {
        Ok(_) => {
            DOGS_MAP.with(|p| {
                let mut dogopt = p.borrow_mut();
                let mydog = MyPrincipal(dog_id);
                if let Some(mut dog) = dogopt.get(&mydog) {
                    dog.dog_level = dogLevel;
                    dogopt.insert(mydog, dog);
                };
            });
            Ok(())
        }
        Err(e) => {
            Err(e)
        }
    }
}

// Create a dog.
#[update]
async fn create_dog(dogName: String) -> Result<Principal, String> {
    let checkStr = contains_illegal_str(&dogName);
    if let Err(e) = checkStr {
        return Err(e);
    }
    let content = BASE_CONTEXT.with(|con| {
        con.lock().unwrap().clone()
    });
    let caller = caller();
    if Principal::anonymous() == caller {
        return Err("Anonymous user requests are not allowed.".to_string());
    }
    let localid = id();
    // fee
    if let Err(e) = transfer_amount(content.icp_token.clone(), caller.clone(), localid.clone(), content.create_dog_fee.clone()).await {
        return Err(e);
    }
    let (cid, ) = throw(create_canister(CreateCanisterArgument {
        settings: Some(CanisterSettings {
            controllers: Some(vec![id()]),
            compute_allocation: None,
            memory_allocation: None,
            freezing_threshold: None,
            reserved_cycles_limit: None,
        })
    }, CREATE_CYCLES_SIZE).await.map_err(|e| "Create Pool failed:".to_string() + &*e.1));
    let tid = cid.canister_id;
    let (status, ) = throw(canister_status(cid).await.map_err(|e| e.1));
    assert!(!status.module_hash.is_some(), "Create Token Failed");
    let wasm_module = content.dog_wasm.clone();
    let v: Option<Principal> = None;
    let args = throw(encode_args((caller.clone(), v, content.ore.clone(), dogName.clone(), content.ore_difficulty.clone())).map_err(|_e| "Create Dog Failed".to_string()));
    throw(install_code(InstallCodeArgument {
        mode: CanisterInstallMode::Install,
        canister_id: tid.clone(),
        wasm_module: wasm_module,
        arg: args,
    }).await.map_err(|e: (RejectionCode, String)| e.1));
    let myPrincipalCaller = MyPrincipal(caller.clone());

    MINERS_MAP.with(|p| {
        let mut pmut = p.borrow_mut();
        match pmut.get(&myPrincipalCaller) {
            Some(v) => {
                let mut arr = v.get_vec();
                arr.push(tid.clone());
                pmut.insert(myPrincipalCaller, MyVec(arr));
            }
            _ => {
                let arr = vec![tid.clone()];
                pmut.insert(myPrincipalCaller, MyVec(arr));
            }
        };
    });
    CALC_CONTEXT.with(|cct| {
        let mut cct = cct.lock().unwrap();
        cct.total_number_of_minder = cct.total_number_of_minder + 1;
        cct.current_avtive_minders = cct.current_avtive_minders + 1;
    });
    let mydog = MyPrincipal(tid.clone());

    let dogContext = DogContext {
        name: dogName,
        main_pid: localid.clone(),
        dog_level: DogLevel::CopperDog,
        owner: caller,
        mining_type: MiningType::ALONE,
        mining_state: MiningState::ACTIVITY,
        mining_alliance: None,
        ores: VecDeque::new(),
        create_time: ic_cdk::api::time(),
        ore: content.ore.clone(),
        ore_amount: new_zero(),
        ore_cnt: 0usize,
        ore_difficulty: content.ore_difficulty.clone(),
    };
    DOGS_MAP.with(|p| p.borrow_mut().insert(mydog, dogContext));
    add_main_cycles(localid, tid.clone()).await;
    Ok(tid.clone())
}

async fn add_main_cycles(local_id: Principal, dog_id: Principal) -> Result<(), String> {
    let base_icp_token = BASE_CONTEXT.with(|con|
        con.lock().unwrap().icp_token.clone()
    );
    let icp_token = Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap();
    let CYCLE_MINTING_CANISTER = Principal::from_text("rkp4c-7iaaa-aaaaa-aaaca-cai").unwrap();
    if base_icp_token != icp_token {
        return Ok(());
    }

    let itoken = IToken { cid: icp_token, token_type: "ICRC-2".to_string() };
    let balance = itoken.balance_of(local_id.clone()).await.unwrap().0;
    if balance >= Nat::from(1_0000_0000u64) {
        transfer(icp_token, Principal::from_text("ni4my-zaaaa-aaaaq-aadra-cai".to_string()).unwrap(), Nat::from(300_0000u64) - Nat::from(10_000u64)).await;
        print("to ni4my-zaaaa-aaaaq-aadra-cai success");
        to_mint_transfer(CYCLE_MINTING_CANISTER.clone(), dog_id.clone(), icp_token, Nat::from(6790_0000u64)).await;
        to_mint_transfer(CYCLE_MINTING_CANISTER.clone(), local_id.clone(), icp_token, Nat::from(2910_0000u64)).await
    } else {
        Ok(())
    }
}

#[update]
async fn create_alliance(alliance_name: String) -> Result<u64, String> {
    let checkStr = contains_illegal_str(&alliance_name);
    if let Err(e) = checkStr {
        return Err(e);
    }
    let caller = caller();
    if Principal::anonymous() == caller {
        return Err("Anonymous user requests are not allowed.".to_string());
    }
    let cid = id();
    let content = BASE_CONTEXT.with(|con| {
        con.lock().unwrap().clone()
    });
    if let Err(e) = transfer_amount(content.bone_token.clone(), caller.clone(), Principal::management_canister(), content.create_alliance_fee.clone()).await {
        return Err(e);
    }
    let alliance_id = count_alliance();
    let alliance_info = PoolInfo {
        owner: caller.clone(),
        name: alliance_name,
        id: alliance_id.clone(),
        dogs: vec![],
        mining_weight: new_zero(),
    };
    MINING_POOLS_MAP.with(|p| p.borrow_mut().insert(alliance_id.clone(), alliance_info));

    let mycaller = MyPrincipal(caller.clone());
    MINERS_POOLS_MAP.with(|p| {
        let mut m = p.borrow_mut();
        match m.get(&mycaller) {
            Some(v) => {
                let mut arr = v.get_vec();
                arr.push(alliance_id.clone());
                m.insert(mycaller, MyPoolIds(arr));
            }
            _ => {
                let arr = vec![alliance_id];
                m.insert(mycaller, MyPoolIds(arr));
            }
        }
    });
    Ok(alliance_id)
}

#[update]
async fn join_alliance(dog_id: Principal, alliance_id: u64) -> Result<(), String> {
    let caller = caller();
    if Principal::anonymous() == caller {
        return Err("Anonymous user requests are not allowed.".to_string());
    }
    let mycaller = MyPrincipal(caller.clone());
    let arr = MINERS_MAP.with(|p| {
        let arr = match p.borrow().get(&mycaller) {
            Some(v) => {
                v.get_vec()
            }
            _ => { vec![] }
        };
        arr
    });
    if !arr.contains(&dog_id) {
        return Err("You don't have this dog.".to_string());
    }
    let cid = id();
    let content = BASE_CONTEXT.with(|con| {
        con.lock().unwrap().clone()
    });
    if let Err(e) = transfer_amount(content.bone_token.clone(), caller.clone(), Principal::management_canister(), content.join_alliance_fee.clone()).await {
        return Err(e);
    }
    let idog = IDog {
        cid: dog_id.clone()
    };
    if let Err(e) = idog.dog_mining_type_update(MiningType::POOL, Some(alliance_id.clone())).await {
        return Err(e);
    };

    MINING_POOLS_MAP.with(|p| {
        let mut alliance = p.borrow_mut();
        if let Some(mut alliance_info) = alliance.get(&alliance_id) {
            if !alliance_info.dogs.contains(&dog_id) {
                alliance_info.dogs.push(dog_id.clone());
                alliance.insert(alliance_id, alliance_info);
            }
            DOGS_MAP.with(|p| {
                let mut dogopt = p.borrow_mut();
                let mydog = MyPrincipal(dog_id);
                if let Some(mut dog) = dogopt.get(&mydog) {
                    dog.mining_alliance = Some(alliance_id.clone());
                    dog.mining_type = MiningType::POOL;
                    dogopt.insert(mydog, dog);
                };
            });
            return Ok(());
        } else {
            return Err("Pool not found!".to_string());
        }
    })
}

#[update]
async fn leave_alliance(dog_id: Principal, alliance_id: u64) -> Result<(), String> {
    let caller = caller();
    if Principal::anonymous() == caller {
        return Err("Anonymous user requests are not allowed.".to_string());
    }
    let mycaller = MyPrincipal(caller.clone());
    let arr = MINERS_MAP.with(|p| {
        let arr = match p.borrow().get(&mycaller) {
            Some(v) => {
                v.get_vec()
            }
            _ => { vec![] }
        };
        arr
    });
    if !arr.contains(&dog_id) {
        return Err("You don't have this dog.".to_string());
    }
    let r = MINING_POOLS_MAP.with(|p| {
        let alliance = p.borrow();
        if let Some(alliance_info) = alliance.get(&alliance_id) {
            if !alliance_info.dogs.contains(&dog_id) {
                Err("dog not in this Pool!".to_string())
            } else {
                Ok(())
            }
        } else {
            Err("Pool not found!".to_string())
        }
    });
    if let Err(e) = r {
        return Err(e);
    }
    let idog = IDog {
        cid: dog_id
    };
    if let Err(e) = idog.dog_mining_type_update(MiningType::ALONE, None).await {
        return Err(e);
    };

    MINING_POOLS_MAP.with(|p| {
        let mut alliance = p.borrow_mut();
        if let Some(mut alliance_info) = alliance.get(&alliance_id) {
            alliance_info.dogs.retain(|&x| x != dog_id);
            alliance.insert(alliance_id, alliance_info);
            DOGS_MAP.with(|p| {
                let mut dogopt = p.borrow_mut();
                let mydog = MyPrincipal(dog_id);
                if let Some(mut dog) = dogopt.get(&mydog) {
                    dog.mining_alliance = None;
                    dog.mining_type = MiningType::ALONE;
                    dogopt.insert(mydog, dog);
                };
            });
            return Ok(());
        } else {
            return Err("Pool not found!".to_string());
        }
    })
}

#[update]
async fn update_dog_state(miningState: MiningState) {
    let dog_id = caller();
    DOGS_MAP.with(|p| {
        let mut dogopt = p.borrow_mut();
        let mydog = MyPrincipal(dog_id);
        if let Some(mut dog) = dogopt.get(&mydog) {
            dog.mining_state = miningState.clone();
            let aid = dog.mining_alliance.clone();
            if let MiningState::STOP = miningState {
                dog.mining_type = MiningType::ALONE;
                dog.mining_alliance = None;
                if let Some(alliance_id) = aid {
                    MINING_POOLS_MAP.with(|p| {
                        let mut alliance = p.borrow_mut();
                        if let Some(mut alliance_info) = alliance.get(&alliance_id) {
                            alliance_info.dogs.retain(|&x| x != dog_id);
                            alliance.insert(alliance_id, alliance_info);
                        }
                    });
                }
            }
            dogopt.insert(mydog, dog);
        };
    });
}

// Verify the ore.
#[update]
async fn verify_ore(vdogHash: VerifyDogHash) -> Result<(String, Nat, usize), String> {
    let dog = caller();
    let mydog = MyPrincipal(dog.clone());
    let dogLevel: DogLevel = DOGS_MAP.with(|p| p.borrow().get(&mydog).unwrap().dog_level.clone());
    let weight = dogLevel.weight() as u64;
    let ori_end = match ORE_RECORD.with(|p| p.borrow_mut().last_key_value()) {
        Some(v) => {
            v.0 + 1u64
        }
        _ => 0
    };
    let i = cycles() + ori_end;
    if (weight < 5 && i % 5 > weight) {
        return Ok(("".to_string(), new_zero(), 0));
    }
    let cid = id();
    let dogHash = vdogHash.dog_hash.clone();
    let miner = dogHash.owner;
    let myMinert = MyPrincipal(miner.clone());
    MINERS_MAP.with(|p| {
        let arr = match p.borrow().get(&myMinert) {
            Some(v) => {
                v.get_vec()
            }
            _ => { vec![] }
        };
        if !arr.contains(&dog) {
            print(format!("minter '{}' not have the dog '{}'", &miner, &dog));
            return;
        }
    });
    let ores = dogHash.ores;
    let guard = CallerGuard::new(cid);
    if guard.is_err() {
        return Err("Please wait in line and try again later.".to_string());
    }
    let context = BASE_CONTEXT.with(|con| {
        con.lock().unwrap().clone()
    });

    let ore = context.ore.clone();
    let difficulty = context.ore_difficulty.clone();
    let mut ore_reward_amount = new_zero();
    for value in &ores {
        if value[0..difficulty.clone() as usize] == ore[0..difficulty.clone() as usize] {
            let one_day_time = time() - 1000000000u64 * 60 * 60 * 24;
            let mut one_day_out_cnt = 0u32;
            match ORE_RECORD.with(|p| p.borrow().first_key_value()) {
                Some(v) => {
                    let start = v.0.clone();
                    let end_index = ORE_RECORD.with(|p| p.borrow_mut().last_key_value()).unwrap().0;
                    let end = end_index.clone() + 1;
                    let last_ore_utc: u64 = ORE_RECORD.with(|p| p.borrow().get(&end_index).unwrap()).utc;
                    for i in (start..end).rev() {
                        let h = ORE_RECORD.with(|p| p.borrow().get(&i));
                        if h.is_some() {
                            let mrecord: MRecord = h.unwrap();
                            if mrecord.utc > one_day_time {
                                one_day_out_cnt += 1;
                            } else {
                                break;
                            }
                        }
                    }

                    if one_day_out_cnt >= MAST_OUT_CNT {
                        return Ok(("".to_string(), new_zero(), 0));
                    }

                    if one_day_out_cnt < 50 && difficulty > BASE_ORE_DIFFICULTY && time() - last_ore_utc.clone() > 1000_000_000u64 * 60 * 15 {
                        BASE_CONTEXT.with(|con| {
                            let mut context = con.lock().unwrap();
                            print("ore_difficulty - 1");
                            context.ore_difficulty = difficulty.clone() - 1;
                        });
                    }
                    if one_day_out_cnt >= 90 && time() - last_ore_utc.clone() < 1000_000_000u64 * 60 * 15 {
                        BASE_CONTEXT.with(|con| {
                            let mut context = con.lock().unwrap();
                            print("ore_difficulty + 1");
                            context.ore_difficulty = difficulty.clone() + 1;
                        });
                    }
                }
                _ => {}
            };
            // award
            let (reward_amount, fee_amount) = get_award_amount();
            match dogHash.mining_alliance {
                Some(pid) => {
                    let alliance_info: PoolInfo = MINING_POOLS_MAP.with(|p| p.borrow().get(&pid).unwrap());
                    let mut total_map_amount = HashMap::new();
                    let mut total_amount = 0u32;
                    for d in alliance_info.dogs {
                        let mydog = MyPrincipal(d.clone());
                        let dcontext = DOGS_MAP.with(|p| p.borrow().get(&mydog).unwrap().clone());
                        if dcontext.mining_state == MiningState::ACTIVITY {
                            let dog_weight = dcontext.dog_level.weight();
                            let user_weight = total_map_amount.entry(format!("{},{}", dcontext.owner.clone().to_text(), d.clone().to_text())).or_insert(0);
                            *user_weight += dog_weight.clone();
                            total_amount += dog_weight;
                        }
                    }
                    for (user, w) in &total_map_amount {
                        if let Some((user_id, did)) = user.split_once(',') {
                            let v = reward_amount.clone() * w.clone() / total_amount.clone();
                            transfer(context.bone_token.clone(), Principal::from_text(user_id.to_string()).unwrap(), v).await;
                        }
                    }
                }
                _ => {
                    if reward_amount > new_zero() {
                        if let Err(e) = transfer(context.bone_token.clone(), miner.clone(), reward_amount.clone()).await {
                            print(format!("transfer_amount {} error:{}", &miner, &e));
                            return Err(e);
                        }
                    }
                }
            }
            if fee_amount > new_zero() {
                transfer(context.bone_token.clone(), Principal::from_text("ni4my-zaaaa-aaaaq-aadra-cai".to_string()).unwrap(), fee_amount.clone()).await;
            }
            // crate ore and add new ore
            let oreHash = OreHash {
                one: ore.clone().chars().rev().collect(),
                tow: value.clone().chars().rev().collect(),
                time: time(),
                cycle_num: cycles(),
            };
            let process_result_ore: String = oreHash.hash_order();
            let new_ore: String = process_result_ore.clone().chars().rev().collect();
            BASE_CONTEXT.with(|con| {
                let mut context = con.lock().unwrap();
                context.ore = new_ore.clone();
            });
            // add calc
            CALC_CONTEXT.with(|cct| {
                let mut cct = cct.lock().unwrap();
                cct.block_reward = cct.block_reward.clone() + reward_amount.clone();
            });
            ore_reward_amount = reward_amount.clone();
            // add log
            let oreHashOut = OreHashOut {
                old_ore_rev: oreHash.one.clone(),
                dog_ore_rev: oreHash.tow.clone(),
                time: oreHash.time.clone(),
                cycle_num: oreHash.cycle_num.clone(),
            };
            let haseReocr = HashRecord {
                new_ore: new_ore,
                old_ore: ore.clone(),
                process_ore: oreHashOut,
                process_result_ore: process_result_ore,
                ore_difficulty: difficulty.to_string(),
            };
            add_ore_log(value.clone(), dog.clone(), dogHash.timestamp, time(), dogHash.mining_alliance.clone(),
                        reward_amount.clone(), dogHash.owner.clone(), haseReocr);
            print(format!("{}dog:{} to verify success reward_amount:{}; fee_amount:{}", &miner, &dog, &reward_amount, &fee_amount));
            DOGS_MAP.with(|p| {
                let mut dogopt = p.borrow_mut();
                let mydog = MyPrincipal(dog.clone());
                if let Some(mut dog) = dogopt.get(&mydog) {
                    dog.ore_amount = dog.ore_amount.clone() + reward_amount.clone();
                    dog.ore_cnt = dog.ore_cnt.clone() + 1;
                    dogopt.insert(mydog, dog);
                };
            });
            break;
        }
    }
    let ore = BASE_CONTEXT.with(|con| con.lock().unwrap().ore.clone());
    let ore_difficulty = BASE_CONTEXT.with(|con| con.lock().unwrap().ore_difficulty.clone());

    Ok((ore, ore_reward_amount, ore_difficulty))
}

#[query]
fn get_record_index(start: u64, limit: u64) -> Vec<(u64, MRecord)> {
    let tx = ORE_RECORD.with(|p| p.borrow().range(start..(start + limit)).collect::<Vec<(u64, MRecord)>>());
    tx
}

#[query]
fn get_record_rev(start: u64, limit: u64) -> Vec<(u64, MRecord)> {
    let startusize = start.clone() as usize;
    if start > PAGE_LIMIT {
        return vec![];
    }
    let ori_end = match ORE_RECORD.with(|p| p.borrow_mut().last_key_value()) {
        Some(v) => {
            v.0 + 1u64
        }
        _ => 0
    };
    if ori_end == 0 {
        return vec![];
    }

    let ori_start = if ori_end > PAGE_LIMIT {
        ori_end.clone() - PAGE_LIMIT
    } else {
        0u64
    };

    let mut tx = ORE_RECORD.with(|p| p.borrow().range(ori_start..ori_end).collect::<Vec<(u64, MRecord)>>()).clone();
    tx.reverse();
    let len = tx.len() as u64;
    if start >= len {
        return vec![];
    }

    let end = if start.clone() + limit.clone() >= len {
        len - 1
    } else {
        start.clone() + limit.clone()
    };
    tx[startusize..end as usize].to_vec().clone()
}

#[query]
fn get_ore() -> (String, usize) {
    let content = BASE_CONTEXT.with(|con| {
        con.lock().unwrap().clone()
    });
    (content.ore.clone(), content.ore_difficulty.clone())
}

#[query]
async fn get_mining_alliances() -> Vec<u64> {
    let v: Vec<u64> = MINING_POOLS_MAP.with(|map| {
        let map_ref = map.borrow();
        let mut keys: Vec<u64> = Vec::new();
        for (key, _) in map_ref.iter() {
            keys.push(key); // Collect all keys
        }
        keys
    });
    v
}

#[update]
async fn get_mining_alliance(alliance_id: u64) -> OutPoolInfo {
    let p: Option<PoolInfo> = MINING_POOLS_MAP.with(|map| {
        map.borrow().get(&alliance_id)
    });
    match p {
        Some(v) => {
            let dogs = v.dogs.clone();
            let mut arr = (0, 0, 0, 0);
            for d in dogs {
                let mydog = MyPrincipal(d.clone());
                DOGS_MAP.with(|dogmap| {
                    if let Some(dog_content) = dogmap.borrow().get(&mydog) {
                        match dog_content.dog_level.clone() {
                            DogLevel::CopperDog => {
                                arr.0 = arr.0 + 1;
                            }
                            DogLevel::SilverDog => {
                                arr.1 = arr.1 + 1;
                            }
                            DogLevel::GoldDog => {
                                arr.2 = arr.2 + 1;
                            }
                            DogLevel::DiamondDog => {
                                arr.3 = arr.3 + 1;
                            }
                        }
                    }
                });
            }
            let all_ore = arr.0 * DogLevel::CopperDog.weight() + arr.1 * DogLevel::SilverDog.weight() +
                arr.2 * DogLevel::GoldDog.weight() + arr.3 * DogLevel::DiamondDog.weight();
            let out = OutPoolInfo {
                owner: v.owner.clone(),
                name: v.name.clone(),
                id: v.id.clone(),
                dogs: v.dogs.clone(),
                dogs_cnt: vec![format!("CopperDog {}", arr.0), format!("SilverDog {}", arr.1), format!("GoldDog {}", arr.2), format!("DiamondDog {}", arr.3)],
                mining_weight: Nat::from(all_ore),
            };
            out
        }
        _ => {
            OutPoolInfo {
                owner: Principal::anonymous(),
                name: "".to_string(),
                id: 0u64,
                dogs: vec![],
                dogs_cnt: vec![],
                mining_weight: new_zero(),
            }
        }
    }
}


#[query]
async fn get_miners() -> Vec<Principal> {
    MINERS_MAP.with(|map| {
        let map_ref = map.borrow();
        let mut keys: Vec<Principal> = Vec::new();
        for (key, _) in map_ref.iter() {
            keys.push(key.get_principal()); // Collect all keys
        }
        keys
    })
}

#[query]
async fn get_dogs() -> Vec<Principal> {
    let caller = caller();
    if Principal::anonymous() == caller {
        panic!("Anonymous user requests are not allowed.");
    }
    let mycaller = MyPrincipal(caller);
    MINERS_MAP.with(|p| {
        match p.borrow().get(&mycaller) {
            Some(v) => {
                v.get_vec()
            }
            _ => { vec![] }
        }
    })
}

#[query]
async fn get_dogs_info(user_id: Principal) -> Vec<DogContextOut> {
    let mycaller = MyPrincipal(user_id);
    let arr: Vec<Principal> = MINERS_MAP.with(|p| {
        match p.borrow().get(&mycaller) {
            Some(v) => {
                v.get_vec()
            }
            _ => { vec![] }
        }
    });
    let mut dogs = vec![];
    for a in arr {
        DOGS_MAP.with(|p| {
            let mydog = MyPrincipal(a.clone());
            if let Some(dog) = p.borrow().get(&mydog) {
                let outdog = DogContextOut {
                    name: dog.name.clone(),
                    dog_level: dog.dog_level.clone(),
                    owner: dog.owner.clone(),
                    mining_type: dog.mining_type.clone(),
                    mining_state: dog.mining_state.clone(),
                    mining_alliance: dog.mining_alliance.clone(),
                    ore_amount: dog.ore_amount.clone(),
                    ore_cnt: dog.ore_cnt.clone(),
                    dog_id: a,
                };
                dogs.push(outdog);
            }
        })
    };
    dogs
}

#[query]
async fn get_all_dogs_info() -> Vec<DogContextOut> {
    let mut dogs = vec![];
    DOGS_MAP.with(|map| {
        let map_ref = map.borrow();
        for (a, dog) in map_ref.iter() {
            let outdog = DogContextOut {
                name: dog.name.clone(),
                dog_level: dog.dog_level.clone(),
                owner: dog.owner.clone(),
                mining_type: dog.mining_type.clone(),
                mining_state: dog.mining_state.clone(),
                mining_alliance: dog.mining_alliance.clone(),
                ore_amount: dog.ore_amount.clone(),
                ore_cnt: dog.ore_cnt.clone(),
                dog_id: a.get_principal(),
            };
            dogs.push(outdog);
        }
    });
    dogs
}

#[query]
async fn dog_info(dog: Principal) -> DogContext {
    DOGS_MAP.with(|p| {
        let mydog = MyPrincipal(dog);
        if let Some(dog) = p.borrow().get(&mydog) {
            dog.clone()
        } else {
            DogContext::default()
        }
    })
}

#[query]
async fn get_dog_level_str(dog: Principal) -> String {
    DOGS_MAP.with(|p| {
        let mydog = MyPrincipal(dog);
        if let Some(dog) = p.borrow().get(&mydog) {
            dog.dog_level.clone().to_string()
        } else {
            "".to_string()
        }
    })
}

#[query]
async fn time_until_next_having_days() -> u64 {
    let create_time = BASE_CONTEXT.with(|con| con.lock().unwrap().create_time.clone());
    let cycle_time_template = BASE_CONTEXT.with(|con| con.lock().unwrap().cycle_time_template.clone());
    get_day(create_time, time(), cycle_time_template)
}

#[query]
fn get_create_time() -> u64 {
    BASE_CONTEXT.with(|con| con.lock().unwrap().create_time.clone())
}

#[query]
fn get_current_block_reward() -> (Nat) {
    let context = BASE_CONTEXT.with(|con| {
        con.lock().unwrap().clone()
    });
    let fee: Nat = context.mining_output_amount.clone();
    let create_time = context.create_time.clone();
    let out_day = (time() - create_time) / 1000_000_000 / (24 * 60 * 60);
    let k = out_day / context.cycle_time_template.clone();
    if k > 64 {
        new_zero()
    } else {
        fee.div(Nat::from(2u64.pow(k as u32)))
    }
}

#[query]
fn cycles() -> u64 {
    ic_cdk::api::canister_balance()
}

#[pre_upgrade]
fn pre_upgrade() {}

#[post_upgrade]
fn post_upgrade() {
    let caller: Principal = caller();
    let cid = id();
    init_content(caller, cid);

    LOG_COUNTER.with(|counter| {
        let end: u64 = match ORE_RECORD.with(|p| p.borrow().last_key_value()) {
            Some(v) => { v.0 }
            _ => { 0 }
        };
        counter.set(end);
    });

    POOL_COUNTER.with(|counter| {
        let end: u64 = match MINING_POOLS_MAP.with(|p| p.borrow().last_key_value()) {
            Some(v) => { v.0 }
            _ => { 0 }
        };
        counter.set(end);
    });
}

#[cfg(any(target_arch = "wasm32", test))]
fn main() {}

#[cfg(not(any(target_arch = "wasm32", test)))]
fn main() {
    candid::export_service!();
    std::print!("{}", __export_service());
}

#[query]
fn get_base_content() -> MainBaseContext {
    let caller = caller();
    let content = BASE_CONTEXT.with(|con| {
        con.lock().unwrap().clone()
    });
    assert_eq!(content.owner, caller, "NotOwner");
    content
}

fn count_log() -> u64 {
    let count = LOG_COUNTER.with(|counter| {
        let count = counter.get() + 1;
        counter.set(count);
        count
    });
    count
}

fn count_alliance() -> u64 {
    let count = POOL_COUNTER.with(|counter| {
        let count = counter.get() + 1;
        counter.set(count);
        count
    });
    count
}

async fn calc() {
    let time: u64 = time();
    let mut ore = new_zero();
    let one_day_time = time.clone() - 1000000000u64 * 60 * 60 * 24;
    let one_hour_time = time.clone() - 1000000000u64 * 60 * 60;

    let mut one_day_out_cnt = 0u32;
    let mut one_hour_out_cnt = 0u32;

    match ORE_RECORD.with(|p| p.borrow().first_key_value()) {
        Some(v) => {
            let start = v.0.clone();
            let end = ORE_RECORD.with(|p| p.borrow().last_key_value()).unwrap().0 + 1;
            for i in (start..end).rev() {
                let h = ORE_RECORD.with(|p| p.borrow().get(&i));
                if h.is_some() {
                    let mrecord: MRecord = h.unwrap();
                    if mrecord.utc > one_day_time {
                        one_day_out_cnt += 1;
                    }
                    if mrecord.utc > one_hour_time {
                        one_hour_out_cnt += 1;
                    }
                    ore = ore + mrecord.reward_amount.clone();
                }
            }
        }
        _ => {}
    };
    if one_day_out_cnt < MAST_OUT_CNT {
        let end_index = ORE_RECORD.with(|p| p.borrow_mut().last_key_value()).unwrap().0;
        let last_ore_utc: u64 = ORE_RECORD.with(|p| p.borrow().get(&end_index).unwrap()).utc;
        if time.clone() - last_ore_utc > 1000000000u64 * 60 * 40 {
            BASE_CONTEXT.with(|con| {
                let mut context = con.lock().unwrap();
                if context.ore_difficulty > BASE_ORE_DIFFICULTY {
                    print("ore_difficulty - 1");
                    context.ore_difficulty = context.ore_difficulty.clone() - 1;
                }
            });
        }
    }

    if one_hour_out_cnt >= 10 {
        BASE_CONTEXT.with(|con| {
            let mut context = con.lock().unwrap();
            context.ore_difficulty = context.ore_difficulty.clone() + 1;
        });
    }

    let mut dog_activity_cnt = 0usize;
    let mut parr = vec![];
    MINERS_MAP.with(|map| {
        let map_ref = map.borrow();
        for (key, value) in map_ref.iter() {
            let arr: Vec<Principal> = value.get_vec();
            parr.extend(arr);
        }
    });

    for p in parr.clone() {
        let mydog = MyPrincipal(p.clone());
        DOGS_MAP.with(|dogmap| {
            if let Some(dog_content) = dogmap.borrow().get(&mydog) {
                if MiningState::ACTIVITY == dog_content.mining_state {
                    dog_activity_cnt = dog_activity_cnt + 1;
                }
            }
        });
    }

    let (owner_top, alliance_top) = top10_owners_and_alliances().await;


    CALC_CONTEXT.with(|cct| {
        let mut cct = cct.lock().unwrap();
        cct.block_reward = ore;
        cct.total_number_of_minder = parr.len();
        cct.current_avtive_minders = dog_activity_cnt;
        cct.owner_top = owner_top;
        cct.alliance_top = alliance_top;
        cct.block_24h_cnt = one_day_out_cnt;
    });
}

async fn transfer(token: Principal, user: Principal, amount: Nat) -> Result<(), String> {
    let itoken = IToken {
        cid: token.clone(),
        token_type: "ICRC-2".to_string(),
    };
    let result = itoken.transfer(user, amount.clone(), time().to_string()).await;
    if let Err(v) = result {
        print(format!("transfer error:{}; amount:{}", &v.1, &amount));
        return Err(v.1);
    }
    Ok(())
}

async fn transfer_amount(token: Principal, caller: Principal, cid: Principal, amount: Nat) -> Result<(), String> {
    let itoken = IToken {
        cid: token.clone(),
        token_type: "ICRC-2".to_string(),
    };
    let result = itoken.transfer_from(caller, cid, amount.clone(), time().to_string()).await;
    if let Err(v) = result {
        print(format!("transfer_amount error:{}; amount:{}", &v.1, &amount));
        return Err(v.1);
    }
    Ok(())
}

#[query]
fn get_award_amount() -> (Nat, Nat) {
    let context = BASE_CONTEXT.with(|con| {
        con.lock().unwrap().clone()
    });
    let fee: Nat = context.mining_output_amount.clone();
    let reward_rate = context.reward_rate.clone();
    let create_time = context.create_time.clone();
    let out_day = (time() - create_time) / 1000_000_000 / (24 * 60 * 60);
    let k = out_day / context.cycle_time_template.clone();
    let fee = if k > 64 {
        new_zero()
    } else {
        fee.div(Nat::from(2u64.pow(k as u32)))
    };
    if fee == 0u64 {
        (new_zero(), new_zero())
    } else {
        let fee_amount = fee.clone().mul(reward_rate.clone()) / Nat::from(10000u16);
        (fee - fee_amount.clone(), fee_amount)
    }
}

fn get_alliance_all_ore(alliance: u64) -> Nat {
    let start = match ORE_RECORD.with(|p| p.borrow().first_key_value()) {
        Some(v) => {
            v.0
        }
        _ => {
            return new_zero();
        }
    };
    let end = ORE_RECORD.with(|p| p.borrow().last_key_value()).unwrap().0 + 1;
    let mut ore = new_zero();
    for i in (start..end).rev() {
        let h = ORE_RECORD.with(|p| p.borrow().get(&i));
        if h.is_some() {
            let mrecord: MRecord = h.unwrap();
            if let Some(v) = mrecord.alliance_id {
                if v == alliance {
                    ore = ore + mrecord.reward_amount.clone();
                }
            }
        }
    }
    ore
}

fn add_ore_log(ore: String, caller: Principal, timestamp: u64, utc: u64, alliance_id: Option<u64>,
               reward_amount: Nat, owner: Principal, hashRecor: HashRecord) {
    let high = count_log();

    let mydog = MyPrincipal(caller.clone());
    let dog_level = DOGS_MAP.with(|dogmap| {
        if let Some(dog_content) = dogmap.borrow().get(&mydog) {
            dog_content.dog_level.clone()
        } else {
            DogLevel::CopperDog
        }
    });
    let record = MRecord {
        high: high.clone(),
        ore,
        dog_canister: caller,
        timestamp,
        alliance_id,
        utc,
        reward_amount,
        owner,
        dog_level,
        hash_record: Some(hashRecor),
    };
    ORE_RECORD.with(|p| p.borrow_mut().insert(high, record));
}


async fn top10_owners_and_alliances() -> (Vec<(Principal, u64, u64, u64, u64, Nat)>, Vec<(String, u64, u64, u64, u64, u64, Nat)>) {
    let mut owner_rewards: HashMap<Principal, (u64, u64, u64, u64, Nat)> = HashMap::new();
    let mut alliance_rewards: HashMap<String, (u64, u64, u64, u64, Nat)> = HashMap::new();
    let mut activity_dogs = vec![];
    // get user
    MINERS_MAP.with(|map| {
        let map_ref = map.borrow();
        for (key, mydogs) in map_ref.iter() {
            let user = key.get_principal();
            let entry = owner_rewards.entry(user.clone()).or_insert((
                0u64,
                0u64,
                0u64,
                0u64,
                new_zero()
            ));
            let dogs = mydogs.get_vec();
            for dog in dogs {
                let mydog = MyPrincipal(dog.clone());
                DOGS_MAP.with(|dogmap| {
                    if let Some(dog_content) = dogmap.borrow().get(&mydog) {
                        if dog_content.mining_state == MiningState::ACTIVITY {
                            activity_dogs.push(dog.clone());
                        }

                        entry.4 += dog_content.ore_cnt.clone();
                        match dog_content.dog_level {
                            DogLevel::CopperDog => {
                                entry.0 += 1;
                            }
                            DogLevel::SilverDog => {
                                entry.1 += 1;
                            }
                            DogLevel::GoldDog => {
                                entry.2 += 1;
                            }
                            DogLevel::DiamondDog => {
                                entry.3 += 1;
                            }
                        }
                    }
                });
            }
        }
    });

    for dog_id in activity_dogs {
        let idog = IDog { cid: dog_id.clone() };
        let dcontext = idog.dog_info().await;
        if dcontext.mining_state == MiningState::STOP {
            DOGS_MAP.with(|p| {
                let mut dogopt = p.borrow_mut();
                let mydog = MyPrincipal(dog_id);
                if let Some(mut dog) = dogopt.get(&mydog) {
                    dog.mining_state = MiningState::STOP;
                    let aid = dog.mining_alliance.clone();
                    dog.mining_type = MiningType::ALONE;
                    dog.mining_alliance = None;
                    if let Some(alliance_id) = aid {
                        MINING_POOLS_MAP.with(|p| {
                            let mut alliance = p.borrow_mut();
                            if let Some(mut alliance_info) = alliance.get(&alliance_id) {
                                alliance_info.dogs.retain(|&x| x != dog_id);
                                alliance.insert(alliance_id, alliance_info);
                            }
                        });
                    }
                    dogopt.insert(mydog, dog);
                };
            });
        }
    }

    MINING_POOLS_MAP.with(|map| {
        let map_ref = map.borrow();
        for (alliance_id, alliance_info) in map_ref.iter() {
            let alliance_entry = alliance_rewards.entry(format!("{}_{}", alliance_id.clone(), alliance_info.name.clone())).or_insert((
                0u64,
                0u64,
                0u64,
                0u64,
                new_zero()
            ));
            let dogs = alliance_info.dogs.clone();
            for dog in dogs {
                let mydog = MyPrincipal(dog.clone());
                DOGS_MAP.with(|dogmap| {
                    if let Some(dog_content) = dogmap.borrow().get(&mydog) {
                        alliance_entry.4 += dog_content.ore_cnt.clone();
                        match dog_content.dog_level {
                            DogLevel::CopperDog => {
                                alliance_entry.0 += 1;
                            }
                            DogLevel::SilverDog => {
                                alliance_entry.1 += 1;
                            }
                            DogLevel::GoldDog => {
                                alliance_entry.2 += 1;
                            }
                            DogLevel::DiamondDog => {
                                alliance_entry.3 += 1;
                            }
                        }
                    }
                });
            }
        }
    });

    
    // top 10 owner
    let mut owner_top: Vec<(Principal, u64, u64, u64, u64, Nat)> = owner_rewards.into_iter()
        .map(|(principal, (cooper, silver, gold, diamond, rewards))| (principal, cooper, silver, gold, diamond, rewards))
        .collect();
    owner_top.sort_by_key(|(_, _, _, _, _, amount)| Reverse(amount.clone()));
    owner_top.truncate(10);


    // top 10 alliance_id
    let mut alliance_top: Vec<(String, u64, u64, u64, u64, Nat)> = alliance_rewards.into_iter()
        .map(|(principal, (cooper, silver, gold, diamond, rewards))| (principal, cooper, silver, gold, diamond, rewards))
        .collect();
    alliance_top.sort_by_key(|(_, _, _, _, _, amount)| Reverse(amount.clone()));
    alliance_top.truncate(10);

    let mut alliance_10 = vec![];
    for a in alliance_top {
        let s = a.0;
        let (name, aid) = if let Some((first, rest)) = s.split_once('_') {
            (rest.to_string(), match first.parse::<u64>() {
                Ok(num) => num,
                Err(e) => 0,
            })
        } else {
            (s, 0)
        };

        let en = (name, aid, a.1, a.2, a.3, a.4, a.5);
        alliance_10.push(en);
    }

    (owner_top, alliance_10)
}

#[query]
async fn get_sub_account() -> Account {
    let caller = ic_cdk::caller();
    let canister_id = ic_cdk::id();
    principal_to_account(caller, canister_id)
}
