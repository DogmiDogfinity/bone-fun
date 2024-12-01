use candid::{candid_method, CandidType, Deserialize, Nat, Principal};
use ic_cdk::{call, caller, print, id};
use std::{borrow::Cow, cell::RefCell, cell::Cell};
use std::collections::VecDeque;
use std::fmt::format;
use ic_cdk::api::call::CallResult;
use ic_cdk_macros::*;
use std::time::{Duration};
use ic_cdk::api::time;
use ic_cdk_timers::TimerId;
use bone_lib::types::bone_dog_types::{DogContext, DogHash, DogLevel, MiningState, MiningType, VerifyDogHash};
use bone_lib::utils::{BASE_CYCLES_SIZE, MAX_CYCLES_SIZE, new_zero, OreHash};
use bone_lib::interface::imain::{IMain};
use std::thread;


thread_local! {
    static DOG_CONTEXT: RefCell<DogContext> = RefCell::new(DogContext::default());
    static COUNTER: Cell<u64> = Cell::new(0);
    static TIMER_ID: RefCell<Option<(TimerId,TimerId)>> = RefCell::new(None);


}
pub const CREATE_ORES_NUM: u32 = 5000u32;

#[init]
#[candid_method(init)]
fn init(owner: Principal, mainId: Option<Principal>, ore: String, name: String, ore_difficulty: usize) {
    let caller = caller();
    let dogContext = DogContext {
        name: name,
        main_pid: if mainId.is_some() { mainId.unwrap() } else { caller },
        dog_level: DogLevel::CopperDog,
        owner,
        mining_type: MiningType::ALONE,
        mining_state: MiningState::ACTIVITY,
        mining_alliance: None,
        ores: VecDeque::new(),
        create_time: ic_cdk::api::time() / 1000_000_000u64,
        ore,
        ore_amount: new_zero(),
        ore_cnt: 0usize,
        ore_difficulty,
    };
    DOG_CONTEXT.with(|dog| {
        *dog.borrow_mut() = dogContext;
    });
    // let timer_dog_mining_id: TimerId = ic_cdk_timers::set_timer_interval(Duration::from_millis(100), || ic_cdk::spawn(timer_dog_mining()));
    // ic_cdk_timers::set_timer_interval(Duration::from_secs(120), || ic_cdk::spawn(timer_verify_ore()));
    ic_cdk_timers::set_timer_interval(Duration::from_secs(60), || ic_cdk::spawn(get_ore()));
    start_timer();
    // ic_cdk_timers::set_timer_interval(Duration::from_secs(60), || ic_cdk::spawn(calc_cycles()));
}

/*#[query]
async fn get_dog_level() -> DogLevel {
    DOG_CONTEXT.with(|dog| dog.borrow().dog_level.clone())
}*/

#[query]
async fn get_dog_state() -> (MiningState, MiningType, DogLevel) {
    DOG_CONTEXT.with(|dog| {
        let dog = dog.borrow();
        (dog.mining_state.clone(), dog.mining_type.clone(), dog.dog_level.clone())
    })
}


#[query]
fn dog_info() -> DogContext {
    DOG_CONTEXT.with(|dog| {
        let dog_context = dog.borrow();
        dog_context.clone()
    })
}

#[update]
async fn dog_level_upgrade(level: DogLevel) -> Result<(), String> {
    let caller = caller();
    let owner = DOG_CONTEXT.with(|dog| dog.borrow().main_pid.clone());
    if caller != owner {
        return Err("not owner".to_string());
    }
    DOG_CONTEXT.with(|dog| {
        dog.borrow_mut().dog_level = level.clone();
    });
    update_level_time();
    Ok(())
}

#[update]
async fn dog_mining_type_update(mining_type: MiningType, alliance_id: Option<u64>) -> Result<(), String> {
    let caller = caller();
    let dog_context = DOG_CONTEXT.with(|dog| {
        let dog_context = dog.borrow();
        dog_context.clone()
    });
    if caller != dog_context.main_pid.clone() {
        return Err("not owner".to_string());
    }

    if alliance_id.is_some() && dog_context.mining_alliance.is_some() {
        return Err("The dog has joined the Alliance!".to_string());
    }
    if MiningType::POOL == mining_type && alliance_id.is_none() {
        return Err("The Alliance ID is required.".to_string());
    }

    DOG_CONTEXT.with(|dog| {
        let mut d = dog.borrow_mut();
        if MiningType::ALONE == mining_type {
            d.mining_alliance = None;
        } else {
            d.mining_alliance = alliance_id;
        }
        d.mining_type = mining_type;
    });
    Ok(())
}

#[update]
async fn dog_mining_state_update(mining_state: String) -> Result<(), String> {
    let caller = caller();
    let owner = DOG_CONTEXT.with(|dog| dog.borrow().main_pid.clone());
    if caller != owner {
        return Err("not owner".to_string());
    }
    DOG_CONTEXT.with(|dog| {
        dog.borrow_mut().mining_state = mining_state.into();
    });
    Ok(())
}


