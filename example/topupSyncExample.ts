import ICPTopup from "icptopup-ts";
import { identityFromPemFile } from "./utils";
import { HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

// Node example - if in a browser context substitute taking the identity from a pem file with the identity you want to use
async function approveAndTopupCanisterSync() {
  // take in the pem file path as a cli argument
  const pemFilePath = process.argv[2];
  console.log("pemFilePath", pemFilePath);
  const identity = identityFromPemFile(pemFilePath);
  const agent = HttpAgent.createSync({ identity, host: "https://ic0.app" });

  // Note: Approvals cost 10_000 e8s
  // Also important to make sure the amount approved includes the 10_000 e8s fee for transferring the e8s to icptopup
  const approvalBlockIndex = await ICPTopup.approveToSpendE8s({
    agent,
    e8sToApprove: BigInt(1e7), // 0.1 ICP
  });
  console.log(
    "approvalBlockIndex",
    JSON.stringify(
      approvalBlockIndex,
      (key, value) => (typeof value === "bigint" ? value.toString() : value),
      2,
    ),
  );

  const allowance = await ICPTopup.checkAllowance({
    account: {
      owner: identity.getPrincipal(),
      subaccount: [],
    },
  });
  console.log(
    "allowance",
    JSON.stringify(
      allowance,
      (key, value) => (typeof value === "bigint" ? value.toString() : value),
      2,
    ),
  );

  // Note: make sure account transferring funds during the topup has e8sToTransfer + 10_000 e8s (ICP ledger fee) to cover the icp transfer
  const icpTopupActor = new ICPTopup(agent);
  const result = await icpTopupActor.batchTopupSync({
    e8sToTransfer: BigInt(1e7), // 0.1 ICP
    topupTargets: [
      {
        canisterId: Principal.fromText("qc4nb-ciaaa-aaaap-aawqa-cai"),
        topupProportion: 2n, // send up 2/3rds of the minted cycles here
      },
      {
        canisterId: Principal.fromText("gf3bz-2aaaa-aaaap-ahngq-cai"),
        topupProportion: 1n, // send 1/3rd of the minted cycles here
      },
    ],
  });
  console.log(
    "batch topup sync result",
    JSON.stringify(result, (key, value) => {
      if (typeof value === "bigint") return value.toString();
      else if (value instanceof Principal) return value.toText();
      return value;
    }),
  );
}

if (require.main === module) {
  approveAndTopupCanisterSync()
    .then(() => {
      console.log("done");
    })
    .catch((err) => {
      console.error(err);
    });
}
