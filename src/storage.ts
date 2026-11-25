import ExtensionConfig, { LocalKey } from "./config";

export interface OptionsPaletteState {
  storage: boolean;
  formal: boolean;
  simple: boolean;
}
export type OptionKey = keyof OptionsPaletteState;

// NOTE: make sure the keys in the config `storage.local`
// have a corresponding key in `StorageKeyAndReturnTypeMap`
// with the same name.
export interface StorageKeyAndReturnTypeMap {
  paletteOptionsKey: OptionsPaletteState;
}

// So decyphering the below cryptic statement - 
// Step 1: the defaults has an object with its skeleton as { K: V } nothing new
// Step 2: now we dynamically process the pool of valid keys that are in config e.g: `paletteOptionsKey`
// Step 3: Now we fetch the type that we need dynamically using `StorageValues[K]`
// NOTE: make sure the keys in the config and the above `StorageKeyAndReturnTypeMap`
const defaults: { [K in LocalKey]: StorageKeyAndReturnTypeMap[K] } = {
  paletteOptionsKey: ExtensionConfig.defaults['paletteOptions'],
};

export function getConfiguredDefaults<K extends LocalKey>(localKey: K): StorageKeyAndReturnTypeMap[K] {
    return defaults[localKey] as StorageKeyAndReturnTypeMap[K];
}

export function getStoredKey<K extends LocalKey>(localKey: K): string {
  return ExtensionConfig.storage.local[localKey];
}

export async function readStorage<K extends LocalKey>(
  localKey: K
): Promise<StorageKeyAndReturnTypeMap[K]> {
  const storedKey:string = getStoredKey(localKey);
  const result = await chrome.storage.local.get(storedKey);
  return (result[storedKey]) as StorageKeyAndReturnTypeMap[K];
}

export async function writeStorage<K extends LocalKey>(
  localKey: K,
  value: StorageKeyAndReturnTypeMap[K]
): Promise<void> {
  const storedKey:string = getStoredKey(localKey);
  await chrome.storage.local.set({ [storedKey]: value });
}