#[pre_upgrade]
fn pre_upgrade() {
    // let context = DogContext.with(|context| context.borrow().clone());
    // ic_cdk::storage::stable_save((
    //     context
    // )).unwrap();
}

#[post_upgrade]
fn post_upgrade() {
    // let (context): (DogContext) = ic_cdk::storage::stable_restore().unwrap();
    // DOG_CONTEXT.with(|dog| {
    //     *dog.borrow_mut() = context;
    // });
}


#[query]
fn cycles() -> u64 {
    ic_cdk::api::canister_balance()
}

#[cfg(any(target_arch = "wasm32", test))]
fn main() {}

#[cfg(not(any(target_arch = "wasm32", test)))]
fn main() {
    candid::export_service!();
    std::print!("{}", __export_service());
}


#[update]
async fn manage_stop_start_timer(state: MiningState) {
    let context = DOG_CONTEXT.with(|dog| {
        let dog_context = dog.borrow();
        dog_context.clone()
    });
    if caller().clone() != context.main_pid.clone() {
        panic!("not main!");
    }
    let imain = IMain {
        cid: context.main_pid.clone()
    };
    match state {
        MiningState::ACTIVITY => {
            if let Ok(_) = imain.update_dog_state(MiningState::ACTIVITY).await {
                start_timer();
            }
        }
        MiningState::STOP => {
            if let Ok(_) = imain.update_dog_state(MiningState::STOP).await {
                stop_timer();
            }
        }
    }
}


#[update]
fn count_meno() -> String {
    let count = COUNTER.with(|counter| {
        let count = counter.get() + 1;
        if count >= 9999999999u64 {
            counter.set(0u64);
        } else {
            counter.set(count.clone());
        }
        count
    });
    return format!("{}:{}", id().to_string(), count);
}


async fn get_ore() {
    let cycles = cycles();
    print(format!("now cycles:{}", &cycles));
    let context: DogContext = DOG_CONTEXT.with(|dog| {
        dog.borrow().clone()
    });
    let imain = IMain {
        cid: context.main_pid.clone()
    };
    if cycles <= MAX_CYCLES_SIZE {
        if MiningState::ACTIVITY == context.mining_state {
            if let Ok(_) = imain.update_dog_state(MiningState::STOP).await {
                stop_timer();
            }
        }
        return;
    }
    if let MiningState::STOP = context.mining_state {
        if cycles >= BASE_CYCLES_SIZE {
            if let Ok(_) = imain.update_dog_state(MiningState::ACTIVITY).await {
                start_timer();
            }
        } else {
            return;
        }
    }
    let ore = imain.get_ore().await;
    if context.ore == ore.0 && context.ore_difficulty == ore.1 {
        return;
    } else if context.ore == ore.0 {
        DOG_CONTEXT.with(|dog| {
            dog.borrow_mut().ore_difficulty = ore.1;
        });
    } else if context.ore_difficulty == ore.1 {
        DOG_CONTEXT.with(|dog| {
            dog.borrow_mut().ore = ore.0;
        });
    } else {
        DOG_CONTEXT.with(|dog| {
            let mut d = dog.borrow_mut();
            d.ore = ore.0;
            d.ore_difficulty = ore.1;
        });
    }
}

async fn timer_verify_ore() {
    let context: DogContext = DOG_CONTEXT.with(|dog| {
        dog.borrow().clone()
    });
    let veri_ores = secondary_verification();
    let len = veri_ores.len();
    print(format!("verify len:{}", &len));
    if len > 0 {
        let dog_hash = DogHash {
            ores: veri_ores,
            timestamp: time(),
            owner: context.owner.clone(),
            mining_alliance: context.mining_alliance.clone(),
        };
        let vhash = VerifyDogHash {
            dog_hash: dog_hash,
            create_time: context.create_time.clone(),
        };
        let imain = IMain {
            cid: context.main_pid.clone()
        };
        let r = imain.verify_ore(vhash).await;
        match r {
            Ok(v) => {
                if 0 == v.2 {
                    return;
                }
                DOG_CONTEXT.with(|dog| {
                    let mut d = dog.borrow_mut();
                    d.ore = v.0;
                    d.ore_difficulty = v.2;
                    if v.1 > new_zero() {
                        d.ore_amount = d.ore_amount.clone() + v.1;
                        d.ore_cnt = d.ore_cnt.clone() + 1;
                    }
                });
            }
            Err(e) => {
                print(format!("Hash verification error: {}", e));
            }
        }
    } else {
        return;
    }
}

