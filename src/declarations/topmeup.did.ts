import { IDL } from "@dfinity/candid";
export const idlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  const TopupTarget = IDL.Record({
    cyclesToTopupWith: IDL.Nat,
    canisterId: IDL.Principal,
  });
  const V0AsyncBatchTopupArgs = IDL.Record({
    e8sToTransfer: IDL.Nat,
    canistersToTopup: IDL.Vec(TopupTarget),
  });
  const V0AsyncBatchTopupResponse = IDL.Variant({
    ok: IDL.Nat,
    err: IDL.Text,
  });
  const V0BatchTopupArgs = IDL.Record({
    e8sToTransfer: IDL.Nat,
    canistersToTopup: IDL.Vec(TopupTarget),
  });
  const Transaction = IDL.Record({
    id: IDL.Text,
    timestampInNs: IDL.Nat,
    transferBlockIndex: IDL.Nat,
    icpSpent: IDL.Nat,
    cyclesReceived: IDL.Nat,
    cyclesSlippage: IDL.Int,
    burnBlockIndex: IDL.Nat,
    customerId: IDL.Principal,
    icpBurned: IDL.Nat,
    canisterId: IDL.Principal,
  });
  const MintTopupOk = IDL.Record({
    cyclesReceived: IDL.Nat,
    blockIndex: IDL.Nat,
    totalIcpSpent: IDL.Nat,
    totalIcpBurned: IDL.Nat,
    transactions: IDL.Vec(Transaction),
  });
  const TransferFromError = IDL.Variant({
    GenericError: IDL.Record({
      message: IDL.Text,
      error_code: IDL.Nat,
    }),
    TemporarilyUnavailable: IDL.Null,
    InsufficientAllowance: IDL.Record({ allowance: IDL.Nat }),
    BadBurn: IDL.Record({ min_burn_amount: IDL.Nat }),
    Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
    BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
    TooOld: IDL.Null,
    InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
  });
  const Tokens = IDL.Record({ e8s: IDL.Nat64 });
  const BlockIndex__1 = IDL.Nat64;
  const TransferError = IDL.Variant({
    TxTooOld: IDL.Record({ allowed_window_nanos: IDL.Nat64 }),
    BadFee: IDL.Record({ expected_fee: Tokens }),
    TxDuplicate: IDL.Record({ duplicate_of: BlockIndex__1 }),
    TxCreatedInFuture: IDL.Null,
    InsufficientFunds: IDL.Record({ balance: Tokens }),
  });
  const BlockIndex = IDL.Nat64;
  const NotifyError = IDL.Variant({
    Refunded: IDL.Record({
      block_index: IDL.Opt(BlockIndex),
      reason: IDL.Text,
    }),
    InvalidTransaction: IDL.Text,
    Other: IDL.Record({
      error_message: IDL.Text,
      error_code: IDL.Nat64,
    }),
    Processing: IDL.Null,
    TransactionTooOld: BlockIndex,
  });
  const MintTopupError = IDL.Variant({
    other: IDL.Text,
    too_low_amount: IDL.Text,
    transfer_from_error: TransferFromError,
    notify_topup_error_failed_refund: IDL.Text,
    transfer_error: TransferError,
    uncaught_transfer_from_error: IDL.Text,
    notify_topup_error_with_refund: IDL.Text,
    notify_topup_error: IDL.Record({
      transferBlockIndex: IDL.Nat,
      error: NotifyError,
    }),
    uncaught_notify_error: IDL.Record({
      transferBlockIndex: IDL.Nat,
      error: IDL.Text,
    }),
    uncaught_transfer_error: IDL.Text,
  });
  const V0BatchTopupResponse = IDL.Variant({
    ok: MintTopupOk,
    err: MintTopupError,
  });
  const MintTopupAsyncError = IDL.Variant({
    other: IDL.Text,
    too_low_amount: IDL.Text,
    transfer_from_error: TransferFromError,
    notify_topup_error_failed_refund: IDL.Text,
    transfer_error: TransferError,
    uncaught_transfer_from_error: IDL.Text,
    notify_topup_error_with_refund: IDL.Text,
    notify_topup_error: IDL.Record({
      transferBlockIndex: IDL.Nat,
      error: NotifyError,
    }),
    uncaught_notify_error: IDL.Record({
      transferBlockIndex: IDL.Nat,
      error: IDL.Text,
    }),
    uncaught_transfer_error: IDL.Text,
  });
  const MintTopupAsyncOk = IDL.Record({
    cyclesReceived: IDL.Nat,
    blockIndex: IDL.Nat,
    totalIcpSpent: IDL.Nat,
    totalIcpBurned: IDL.Nat,
    transactions: IDL.Vec(Transaction),
  });
  const MintTopupRequestState = IDL.Variant({
    icpTransferredToCMC: IDL.Nat,
    refundedIcpToCustomer: IDL.Nat,
    started: IDL.Null,
    cyclesSentToCanisters: IDL.Null,
    error: MintTopupAsyncError,
    success: MintTopupAsyncOk,
    icpTransferredFromCustomer: IDL.Nat,
    icpBurned: IDL.Nat,
  });
  const V0GetLatestRequestStateById = IDL.Opt(MintTopupRequestState);
  const RequestStateEntry = IDL.Record({
    timestampInNs: IDL.Nat,
    state: MintTopupRequestState,
  });
  const V0GetRequestStateHistoryByIdResponse = IDL.Vec(RequestStateEntry);
  const Topmeup = IDL.Service({
    v0_batchTopupAsync: IDL.Func(
      [V0AsyncBatchTopupArgs],
      [V0AsyncBatchTopupResponse],
      [],
    ),
    v0_batchTopupSync: IDL.Func([V0BatchTopupArgs], [V0BatchTopupResponse], []),
    v0_getLatestRequestStateById: IDL.Func(
      [IDL.Nat],
      [V0GetLatestRequestStateById],
      ["query"],
    ),
    v0_getRequestStateHistoryById: IDL.Func(
      [IDL.Nat],
      [V0GetRequestStateHistoryByIdResponse],
      ["query"],
    ),
  });
  return Topmeup;
};
export const init = (context: { IDL: typeof IDL }) => {
  return [] as IDL.Type[];
};
