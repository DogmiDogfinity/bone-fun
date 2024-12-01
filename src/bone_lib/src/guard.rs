use std::cell::RefCell;
use std::collections::BTreeSet;
use std::panic;
use candid::{CandidType, Deserialize, Principal};
use ic_cdk::print;

pub struct State {
    pending_requests: BTreeSet<Principal>,
}

thread_local! {
    pub static STATE: RefCell<State> = RefCell::new(State{pending_requests: BTreeSet::new()});
}

#[derive(Deserialize, CandidType, Clone)]
pub struct CallerGuard {
    principal: Principal,
}

impl CallerGuard {
    pub fn new(principal: Principal) -> Result<Self, String> {
        STATE.with(|state| {
            //ic_cdk::print(format!("Caller Guard before required:{},len:{}",principal.to_text(), state.borrow_mut().pending_requests.len()));
            let pending_requests = &mut state.borrow_mut().pending_requests;
            if pending_requests.contains(&principal){
                return Err(format!("Already processing a request for principal {:?}", &principal.to_text()));
            }
            pending_requests.insert(principal);
            //ic_cdk::print(format!("Caller Guard required:{}",principal.to_text()));
            Ok(Self { principal })
        })
    }

    pub fn unlock(principal: &Principal) {
        //ic_cdk::print(format!("Caller Guard unlock:{}",principal.to_text()));
        STATE.with(|state| {
            let flag = state.borrow_mut().pending_requests.remove(principal);
            //ic_cdk::print(format!("Caller Guard unlock status:{},principal:{},len:{}",flag,principal,state.borrow_mut().pending_requests.len()));
        })
    }
}

impl Drop for CallerGuard {
    fn drop(&mut self) {
        //ic_cdk::print(format!("Caller Guard drop:{}",&self.principal.to_text()));
        // print("swap guard drop");
        STATE.with(|state| {
            state.borrow_mut().pending_requests.remove(&self.principal);
        })
    }
}
