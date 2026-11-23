export type Stream = 'lottery' | 'deal' | 'luck' | 'career' | 'outcome' | 'policy';

/** 32-bit string hash (xmur3) over UTF-16 code units. */
export function hashKey(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

/** One mulberry32 step seeded by hash(seed, key). Stateless, so every draw is addressable. Returns [0, 1). */
export function draw(seed: string, key: string): number {
  let t = (hashKey(`${seed}\u0000${key}`) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function keyOf(age: number, stream: Stream, id: string | number): string {
  return `${age}|${stream}|${id}`;
}
