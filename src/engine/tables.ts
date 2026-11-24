import data from './data/percentiles.json';
import type { QuantileTable } from './percentile';

/** The simulated distributions the report reads percentiles from (spec 5.11). */
export const PERCENTILE_TABLES: Readonly<{ netWorth: QuantileTable; luck: QuantileTable }> = {
  netWorth: data.netWorth,
  luck: data.luck,
};
