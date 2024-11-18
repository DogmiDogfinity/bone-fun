import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Account {
  owner: Principal;
  subaccount: [] | [Subaccount];
}
export interface Allowance {
  allowance: bigint;
  expires_at: [] | [bigint];
}
export type ApproveError =
  | {
      GenericError: { message: string; error_code: bigint };
    }
  | { TemporarilyUnavailable: null }
  | { Duplicate: { duplicate_of: TxIndex } }
  | { BadFee: { expected_fee: Tokens } }
  | { AllowanceChanged: { current_allowance: bigint } }
  | { CreatedInFuture: { ledger_time: Timestamp } }
  | { TooOld: null }
  | { Expired: { ledger_time: bigint } }
  | { InsufficientFunds: { balance: Tokens } };
export type CommonError =
  | {
      GenericError: { message: string; error_code: bigint };
    }
  | { TemporarilyUnavailable: null }
  | { BadFee: { expected_fee: Tokens } }
  | { InsufficientFunds: { balance: Tokens } };
export interface FeeInfo {
  burn_fee: bigint;
  decimals: number;
  transfer_fee: bigint;
}
export type Memo = Uint8Array | number[];
export type Result = { Ok: null } | { Err: CommonError };
export type Result_1 = { Ok: TxIndex } | { Err: TransferFromError };
export type Result_2 = { Ok: TxIndex } | { Err: ApproveError };
export type Result_3 = { Ok: TxIndex } | { Err: TransferError };
export type Subaccount = Uint8Array | number[];
export type Timestamp = bigint;
export type Tokens = bigint;
export type TransferError =
  | {
      GenericError: { message: string; error_code: bigint };
    }
  | { TemporarilyUnavailable: null }
  | { BadBurn: { min_burn_amount: Tokens } }
  | { Duplicate: { duplicate_of: TxIndex } }
  | { BadFee: { expected_fee: Tokens } }
  | { CreatedInFuture: { ledger_time: Timestamp } }
  | { TooOld: null }
  | { InsufficientFunds: { balance: Tokens } };
export type TransferFromError =
  | {
      GenericError: { message: string; error_code: bigint };
    }
  | { TemporarilyUnavailable: null }
  | { InsufficientAllowance: { allowance: bigint } }
  | { BadBurn: { min_burn_amount: Tokens } }
  | { Duplicate: { duplicate_of: TxIndex } }
  | { BadFee: { expected_fee: Tokens } }
  | { CreatedInFuture: { ledger_time: Timestamp } }
  | { TooOld: null }
  | { InsufficientFunds: { balance: Tokens } };
export type TxIndex = bigint;
export type Value = { Int: bigint } | { Nat: bigint } | { Blob: Uint8Array | number[] } | { Text: string };
export interface _SERVICE {
  icrc1_balance_of: ActorMethod<[Account], Tokens>;
  icrc1_decimals: ActorMethod<[], number>;
  icrc1_fee: ActorMethod<[], bigint>;
  icrc1_metadata: ActorMethod<[], Array<[string, Value]>>;
  icrc1_minting_account: ActorMethod<[], [] | [Account]>;
  icrc1_name: ActorMethod<[], string>;
  icrc1_supported_standards: ActorMethod<[], Array<{ url: string; name: string }>>;
  icrc1_symbol: ActorMethod<[], string>;
  icrc1_total_supply: ActorMethod<[], Tokens>;
  icrc1_transfer: ActorMethod<
    [
      {
        to: Account;
        fee: [] | [Tokens];
        memo: [] | [Memo];
        from_subaccount: [] | [Subaccount];
        created_at_time: [] | [Timestamp];
        amount: Tokens;
      },
    ],
    Result_3
  >;
  icrc2_allowance: ActorMethod<[{ account: Account; spender: Account }], Allowance>;
  icrc2_approve: ActorMethod<
    [
      {
        fee: [] | [Tokens];
        memo: [] | [Memo];
        from_subaccount: [] | [Subaccount];
        created_at_time: [] | [Timestamp];
        amount: bigint;
        expected_allowance: [] | [bigint];
        expires_at: [] | [bigint];
        spender: Account;
      },
    ],
    Result_2
  >;
  icrc2_transfer_from: ActorMethod<
    [
      {
        to: Account;
        fee: [] | [Tokens];
        spender_subaccount: [] | [Subaccount];
        from: Account;
        memo: [] | [Memo];
        created_at_time: [] | [Timestamp];
        amount: Tokens;
      },
    ],
    Result_1
  >;
  icrc_plus_cycles: ActorMethod<[], bigint>;
  icrc_plus_fee_info: ActorMethod<[], FeeInfo>;
  icrc_plus_holders_count: ActorMethod<[], bigint>;
  icrc_plus_logo: ActorMethod<[], string>;
  icrc_plus_mint_on: ActorMethod<[], boolean>;
  icrc_plus_owner: ActorMethod<[], Principal>;
  icrc_plus_set_owner: ActorMethod<[{ owner: Principal }], Result>;
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
