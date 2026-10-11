import { MongoClient, type WithId } from "mongodb";
import type { HarnessStore } from "./store";
import type { HarnessVersionRecord } from "./types";

export const HARNESS_DB = "morph";
export const HARNESS_COLLECTION = "harness_versions";

export async function createMongoStore(uri: string): Promise<HarnessStore> {
  const client = new MongoClient(uri);
  await client.connect();
  const collection = client.db(HARNESS_DB).collection<HarnessVersionRecord>(HARNESS_COLLECTION);
  await collection.createIndex({ version: 1 }, { unique: true });

  return {
    kind: "mongodb",
    async save(record) {
      await collection.insertOne(record);
    },
    async loadLatest() {
      const document = await collection.find().sort({ version: -1 }).limit(1).next();
      return stripId(document);
    },
    async loadVersion(version) {
      const document = await collection.findOne({ version });
      return stripId(document);
    },
    async close() {
      await client.close();
    },
  };
}

function stripId(document: WithId<HarnessVersionRecord> | null): HarnessVersionRecord | null {
  if (!document) {
    return null;
  }
  return {
    version: document.version,
    parentVersion: document.parentVersion,
    tools: document.tools,
    rules: document.rules,
    guardrails: document.guardrails,
    contextPolicy: document.contextPolicy,
    cause: document.cause,
    evidence: document.evidence,
    decision: document.decision,
    createdAt: document.createdAt,
  };
}
