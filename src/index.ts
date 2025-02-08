import { Actor, ActorSubclass, Agent, HttpAgent } from "@dfinity/agent";
import {
  _SERVICE as ICPTopupService,
  MintTopupAsyncOk,
  MintTopupError,
  MintTopupOk,
  MintTopupRequestState,
  Transaction,
  V0AsyncBatchTopupResponse,
} from "./canister-declarations/topmeup.did.d";
import { idlFactory as ICPTopupIDL } from "./canister-declarations/topmeup.did";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import { Principal } from "@dfinity/principal";
import {
  Account,
  Allowance,
} from "@dfinity/ledger-icrc/dist/candid/icrc_ledger";

const ICP_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const ICPTOPUP_CANISTER_ID = "24qkv-5aaaa-aaaal-amhkq-cai";

export interface ApproveICPTopupToSpendE8sArgs {
  e8sToApprove: bigint;
  agent: Agent;
}

type BlockIndex = bigint;

export interface GetICPTopupAllowanceArgs {
  account: Account;
}

export interface BatchTopupArgs {
  e8sToTransfer: bigint;
  topupTargets: {
    canisterId: Principal;
    topupProportion: bigint;
  }[];
}

export type BatchTopupAsyncResponse = V0AsyncBatchTopupResponse;

// ICPTopupTransaction is an interface that is the same as the Transaction interface
// except that it omits the cyclesSlippage field.
// This is because the icptopup API is used differently than the in-app API, so slippage is not relevant.
type ICPTopupTransaction = Omit<Transaction, "cyclesSlippage">;
interface ICPTopupMintTopupOk extends Omit<MintTopupOk, "transactions"> {
  transactions: ICPTopupTransaction[];
}

export type BatchTopupSyncResponse =
  | { ok: ICPTopupMintTopupOk }
  | { err: MintTopupError };

// Modified type with `success` changed
export type ICPMintTopupRequestState =
  | Exclude<MintTopupRequestState, { success: MintTopupAsyncOk }>
  | { success: ICPTopupMintTopupOk };

export type AsyncTopupStatus = [] | [ICPMintTopupRequestState];

export interface PollAsyncStatusUntilCompleteArgs {
  requestId: bigint;
  pollIntervalInMs?: number;
  logStatusUpdates?: boolean;
}

export default class ICPTopup {
  actor: ActorSubclass<ICPTopupService>;

  constructor(agent: Agent) {
    this.actor = this.createActor(agent);
  }

  private createActor(agent: Agent): ActorSubclass<ICPTopupService> {
    return Actor.createActor<ICPTopupService>(ICPTopupIDL, {
      canisterId: ICPTOPUP_CANISTER_ID,
      agent,
    });
  }

  static async approveToSpendE8s(
    args: ApproveICPTopupToSpendE8sArgs,
  ): Promise<BlockIndex> {
    const ledgerActor = IcrcLedgerCanister.create({
      canisterId: Principal.fromText(ICP_LEDGER_CANISTER_ID),
      agent: args.agent,
    });
    return ledgerActor.approve({
      amount: args.e8sToApprove,
      spender: {
        owner: Principal.fromText(ICPTOPUP_CANISTER_ID),
        subaccount: [],
      },
    });
  }

  static async checkAllowance(
    args: GetICPTopupAllowanceArgs,
  ): Promise<Allowance> {
    const ledgerActor = IcrcLedgerCanister.create({
      canisterId: Principal.fromText(ICP_LEDGER_CANISTER_ID),
      agent: HttpAgent.createSync({ host: "https://ic0.app" }),
    });

    return ledgerActor.allowance({
      account: args.account,
      spender: {
        owner: Principal.fromText(ICPTOPUP_CANISTER_ID),
        subaccount: [],
      },
    });
  }

  static async getLatestTopupRequestStatus(
    requestId: bigint,
  ): Promise<AsyncTopupStatus> {
    const icpTopupActor = Actor.createActor<ICPTopupService>(ICPTopupIDL, {
      canisterId: ICPTOPUP_CANISTER_ID,
      agent: HttpAgent.createSync({ host: "https://ic0.app" }),
    });
    const latestRequestState = (
      await icpTopupActor.v0_getLatestRequestStateById(requestId)
    )[0];
    if (latestRequestState === undefined) return [];
    // If the request state is [success: MintTopupAsyncOk], then we need to convert it to ICPTopupMintTopupOk
    if ("success" in latestRequestState) {
      const state = latestRequestState.success;
      const transactions = state.transactions.map(
        ({ cyclesSlippage, ...txWithoutSlippage }) => {
          void cyclesSlippage;
          return txWithoutSlippage;
        },
      );
      return [{ success: { ...state, transactions } }];
    }

    return [latestRequestState];
  }

