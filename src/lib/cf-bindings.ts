/**
 * Cloudflare Worker bindings (D1 + R2).
 * Declared minimally so we do not require @cloudflare/workers-types in tsconfig.
 */
export type D1Result = { success: boolean };

export type D1Prepared = {
  bind: (...values: unknown[]) => D1Prepared;
  first: <T = unknown>() => Promise<T | null>;
  all: <T = unknown>() => Promise<{ results: T[] }>;
  run: () => Promise<D1Result>;
};

export type D1Database = {
  prepare: (sql: string) => D1Prepared;
  batch: (statements: D1Prepared[]) => Promise<unknown>;
};

export type R2HttpMetadata = { contentType?: string };

export type R2PutOptions = { httpMetadata?: R2HttpMetadata };

export type R2ObjectBody = {
  body: ReadableStream | null;
  httpMetadata?: R2HttpMetadata;
};

export type R2Bucket = {
  put: (key: string, value: ReadableStream | ArrayBuffer | Blob, options?: R2PutOptions) => Promise<unknown>;
  get: (key: string) => Promise<R2ObjectBody | null>;
  delete: (keys: string | string[]) => Promise<unknown>;
};

export type SpeedoEnv = {
  DB?: D1Database;
  VIDEOS?: R2Bucket;
};
