import cron from 'node-cron';

export const schedule = (callback: () => void): void => {
  // run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    callback();
  });
};
