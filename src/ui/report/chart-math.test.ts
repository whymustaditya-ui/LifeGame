import { expect, it } from 'vitest';
import { areaPath, biggestDrop, linePath, strainedBands, toPoints } from './chart-math';

it('scales values into the box', () => {
  expect(toPoints([0, 50, 100], 260, 80)).toEqual([{ x: 0, y: 80 }, { x: 130, y: 40 }, { x: 260, y: 0 }]);
  expect(toPoints([-100, 100], 260, 80)).toEqual([{ x: 0, y: 80 }, { x: 260, y: 0 }]);
  expect(toPoints([50], 260, 80, { min: 0, max: 100 })).toEqual([{ x: 0, y: 40 }]);
});
it('builds line and area paths', () => {
  const pts = [{ x: 0, y: 80 }, { x: 130, y: 40 }, { x: 260, y: 0 }];
  expect(linePath(pts)).toBe('M0 80 L130 40 L260 0');
  expect(areaPath(pts, 80)).toBe('M0 80 L130 40 L260 0 V80 H0 Z');
});
it('finds the biggest drop and the strained years', () => {
  expect(biggestDrop([10, 30, 12, 40, 35])).toBe(2);
  expect(biggestDrop([1, 2, 3])).toBeNull();
  expect(strainedBands(['oke', 'capek', 'burnout', 'oke', 'capek'])).toEqual([{ start: 1, end: 2 }, { start: 4, end: 4 }]);
});
