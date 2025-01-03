import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

export type BlockIndex = bigint;
export type BlockIndex__1 = bigint;
export type MintTopupAsyncError =
  | { other: string }
  | { too_low_amount: string }
  | { transfer_from_error: TransferFromError }
  | { notify_topup_error_failed_refund: string }
  | { transfer_error: TransferError }
  | { uncaught_transfer_from_error: string }
  | { notify_topup_error_with_refund: string }
  | {
      notify_topup_error: {
        transferBlockIndex: bigint;
        error: NotifyError;
      };
    }
  | {
      uncaught_notify_error: {
        transferBlockIndex: bigint;
        error: string;
      };
    }
  | { uncaught_transfer_error: string };
export interface MintTopupAsyncOk {
  cyclesReceived: bigint;
  blockIndex: bigint;
  totalIcpSpent: bigint;
  totalIcpBurned: bigint;
  transactions: Array<Transaction>;
}
export type MintTopupError =
  | { other: string }
  | { too_low_amount: string }
  | { transfer_from_error: TransferFromError }
  | { notify_topup_error_failed_refund: string }
  | { transfer_error: TransferError }
  | { uncaught_transfer_from_error: string }
  | { notify_topup_error_with_refund: string }
  | {
      notify_topup_error: {
        transferBlockIndex: bigint;
        error: NotifyError;
      };
    }
  | {
      uncaught_notify_error: {
        transferBlockIndex: bigint;
        error: string;
      };
    }
  | { uncaught_transfer_error: string };
export interface MintTopupOk {
  cyclesReceived: bigint;
  blockIndex: bigint;
  totalIcpSpent: bigint;
  totalIcpBurned: bigint;
  transactions: Array<Transaction>;
}
export type MintTopupRequestState =
  | { icpTransferredToCMC: bigint }
  | { refundedIcpToCustomer: bigint }
  | { started: null }
  | { cyclesSentToCanisters: null }
  | { error: MintTopupAsyncError }
  | { success: MintTopupAsyncOk }
  | { icpTransferredFromCustomer: bigint }
  | { icpBurned: bigint };
export type NotifyError =
  | {
      Refunded: { block_index: [] | [BlockIndex]; reason: string };
    }
  | { InvalidTransaction: string }
  | { Other: { error_message: string; error_code: bigint } }
  | { Processing: null }
  | { TransactionTooOld: BlockIndex };
export interface RequestStateEntry {
  timestampInNs: bigint;
  state: MintTopupRequestState;
}
export interface Tokens {
  e8s: bigint;
}
export interface Topmeup {
  v0_batchTopupAsync: ActorMethod<
    [V0AsyncBatchTopupArgs],
    V0AsyncBatchTopupResponse
  >;
  v0_batchTopupSync: ActorMethod<[V0BatchTopupArgs], V0BatchTopupResponse>;
  v0_getLatestRequestStateById: ActorMethod<
    [bigint],
    V0GetLatestRequestStateById
  >;
  v0_getRequestStateHistoryById: ActorMethod<
    [bigint],
    V0GetRequestStateHistoryByIdResponse
  >;
}
export interface TopupTarget {
  cyclesToTopupWith: bigint;
  canisterId: Principal;
}
export interface Transaction {
  id: string;
  timestampInNs: bigint;
  transferBlockIndex: bigint;
  icpSpent: bigint;
  cyclesReceived: bigint;
  cyclesSlippage: bigint;
  burnBlockIndex: bigint;
  customerId: Principal;
  icpBurned: bigint;
  canisterId: Principal;
}
export type TransferError =
  | {
      TxTooOld: { allowed_window_nanos: bigint };
    }
  | { BadFee: { expected_fee: Tokens } }
  | { TxDuplicate: { duplicate_of: BlockIndex__1 } }
  | { TxCreatedInFuture: null }
  | { InsufficientFunds: { balance: Tokens } };
export type TransferFromError =
  | {
      GenericError: { message: string; error_code: bigint };
    }
  | { TemporarilyUnavailable: null }
  | { InsufficientAllowance: { allowance: bigint } }
  | { BadBurn: { min_burn_amount: bigint } }
  | { Duplicate: { duplicate_of: bigint } }
  | { BadFee: { expected_fee: bigint } }
  | { CreatedInFuture: { ledger_time: bigint } }
  | { TooOld: null }
  | { InsufficientFunds: { balance: bigint } };
export interface V0AsyncBatchTopupArgs {
  e8sToTransfer: bigint;
  canistersToTopup: Array<TopupTarget>;
}
export type V0AsyncBatchTopupResponse = { ok: bigint } | { err: string };
export interface V0BatchTopupArgs {
  e8sToTransfer: bigint;
  canistersToTopup: Array<TopupTarget>;
}
export type V0BatchTopupResponse =
  | { ok: MintTopupOk }
  | { err: MintTopupError };
export type V0GetLatestRequestStateById = [] | [MintTopupRequestState];
export type V0GetRequestStateHistoryByIdResponse = Array<RequestStateEntry>;
export interface _SERVICE extends Topmeup {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
