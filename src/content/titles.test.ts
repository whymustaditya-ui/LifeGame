import { expect, it } from 'vitest';
import { jobTitle } from './titles';

it('names each rung and caps at the top of the ladder', () => {
  expect(jobTitle('degree_0')).toBe('Management trainee');
  expect(jobTitle('diploma_3')).toBe('Supervisor');
  expect(jobTitle('highschool_9')).toBe('Senior manager');
  expect(jobTitle('nonsense')).toBe('Staff');
});
