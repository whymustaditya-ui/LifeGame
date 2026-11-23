/** No l, o, 0 or 1, so a seed survives being read aloud. 32 characters, one per 5 bits. */
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
const SEED_LENGTH = 10;

type Bytes = Uint8Array<ArrayBuffer>;

export function newSeed(fill: (bytes: Bytes) => Uint8Array = (b) => crypto.getRandomValues(b)): string {
  const bytes = fill(new Uint8Array(SEED_LENGTH));
  return Array.from(bytes, (b) => ALPHABET[b & 31]).join('');
}
