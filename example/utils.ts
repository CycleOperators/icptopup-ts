import { Ed25519KeyIdentity } from "@dfinity/identity";
import { readFileSync } from "fs-extra";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pemFile = require("pem-file");

export function identityFromPemFile(pemFilePath: string): Ed25519KeyIdentity {
  const rawKey = readFileSync(pemFilePath).toString();
  const buf = pemFile.decode(rawKey);

  if (buf.length !== 85) {
    throw new Error(`expecting byte length 85 but got ${buf.length}`);
  }

  const identity = Ed25519KeyIdentity.fromSecretKey(buf.subarray(16, 48));
  return identity;
}
