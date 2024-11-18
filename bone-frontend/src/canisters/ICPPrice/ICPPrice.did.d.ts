import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface _SERVICE {
  'cycles' : ActorMethod<[], bigint>,
  'getICPPrice' : ActorMethod<[], [bigint, bigint]>,
  'marketCapBatch' : ActorMethod<
    [Array<Principal>],
    Array<[Principal, bigint]>
  >,
  'pricesBatch' : ActorMethod<[Array<Principal>], Array<[Principal, bigint]>>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];