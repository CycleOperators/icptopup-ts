import { ActorSubclass, Agent } from "@dfinity/agent";
import { createActor, CreateActorOptions } from "./declarations";
import { _SERVICE as ICPTopupService } from "./declarations/topmeup.did.d";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import { Principal } from "@dfinity/principal";
import {
  Account,
  Allowance,
} from "@dfinity/ledger-icrc/dist/candid/icrc_ledger";

const ICP_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const ICPTOPUP_CANISTER_ID = "24qkv-5aaaa-aaaal-amhkq-cai";

export type ICPTopupActor = ActorSubclass<ICPTopupService>;

export function createICPTopupActor(
  options: CreateActorOptions,
): ICPTopupActor {
  return createActor(ICPTOPUP_CANISTER_ID, options);
}

export interface ApproveICPTopupToSpendE8sArgs {
  e8sToApprove: bigint;
  agent?: Agent;
}

type BlockIndex = bigint;

export async function approveICPTopupToSpendE8s(
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

export interface GetICPTopupAllowanceArgs {
  account: Account;
  agent?: Agent;
}

export async function getICPTopupAllowance(
  args: GetICPTopupAllowanceArgs,
): Promise<Allowance> {
  const ledgerActor = IcrcLedgerCanister.create({
    canisterId: Principal.fromText(ICP_LEDGER_CANISTER_ID),
    agent: args.agent,
  });

  return ledgerActor.allowance({
    account: args.account,
    spender: {
      owner: Principal.fromText(ICPTOPUP_CANISTER_ID),
      subaccount: [],
    },
  });
}
