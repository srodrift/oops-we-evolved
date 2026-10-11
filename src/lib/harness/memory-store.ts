import type { HarnessStore } from "./store";
import type { HarnessVersionRecord } from "./types";

export function createMemoryStore(): HarnessStore {
  const versions: HarnessVersionRecord[] = [];
  return {
    kind: "memory",
    async save(record) {
      if (versions.some((version) => version.version === record.version)) {
        throw new Error(`Harness version ${record.version} already exists.`);
      }
      versions.push(structuredClone(record));
    },
    async loadLatest() {
      return versions.length === 0 ? null : structuredClone(versions[versions.length - 1]);
    },
    async loadVersion(version) {
      const found = versions.find((record) => record.version === version);
      return found ? structuredClone(found) : null;
    },
  };
}
