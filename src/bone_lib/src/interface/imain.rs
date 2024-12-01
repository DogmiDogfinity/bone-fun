use candid::{CandidType, Deserialize, Int, Nat, Principal};
use crate::types::bone_dog_types::{DogHash, MiningState, VerifyDogHash};
use ic_cdk::{call};
use ic_cdk::api::call::CallResult;

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct IMain {
    pub cid: Principal,
}

impl IMain {
    pub async fn update_dog_state(&self, state: MiningState) -> Result<(), String> {
        let r: CallResult<()> = call(self.cid.clone(), "update_dog_state", (state, )).await;
        match r {
            Ok(v) => {
                Ok(())
            }
            Err(e) => Err(e.1)
        }
    }
    pub async fn verify_ore(&self, dogHash: VerifyDogHash) -> Result<(String, Nat, usize), String> {
        let r: CallResult<(Result<(String, Nat, usize), String>, )> = call(self.cid.clone(), "verify_ore", (dogHash, )).await;
        match r {
            Ok(v) => {
                v.0
            }
            Err(e) => Err(e.1)
        }
    }

    pub async fn get_ore(&self) -> (String, usize) {
        let r: CallResult<((String, usize) )> = call(self.cid.clone(), "get_ore", ()).await;
        match r {
            Ok(v) => {
                v
            }
            Err(e) => {
                panic!("ore error!{:?}", e);
            }
        }
    }
}
