use candid::{CandidType, decode_one, Deserialize, encode_one, Int, Nat, Principal};
use ic_cdk::{call, id, print};
use ic_cdk::api::call::{CallResult, RejectionCode};
use crate::utils::new_zero;
use ic_ledger_types::{AccountIdentifier,TransferResult as ICPTransferResult, TransferArgs, Memo, Subaccount, Timestamp, Tokens};
use serde_bytes::ByteBuf;
use num_bigint::BigUint;

pub type TxReceipt = Result<Nat, TxError>;

pub fn principal_to_account(caller: Principal, owner: Principal) -> Account {
    Account { owner, subaccount: Some(Subaccount::from(caller)) }
}

pub fn principal_to_subaccount(principal_id: Principal) -> Subaccount {
    Subaccount::from(principal_id)
}

#[derive(CandidType, Debug, PartialEq, Deserialize)]
pub enum TxError {
    InsufficientBalance,
    InsufficientAllowance,
    Unauthorized,
    LedgerTrap,
    AmountTooSmall,
    BlockUsed,
    ErrorOperationStyle,
    ErrorTo,
    Other,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ICRC2TransferArg {
    pub amount: NumTokens,
    pub created_at_time: Option<u64>,
    pub fee: Option<NumTokens>,
    pub from: Account,
    pub memo: Option<Vec<u8>>,
    pub spender_subaccount: Option<Subaccount>,
    pub to: Account,
}

#[derive(CandidType, Deserialize, Clone, Debug, Copy)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<Subaccount>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ICRC2AllowanceArg {
    pub account: Account,
    pub spender: Account,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum MetadataICRC1 {
    Nat(Nat),
    Int(Int),
    Text(String),
    Blob(Vec<u8>),
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ICRC2AllowanceResult {
    pub allowance: Nat,
    pub expires_at: Option<u64>,
}


#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TransferArg {
    pub from_subaccount: Option<Subaccount>,
    pub to: Account,
    pub amount: NumTokens,
    pub fee: Option<NumTokens>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

pub type AccountIdBlob = [u8; 32];

/*#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TransferArgs {
    pub memo: u64,
    pub amount: Tokens,
    pub fee: Tokens,
    pub from_subaccount: Option<Subaccount>,
    pub to: AccountIdBlob,
    pub created_at_time: Option<Timestamp>,
}*/

#[derive(CandidType, Deserialize, Clone, Debug, PartialEq)]
pub enum TransferError {
    BadFee { expected_fee: NumTokens },
    BadBurn { min_burn_amount: NumTokens },
    InsufficientFunds { balance: NumTokens },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    TemporarilyUnavailable,
    Duplicate { duplicate_of: BlockIndex },
    GenericError { error_code: Nat, message: String },
}

#[derive(CandidType, Deserialize, Clone, Debug, PartialEq)]
pub enum TransferFromError {
    BadFee { expected_fee: NumTokens },
    BadBurn { min_burn_amount: NumTokens },
    InsufficientFunds { balance: NumTokens },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    TemporarilyUnavailable,
    Duplicate { duplicate_of: BlockIndex },
    GenericError { error_code: Nat, message: String },
    InsufficientAllowance { allowance: Nat },
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum TransferFromResult { Ok(BlockIndex), Err(TransferFromError) }

pub type NumTokens = Nat;
pub type BlockIndex = Nat;

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum TransferResult { Ok(BlockIndex), Err(TransferError) }

pub type CanisterId = Principal;

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct NotifyTopUpArg {
    block_index: BlockIndex,
    canister_id: CanisterId,
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct NotifyTopUpArgNew {
    block_index: u64,
    canister_id: CanisterId,
}

type Cycles = Nat;

#[derive(Deserialize, CandidType, Clone, Debug)]
pub enum NotifyError {
    Refunded {
        reason: String,
        block_index: Option<BlockIndex>,
    },
    InvalidTransaction(String),
    TransactionTooOld(BlockIndex),
    Processing,
    Other {
        error_code: u64,
        error_message: String,
    },
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct IToken {
    pub cid: Principal,
    pub token_type: String,
}

impl Default for IToken {
    fn default() -> Self {
        IToken {
            cid: Principal::anonymous(),
            token_type: "".to_string(),
        }
    }
}

#[derive(CandidType, Debug, PartialEq, Deserialize, Clone)]
pub struct FeeInfo {
    pub fee_flag: bool,
    pub burn_flag: bool,
    pub fee: Nat,
    pub burn_fee: Nat,
    pub transfer_fee_rate: Nat,
    pub burn_fee_rate: Nat,
}

#[derive(Deserialize, CandidType, Clone, Debug)]
pub struct Metadata {
    pub logo: String,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub totalSupply: Nat,
    pub owner: Principal,
    pub fee: Nat,
}

pub fn nat_to_u64(value: Nat) -> u64 {
    let v: u64 = BigUint::from(value).try_into().unwrap();
    v
}

pub async fn mint_transfer(cycle_token: Principal, canister_id: Principal, token: Principal, value: Nat) -> CallResult<u64> {
    // let to = principal_to_account(canister_id,cycle_token);
    // let TOP_UP_CANISTER_MEMO = 0x50555054u64;
    // let fromAccount = principal_to_subaccount(caller.clone());
    let to = principal_to_subaccount(canister_id.clone());
    let to = AccountIdentifier::new(&cycle_token, &to).clone();
    let transferArg = TransferArgs {
        to,
        fee: Tokens::from_e8s(10_000u64),
        memo: Memo(0x50555054u64),
        from_subaccount: None,
        created_at_time: Some(Timestamp { timestamp_nanos: ic_cdk::api::time() }),
        amount: Tokens::from_e8s(nat_to_u64(value)),
    };
    let (r, ): (ICPTransferResult, ) = call(token, "transfer", (transferArg, )).await?;
    match r {
        ICPTransferResult::Err(e) => {
            print(format!("mint_transfer error:{:?}", e.clone()));
            Err((RejectionCode::CanisterError, format!("{:?}", e)))
        }
        ICPTransferResult::Ok(b) => {
            print("mint_transfer success");
            Ok(b) }
    }
}
/*
pub async fn mint_transfer(cycle_token: Principal,canister_id:Principal, token: Principal, caller: Principal, value: Nat) -> CallResult<Nat> {
    let to = principal_to_account(canister_id,cycle_token);
    let TOP_UP_CANISTER_MEMO = 0x50555054u64;
/*
    let transferArg = ICRC2TransferArg {
        from: Account {
            owner: caller,
            subaccount: None,
        },
        to,
        amount: value,
        fee: None,
        memo: Some("TPUP".to_string().into_bytes()),
        created_at_time: Some(ic_cdk::api::time()),
        spender_subaccount: None,
    };
    let (r, ): (TransferFromResult, ) = call(token, "icrc2_transfer_from", (transferArg, )).await?;
    match r {
        TransferFromResult::Err(e) => {
            print(format!("TransferFromError:{:?}", e.clone()));
            Err((RejectionCode::CanisterError, format!("{:?}", e)))
        }
        TransferFromResult::Ok(b) => { Ok(b) }
    }*/
    let fromAccount = principal_to_subaccount(caller.clone());
    let transferArg = TransferArgNew {
        to,
        fee: None,
        memo: Some(Memo::from(0x50555054u64)),
        from_subaccount: Some(fromAccount),
        created_at_time: Some(ic_cdk::api::time()),
        amount: value,
    };
    let (r, ): (TransferResult, ) = call(token, "icrc1_transfer", (transferArg, )).await?;
    match r {
        TransferResult::Err(e) => {
            print(format!("transferError:{:?}", e.clone()));
            Err((RejectionCode::CanisterError, format!("{:?}", e)))
        }
        TransferResult::Ok(b) => { Ok(b) }
    }
}*/

pub async fn mint_cycles(token: Principal, high: u64, cid: Principal) -> CallResult<()> {
    print(format!("mint_cycles:{},cid:{}", &high, &cid));
    let arg = NotifyTopUpArgNew {
        block_index: high,
        canister_id: cid,
    };
    let r: CallResult<(Result<Cycles, NotifyError>, )> = call(token, "notify_top_up", (arg, )).await;
    match r {
        Ok((v, )) => {
            match v {
                Ok(v) => {
                    Ok(())
                }
                Err(e) => {
                    Err((RejectionCode::CanisterError, format!("{:?}", e)))
                }
            }
        }
        Err(e) => { Err(e) }
    }
}

impl IToken {
    pub async fn transfer(&self, to: Principal, value: Nat, memo: String) -> CallResult<()> {
        match self.token_type.clone().as_str() {
            "DIP20" => {
                let (r, ): (TxReceipt, ) = ic_cdk::call(self.cid, "transfer", (to, value)).await?;
                match r {
                    Ok(_) => { Ok(()) }
                    Err(e) => {
                        print(format!("DIP20 Transfer_Failed:{:?}", e));
                        Err((RejectionCode::CanisterError, format!("transfer_failed:{:?}", e)))
                    }
                }
            }
            "ICRC-1"=> {
                let transferArg = TransferArg {
                    to: Account {
                        owner: to,
                        subaccount: None,
                    },
                    fee: None,
                    memo: Some(memo.into_bytes()),
                    from_subaccount: None,
                    created_at_time: Some(ic_cdk::api::time()),
                    amount: value,
                };
                let (r, ): (TransferResult, ) = ic_cdk::call(self.cid, "icrc1_transfer", (transferArg, )).await?;
                match r {
                    TransferResult::Err(e) => {
                        print(format!("ICRC-1 Transfer_Failed:{:?}", e));
                        Err((RejectionCode::CanisterError, format!("transfer_failed:{:?}", e)))
                    }
                    _ => { Ok(()) }
                }
            }
            "ICRC-2"=> {
                let transferArg = TransferArg {
                    to: Account {
                        owner: to,
                        subaccount: None,
                    },
                    fee: None,
                    memo: Some(memo.into_bytes()),
                    from_subaccount: None,
                    created_at_time: Some(ic_cdk::api::time()),
                    amount: value,
                };
                let (r, ): (TransferResult, ) = ic_cdk::call(self.cid, "icrc1_transfer", (transferArg, )).await?;
                match r {
                    TransferResult::Err(e) => {
                        print(format!("ICRC-1 Transfer_Failed:{:?}", e));
                        Err((RejectionCode::CanisterError, format!("transfer_failed:{:?}", e)))
                    }
                    _ => { Ok(()) }
                }
            }
            _ => todo!()
        }
    }
    pub async fn fee_info(&self) -> Result<FeeInfo, String> {
        match self.token_type.clone().as_str() {
            "DIP20" => {
                let (m, ): (Metadata, ) = call(self.cid, "getMetadata", ()).await.unwrap();
                let fee = m.fee;
                let feeInfo = FeeInfo {
                    fee_flag: true,
                    burn_flag: true,
                    fee,
                    burn_fee: new_zero(),
                    transfer_fee_rate: new_zero(),
                    burn_fee_rate: new_zero(),
                };
                Ok(feeInfo)
            }
            "ICRC-1" => {
                Ok(self.get_icrc_fee_info().await)
            }
            "ICRC-2" => {
                Ok(self.get_icrc_fee_info().await)
            }
            _ => {
                Err(format!("Token Type {} Not Supported.", self.token_type))
            }
        }
    }
    pub async fn transfer_from(&self, from: Principal, to: Principal, value: Nat, memo: String) -> CallResult<Nat> {
        match self.token_type.clone().as_str() {
            "DIP20" => {
                let r: CallResult<(TxReceipt, )> = call(self.cid, "transferFrom", (from, to, value)).await;
                match r {
                    Ok((v, )) => {
                        match v {
                            Ok(v) => {
                                Ok(v)
                            }
                            Err(e) => {
                                Err((RejectionCode::CanisterError, format!("{:?}", e)))
                            }
                        }
                    }
                    Err(e) => { Err(e) }
                }
            }
            "ICRC-1" => {
                let fromAccount = principal_to_subaccount(from.clone());
                let transferArg = TransferArg {
                    to: Account {
                        owner: to,
                        subaccount: None,
                    },
                    fee: None,
                    memo: Some(memo.into_bytes()),
                    from_subaccount: Some(fromAccount),
                    created_at_time: Some(ic_cdk::api::time()),
                    amount: value,
                };
                let (r, ): (TransferResult, ) = call(self.cid, "icrc1_transfer", (transferArg, )).await?;
                match r {
                    TransferResult::Err(e) => {
                        print(format!("transferError:{:?}", e.clone()));
                        Err((RejectionCode::CanisterError, format!("{:?}", e)))
                    }
                    TransferResult::Ok(b) => { Ok(b) }
                }
            }
            "ICRC-2" => {
                print("icrc-2 transfer from");
                let transferArg = ICRC2TransferArg {
                    from: Account {
                        owner: from,
                        subaccount: None,
                    },
                    to: Account {
                        owner: to,
                        subaccount: None,
                    },
                    amount: value,
                    fee: None,
                    memo: Some(memo.into_bytes()),
                    created_at_time: Some(ic_cdk::api::time()),
                    spender_subaccount: None,
                };
                let (r, ): (TransferFromResult, ) = call(self.cid, "icrc2_transfer_from", (transferArg, )).await?;
                match r {
                    TransferFromResult::Err(e) => {
                        print(format!("TransferFromError:{:?}", e.clone()));
                        Err((RejectionCode::CanisterError, format!("{:?}", e)))
                    }
                    TransferFromResult::Ok(b) => { Ok(b) }
                }
            }
            _ => {
                Err((RejectionCode::Unknown, format!("{:?}", "unsupport transfer token")))
            }
        }
    }
    pub async fn balance_of(&self, addr: Principal) -> CallResult<(Nat, )> {
        match self.token_type.clone().as_str() {
            "DIP20" => {
                call(self.cid, "balanceOf", (addr, )).await
            }
            "ICRC-1" => {
                let account = Account {
                    owner: addr,
                    subaccount: None,
                };
                call(self.cid, "icrc1_balance_of", (account, )).await
            }
            "ICRC-2" => {
                let account = Account {
                    owner: addr,
                    subaccount: None,
                };
                call(self.cid, "icrc1_balance_of", (account, )).await
            }
            _ => {
                Err((RejectionCode::CanisterError, "unspport token type".to_string()))
            }
        }
    }
    pub async fn withdraw_sub_account(&self, caller: Principal, memo: String, amount: Nat) -> CallResult<()> {
        let fromAccount = principal_to_subaccount(caller.clone());
        let transferArg = TransferArg {
            to: Account {
                owner: caller,
                subaccount: None,
            },
            fee: None,
            memo: Some(memo.into_bytes()),
            from_subaccount: Some(fromAccount),
            created_at_time: Some(ic_cdk::api::time()),
            amount: amount,
        };
        let (r, ): (TransferResult, ) = ic_cdk::call(self.cid, "icrc1_transfer", (transferArg, )).await?;
        match r {
            TransferResult::Err(e) => {
                // ic_cdk::print(format!("transferError:{:?}", e.clone()));
                Err((RejectionCode::CanisterError, format!("{:?}", e)))
            }
            _ => { Ok(()) }
        }
    }
    pub async fn icrc1_sub_balance_of(&self, account: Account) -> CallResult<(Nat, )> {
        call(self.cid, "icrc1_balance_of", (account, )).await
    }
    pub async fn allowance(&self, owner: Principal, spender: Principal) -> CallResult<(Nat, )> {
        match self.token_type.clone().as_str() {
            "DIP20" => {
                call(self.cid, "allowance", (owner, spender)).await
            }
            "ICRC-1" => {
                let arg = ICRC2AllowanceArg {
                    account: Account {
                        owner: owner,
                        subaccount: None,
                    },
                    spender: Account {
                        owner: spender,
                        subaccount: None,
                    },
                };
                let res: CallResult<(ICRC2AllowanceResult, )> = call(self.cid, "icrc2_allowance", (arg, )).await;
                Ok((res.unwrap().0.allowance, ))
            }
            "ICRC-2" => {
                let arg = ICRC2AllowanceArg {
                    account: Account {
                        owner: owner,
                        subaccount: None,
                    },
                    spender: Account {
                        owner: spender,
                        subaccount: None,
                    },
                };
                let res: CallResult<(ICRC2AllowanceResult, )> = call(self.cid, "icrc2_allowance", (arg, )).await;
                Ok((res.unwrap().0.allowance, ))
            }

            _ => todo!()
        }
    }

    pub async fn get_icrc_fee_info(&self) -> FeeInfo {
        let token = self.cid;
        let mut feeInfo = FeeInfo {
            fee_flag: true,
            burn_flag: true,
            fee: new_zero(),
            burn_fee: new_zero(),
            transfer_fee_rate: new_zero(),
            burn_fee_rate: new_zero(),
        };
        let (m, ): (Vec<(String, MetadataICRC1)>, ) = call(token, "icrc1_metadata", ()).await.unwrap();
        for v in &m {
            let name = v.clone().0;
            let v2 = v.clone().1;
            match v2 {
                MetadataICRC1::Int(v) => {
                    let vu = match v.to_string().parse::<u8>() {
                        Ok(int_val) => {
                            int_val
                        }
                        Err(e) => 0u8,
                    };
                    match name.as_str() {
                        "icrc1:fee" => {
                            feeInfo.fee = Nat::from(vu);
                        }
                        "icrc1:burn_fee" => {
                            feeInfo.burn_fee = Nat::from(vu);
                        }
                        "icrc1:transfer_fee_rate" => {
                            feeInfo.transfer_fee_rate = Nat::from(vu);
                        }
                        "icrc1:burn_fee_rate" => {
                            feeInfo.burn_fee_rate = Nat::from(vu);
                        }
                        _ => {}
                    }
                }
                MetadataICRC1::Nat(v) => {
                    match name.as_str() {
                        "icrc1:fee" => {
                            feeInfo.fee = v;
                        }
                        "icrc1:burn_fee" => {
                            feeInfo.burn_fee = v;
                        }
                        "icrc1:transfer_fee_rate" => {
                            feeInfo.transfer_fee_rate = v;
                        }
                        "icrc1:burn_fee_rate" => {
                            feeInfo.burn_fee_rate = v;
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        }
        if feeInfo.transfer_fee_rate > new_zero() {
            feeInfo.fee_flag = false;
        }
        if feeInfo.burn_fee_rate > new_zero() {
            feeInfo.burn_flag = false;
        }
        feeInfo
    }
}


