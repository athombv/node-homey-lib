export const ENCODING_VERSION: 1;
export const MAX_BYTES: 1024;
export const MAX_BIT: 8191;
export const MAX_ENCODED_LENGTH: 1366;
export const HomeyFeature: Readonly<{
  POC_HOMEY_FEATURE: 'poc.homey-feature';
  POC_ENERGY_NEW_EXPERIENCE: 'poc.energy-new-experience';
  POC_FLOW_EDITOR: 'poc.flow-editor';
  POC_DEVICE_INSIGHTS: 'poc.device-insights';
}>;
export const FEATURE_BITS: Readonly<Record<string, number>>;
export type HomeyFeature = (typeof HomeyFeature)[keyof typeof HomeyFeature];
export type FeatureKey = HomeyFeature;
export interface FeatureSnapshot {
  revision: number;
  features: string;
}
export interface DecodedFeatures {
  revision: number;
  features: Uint8Array;
}
export function encode(bytes: Uint8Array): string;
export function decode(value: unknown): Uint8Array;
export function fromKeys(keys: readonly string[]): Uint8Array;
export function hasFeature(bytes: Uint8Array, key: string): boolean;
export function merge(rollout: Uint8Array, released: Uint8Array): Uint8Array;
export function parseSnapshot(value: unknown): FeatureSnapshot;
export function parseHeaders(headers: { get(name: string): string | null }): DecodedFeatures;
