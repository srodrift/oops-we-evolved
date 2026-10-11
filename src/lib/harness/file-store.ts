import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { HarnessStore } from "./store";
import type { HarnessVersionRecord } from "./types";

type StoreFile = {
  versions: HarnessVersionRecord[];
};

export function defaultHarnessFilePath(): string {
  return path.join(process.cwd(), "data", "harness-versions.json");
}

export function createFileStore(filePath: string = defaultHarnessFilePath()): HarnessStore {
  return {
    kind: "file",
    async save(record) {
      const current = await readStore(filePath);
      if (current.versions.some((version) => version.version === record.version)) {
        throw new Error(`Harness version ${record.version} already exists.`);
      }
      current.versions.push(record);
      current.versions.sort((left, right) => left.version - right.version);
      await writeStore(filePath, current);
    },
    async loadLatest() {
      const current = await readStore(filePath);
      return current.versions.at(-1) ?? null;
    },
    async loadVersion(version) {
      const current = await readStore(filePath);
      return current.versions.find((record) => record.version === version) ?? null;
    },
  };
}

async function readStore(filePath: string): Promise<StoreFile> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    if (!parsed || !Array.isArray(parsed.versions)) {
      throw new Error(`Harness store at ${filePath} is not a version list.`);
    }
    return parsed;
  } catch (error) {
    if (isNotFound(error)) {
      return { versions: [] };
    }
    throw error;
  }
}

async function writeStore(filePath: string, data: StoreFile): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(data, null, 2));
  await rename(temporary, filePath);
}

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
