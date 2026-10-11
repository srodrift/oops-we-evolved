import { createFileStore, defaultHarnessFilePath } from "./file-store";
import { createMongoStore } from "./mongo-store";
import type { HarnessVersionRecord, StoreKind } from "./types";

export type HarnessStore = {
  kind: StoreKind;
  save(record: HarnessVersionRecord): Promise<void>;
  loadLatest(): Promise<HarnessVersionRecord | null>;
  loadVersion(version: number): Promise<HarnessVersionRecord | null>;
  close?(): Promise<void>;
};

export async function createDefaultStore(): Promise<HarnessStore> {
  const uri = process.env.MONGODB_URI?.trim();
  if (uri) {
    return createMongoStore(uri);
  }
  return createFileStore(defaultHarnessFilePath());
}
