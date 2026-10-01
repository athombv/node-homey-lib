export const MAX_BIT: 8191;
export const FEATURE_BITS: Readonly<Record<string, number>>;
export function encode(bytes: Uint8Array): string;
export function decode(value: unknown): Uint8Array;
export function fromKeys(keys: readonly string[]): Uint8Array;
export function hasFeature(bytes: Uint8Array, key: string): boolean;
export function merge(rollout: Uint8Array, released: Uint8Array): Uint8Array;
export function parseHeaders(headers: { get(name: string): string | null }): Uint8Array;
