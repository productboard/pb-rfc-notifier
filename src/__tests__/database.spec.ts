import { initDatabase } from '../database';
it('can create database', () => {
  const database = initDatabase(['some', 'data']);

  expect(database.has('some')).toBe(true);
  database.add('yes');
  expect(database.has('yes')).toBe(true);
});
