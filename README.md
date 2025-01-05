# icptopup-ts

TypeScript agent for programmatically topping up canisters via ICPTopup

## Topping up canisters from ICP

ICPTopup allows you to easily send cycles to up to 100 canisters at once.

### 1. To get started, first install icptopup-ts

`npm i icptopup-ts`

### 2. Approve ICPTopup to mint cycles from ICP on your behalf

```typescript
import ICPTopup from "icptopup-ts";

// in your function
const agent = HttpAgent.createSync({ identity, host: "https://ic0.app" });
const approvalBlockIndex = await ICPTopup.approveToSpendE8s({
  agent,
  e8sToApprove: BigInt(1e7), // approve a minimum of 0.1 ICP
});
```

### 3. Call ICPTopup's synchronous `batchTopupSync()` API, or its [asynchronous](#perform-an-asynchronous-topup) topup API.

Both synchronous and asynchronous APIs allow you to specify:
`e8sToTransfer` - ICP transferred for minting cycles
`topupTargets` - the canisters being topped up.

The `topupProportion` in each topup target allows you to specify how much of the minted cycles you want to send to each canister. In the example below, there are 3 proportions total (2 + 1), and so 2/3rds of the minted cycles are being sent to the first canister, and 1/3rd of the minted cycles are sent to the second canister.

```TypeScript
  const result = await icpTopupActor.batchTopupSync({
    // Note: make sure the icp account spent from has enough e8s for the ledger transfer (10_000 e8s)
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
```

## Check your ICPTopup account allowance

The `ICPTopup.checkAllowance()` API provides a simple wrapper determining your ICP allowance with ICPTopup

```TypeScript
  const allowance = await ICPTopup.checkAllowance({
    account: {
      owner: identity.getPrincipal(),
      subaccount: [],
    },
  });
```

## Perform an asynchronous topup

ICPTopup usually takes 20-30 seconds to complete a topup.

While the synchronous `batchTopupSync()` API executes topups synchronously leaving the caller waiting for a response, the `batchTopupAsync()` API immediately returns a request identifier that can be used to immediately poll for the result of the topup.

Kicking off an asynchronous topup is nearly identical to a synchronous one.

```TypeScript
  // Kick off the topup
  const result = await icpTopupActor.batchTopupAsync({
    e8sToTransfer: BigInt(1e7), // 0.1 ICP
    topupTargets: [
      {
        canisterId: Principal.fromText("qc4nb-ciaaa-aaaap-aawqa-cai"),
        topupProportion: 1n, // send up 1/2 of the minted cycles here
      },
      {
        canisterId: Principal.fromText("gf3bz-2aaaa-aaaap-ahngq-cai"),
        topupProportion: 1n, // send 1/2 of the minted cycles here
      },
    ],
  });
```

And you can check the status of an asynchronous topup in two ways:

### 1. Check the latest status of the requestId with `getLatestTopupRequestStatus()`

```TypeScript
  if (!("ok" in topupResponse)) {
    throw new Error(
      "Async topup failed to kick off with error: " + topupResponse.err,
    );
  }

  const requestId = topupResponse.ok; // request id associated with the topup
  const latestRequestStatus = await ICPTopup.getLatestTopupRequestStatus(requestId);
```

Or

### 2. Poll for the final topup result with `pollAsyncStatusUntilComplete()`

```TypeScript
  await ICPTopup.pollAsyncStatusUntilComplete({
    requestId,
    pollIntervalInMs: 5000, // optional, defaults to 5sec
    logStatusUpdates: true, // optional, use if you want to output status update console logs
  });
```
