import ICPTopup from "icptopup-ts";
import { identityFromPemFile } from "./utils";
import { HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

// Node example - if in a browser context substitute taking the identity from a pem file with the identity you want to use
async function approveAndTopupCanisterAsync() {
  // if running via node, take in the pem file path as a cli argument
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
  const topupResponse = await icpTopupActor.batchTopupAsync({
    e8sToTransfer: BigInt(1e7), // 0.1 ICP
    topupTargets: [
      {
        canisterId: Principal.fromText("qc4nb-ciaaa-aaaap-aawqa-cai"),
        topupProportion: 1n, // send 1/2 of the minted cycles here
      },
      {
        canisterId: Principal.fromText("gf3bz-2aaaa-aaaap-ahngq-cai"),
        topupProportion: 1n, // send the other half of the minted cycles here
      },
    ],
  });
  console.log(
    "topupResponse",
    JSON.stringify(
      topupResponse,
      (_, v) => (typeof v === "bigint" ? v.toString() : v),
      2,
    ),
  );

  if (!("ok" in topupResponse)) {
    throw new Error(
      "Async topup failed to kick off with error: " + topupResponse.err,
    );
  }

  // Use the requestId to fetch the latest status of the topup request by:
  const requestId = topupResponse.ok;
  console.log("async topup request id", requestId);

  // 1. Checking the latest status of that requestId
  const latestRequestStatus =
    await ICPTopup.getLatestTopupRequestStatus(requestId);
  console.log(
    "latest request status",
    JSON.stringify(latestRequestStatus, (_, value) => {
      if (typeof value === "bigint") return value.toString();
      else if (value instanceof Principal) return value.toText();
      return value;
    }),
  );

  // Or
  // 2. Polling for the final status of the topup request
  // Note: success and error are the two request id end states
  const finalStatus = await ICPTopup.pollAsyncStatusUntilComplete({
    requestId,
    pollIntervalInMs: 5000,
    logStatusUpdates: true,
  });
  console.log(
    "request complete with final status",
    JSON.stringify(finalStatus, (_, value) => {
      if (typeof value === "bigint") return value.toString();
      else if (value instanceof Principal) return value.toText();
      return value;
    }),
  );
}

if (require.main === module) {
  approveAndTopupCanisterAsync()
    .then(() => {
      console.log("done");
    })
    .catch((err) => {
      console.error(err);
    });
}