  static async pollAsyncStatusUntilComplete(
    args: PollAsyncStatusUntilCompleteArgs,
  ): Promise<AsyncTopupStatus> {
    const pollIntervalInMs = args.pollIntervalInMs || 5000;

    let topupStatus = await ICPTopup.getLatestTopupRequestStatus(
      args.requestId,
    );
    if (args.logStatusUpdates) {
      console.log(
        "topupStatus",
        JSON.stringify(topupStatus, (_, value) => {
          if (typeof value === "bigint") return value.toString();
          else if (value instanceof Principal) return value.toText();
          return value;
        }),
      );
    }

    while (!isAsyncTopupComplete(topupStatus)) {
      if (args.logStatusUpdates)
        console.log(`sleeping for ${pollIntervalInMs} ms`);
      await new Promise((r) => setTimeout(r, pollIntervalInMs));
      topupStatus = await ICPTopup.getLatestTopupRequestStatus(args.requestId);
      if (args.logStatusUpdates) {
        console.log(
          "topupStatus",
          JSON.stringify(topupStatus, (_, value) => {
            if (typeof value === "bigint") return value.toString();
            else if (value instanceof Principal) return value.toText();
            return value;
          }),
        );
      }
    }

    return topupStatus;
  }

  async batchTopupSync(args: BatchTopupArgs): Promise<BatchTopupSyncResponse> {
    if (!this.actor) {
      throw new Error(
        "Actor not created - must create first with ICPTopup.createActor()",
      );
    }
    if (args.e8sToTransfer < BigInt(1e7))
      throw new Error("e8sToTransfer must be at least 0.1 ICP");
    if (args.topupTargets.length === 0)
      throw new Error("topupTargets must not be empty");
    // ensure topup targets are canister IDs
    if (
      !args.topupTargets.every((target) =>
        target.canisterId.toText().endsWith("-cai"),
      )
    )
      throw new Error("must canister IDs");
    // ensure topup proportions are not negative
    if (args.topupTargets.some((target) => target.topupProportion < BigInt(0)))
      throw new Error("topupProportion must be non-negative");
    const result = await this.actor.v0_batchTopupSync({
      e8sToTransfer: args.e8sToTransfer,
      canistersToTopup: args.topupTargets.map((target) => ({
        canisterId: target.canisterId,
        cyclesToTopupWith: target.topupProportion,
      })),
    });
    // convert transactions to ICPTopupTransaction type
    if ("ok" in result) {
      const transactions = result.ok.transactions.map(
        ({ cyclesSlippage, ...txWithoutSlippage }) => {
          void cyclesSlippage;
          return txWithoutSlippage;
        },
      );
      return { ok: { ...result.ok, transactions } };
    }
    return result;
  }

  async batchTopupAsync(
    args: BatchTopupArgs,
  ): Promise<BatchTopupAsyncResponse> {
    if (!this.actor) {
      throw new Error(
        "Actor not created - must create first with ICPTopup.createActor()",
      );
    }
    if (args.e8sToTransfer < BigInt(1e7))
      throw new Error("e8sToTransfer must be at least 0.1 ICP");
    if (args.topupTargets.length === 0)
      throw new Error("topupTargets must not be empty");
    // ensure topup targets are canister IDs
    if (
      !args.topupTargets.every((target) =>
        target.canisterId.toText().endsWith("-cai"),
      )
    )
      throw new Error("must canister IDs");
    // ensure topup proportions are not negative
    if (args.topupTargets.some((target) => target.topupProportion < BigInt(0)))
      throw new Error("topupProportion must be non-negative");
    return this.actor.v0_batchTopupAsync({
      e8sToTransfer: args.e8sToTransfer,
      canistersToTopup: args.topupTargets.map((target) => ({
        canisterId: target.canisterId,
        cyclesToTopupWith: target.topupProportion,
      })),
    });
  }
}

export function isAsyncTopupComplete(requestStatus: AsyncTopupStatus): boolean {
  if (requestStatus.length === 0) return false;

  const [status] = requestStatus;
  return "success" in status || "error" in status;
}
