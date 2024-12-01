use candid::{CandidType, Deserialize, Int, Nat, Principal};
use crate::types::bone_dog_types::{DogContext, DogHash, DogLevel, MiningState, MiningType};
use ic_cdk::{call, print};
use ic_cdk::api::call::CallResult;

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct IDog {
    pub cid: Principal,
}

impl IDog {
    pub async fn dog_info(&self) -> DogContext {
        let r: CallResult<(DogContext, )> = call(self.cid.clone(), "dog_info", ()).await;
        match r {
            Ok(re) => re.0,
            Err(e) => {
                print(format!("{} get dog infor error", self.cid.clone()));
                DogContext::default()
            }
        }
    }

    pub async fn dog_cycles(&self) -> u64 {
        let r: CallResult<(u64, )> = call(self.cid.clone(), "cycles", ()).await;
        match r {
            Ok(re) => re.0,
            Err(e) => {
                print(format!("{} get dog infor error", self.cid.clone()));
                0u64
            }
        }
    }
    pub async fn dog_level_upgrade(&self, level: DogLevel) -> Result<(), String> {
        let r: CallResult<(Result<(), String>, )> = call(self.cid.clone(), "dog_level_upgrade", (level, )).await;
        match r {
            Ok(re) => re.0,
            Err(e) => (Err(e.1))
        }
    }
    pub async fn dog_mining_type_update(&self, mining_type: MiningType, alliance_id: Option<u64>) -> Result<(), String> {
        let r: CallResult<(Result<(), String>, )> = call(self.cid.clone(), "dog_mining_type_update", (mining_type, alliance_id)).await;
        match r {
            Ok(re) => re.0,
            Err(e) => (Err(e.1))
        }
    }
    pub async fn dog_mining_state_update(&self, mining_state: String) -> Result<(), String> {
        let r: CallResult<(Result<(), String>, )> = call(self.cid.clone(), "dog_mining_state_update", (mining_state, )).await;
        match r {
            Ok(re) => re.0,
            Err(e) => (Err(e.1))
        }
    }

/*    pub async fn getDogLevel(&self) -> DogLevel {
        let r: CallResult<(DogLevel, )> = call(self.cid.clone(), "get_dog_level", ()).await;
        match r {
            Ok(v) => v.0,
            Err(e) => panic!("getDogLevel error:{:?}", e)
        }
    }

    pub async fn getDogState(&self) -> (MiningState, MiningType, DogLevel) {
        let r: CallResult<((MiningState, MiningType, DogLevel))> = call(self.cid.clone(), "get_dog_state", ()).await;
        match r {
            Ok(v) => v,
            Err(e) => panic!("getDogState error:{:?}", e)
        }
    }
*/
    pub async fn manage_stop_start_timer(&self, state: MiningState) {
        let r: CallResult<()> = call(self.cid.clone(), "manage_stop_start_timer", (state, )).await;
        match r {
            Ok(_) => {}
            Err(e) => {
            }
        };
    }
}
