import { schedule } from '../cron';

jest.mock('node-cron', () => {
  return {
    schedule: (time: 'string', callback: () => void) => {
      callback();
    },
  };
});

it('schedule callback', () => {
  const callback = jest.fn();

  schedule(callback);

  expect(callback).toBeCalledTimes(1);
});
