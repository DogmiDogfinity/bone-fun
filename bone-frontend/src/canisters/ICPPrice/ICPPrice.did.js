export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'cycles' : IDL.Func([], [IDL.Nat64], ['query']),
    'getICPPrice' : IDL.Func([], [IDL.Nat, IDL.Nat], []),
    'marketCapBatch' : IDL.Func(
        [IDL.Vec(IDL.Principal)],
        [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
        ['query'],
      ),
    'pricesBatch' : IDL.Func(
        [IDL.Vec(IDL.Principal)],
        [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
        ['query'],
      ),
  });
};
export const init = ({ IDL }) => {
  return [IDL.Principal, IDL.Principal, IDL.Principal, IDL.Text];
};