fn secondary_verification() -> Vec<String> {
    let mut arr = vec![];
    while let Some(ore) = DOG_CONTEXT.with(|dog| dog.borrow_mut().ores.pop_back()) {
        let vec_temp: Vec<String> = ore.ores.clone();
        let ore_difficulty = DOG_CONTEXT.with(|dog| dog.borrow().ore_difficulty.clone());
        let veri_ore = DOG_CONTEXT.with(|dog| dog.borrow().ore.clone());
        for tore in vec_temp {
            if tore[0..ore_difficulty.clone()] == veri_ore[0..ore_difficulty.clone()] {
                arr.push(tore);
            }
        }
    };
    arr
}

async fn timer_dog_mining() {
    // print(format!("dog timer_dog_mining cycles:{}", &cycles));
    let context: DogContext = DOG_CONTEXT.with(|dog| {
        dog.borrow().clone()
    });

    if let MiningState::STOP = context.mining_state {
        return;
    }

    let weight = context.dog_level.weight();
    let mining_alliance = match context.mining_type {
        MiningType::ALONE => { None }
        MiningType::POOL => { context.mining_alliance }
        _ => { return; }
    };
    let owner = context.owner;
    let check_ore = context.ore;
    let ore_difficulty = context.ore_difficulty.clone();
    let mut hashArr = Vec::new();
    let mut one = id().to_text();
    for i in 0..CREATE_ORES_NUM {
        // let h1 = cycles().to_string();
        let meno = count_meno();
        let oreHash = OreHash {
            one: one.clone().chars().rev().collect(),
            tow: meno,
            time: time(),
            cycle_num: cycles(),
        };
        one = oreHash.hash_order();
        let hash: String = one.clone().chars().rev().collect();
        // print(format!("dog to mining hash:{}, hash:{}; ore:{}",&hash, &hash[0..4],&check_ore[0..4]));
        if hash[0..ore_difficulty.clone()] == check_ore[0..ore_difficulty.clone()] {
            if (weight < 5 && i % 5 > weight) {
                return;
            }
            hashArr.push(hash);
        }
    }
    if hashArr.len() > 0 {
        let dogHash = DogHash {
            ores: hashArr,
            timestamp: ic_cdk::api::time(),
            mining_alliance,
            owner,
        };

        DOG_CONTEXT.with(|dog| {
            let mut d = dog.borrow_mut();
            d.ores.push_front(dogHash);
        });
    }
}

fn update_level_time() {
    TIMER_ID.with(|timer_id| {
        if let Some(ids) = timer_id.clone().borrow_mut().take() {
            ic_cdk_timers::clear_timer(ids.0);
            ic_cdk_timers::clear_timer(ids.1);
        }
        let timer_dog_mining_id = ic_cdk_timers::set_timer_interval(Duration::from_secs(2), || {
            ic_cdk::spawn(timer_dog_mining());
        });
        let dog_level: DogLevel = DOG_CONTEXT.with(|dog| dog.borrow_mut().dog_level.clone());
        let time = dog_level.time_frequency();
        let timer_verify_ore_id = ic_cdk_timers::set_timer_interval(Duration::from_secs(time), || {
            ic_cdk::spawn(timer_verify_ore());
        });
        *timer_id.borrow_mut() = Some((timer_dog_mining_id, timer_verify_ore_id));
    });
}

fn start_timer() {
    TIMER_ID.with(|timer_id| {
        if let Some(ids) = timer_id.clone().borrow_mut().take() {
            ic_cdk_timers::clear_timer(ids.0);
            ic_cdk_timers::clear_timer(ids.1);
        }
        let timer_dog_mining_id = ic_cdk_timers::set_timer_interval(Duration::from_secs(2), || {
            ic_cdk::spawn(timer_dog_mining());
        });
        let dog_level: DogLevel = DOG_CONTEXT.with(|dog| dog.borrow_mut().dog_level.clone());
        let time = dog_level.time_frequency();
        let timer_verify_ore_id = ic_cdk_timers::set_timer_interval(Duration::from_secs(time), || {
            ic_cdk::spawn(timer_verify_ore());
        });
        *timer_id.borrow_mut() = Some((timer_dog_mining_id, timer_verify_ore_id));

        print("Timer started.");
        DOG_CONTEXT.with(|dog| {
            let mut d = dog.borrow_mut();
            d.mining_state = MiningState::ACTIVITY;
        })
    });
}

fn stop_timer() {
    TIMER_ID.with(|timer_id| {
        if let Some(ids) = timer_id.borrow_mut().take() {
            ic_cdk_timers::clear_timer(ids.0);
            ic_cdk_timers::clear_timer(ids.1);
            print("Timer stopped.");
            DOG_CONTEXT.with(|dog| {
                let mut d = dog.borrow_mut();
                d.mining_state = MiningState::STOP;
                d.mining_type = MiningType::ALONE;
                d.mining_alliance = None;
            });
        }
    });
}
