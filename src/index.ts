import {
  checkForNewDocument,
  getAllDocuments,
  getURLforDocument,
} from './notion-client';
import { initDatabase } from './database';
import { schedule } from './cron';
import { notify } from './slack';
import { logger } from './logger';

const bootstrapDatabase = async () => {
  const { ids } = await getAllDocuments();
  const database = initDatabase(ids);

  return database;
};

const main = async () => {
  const database = await bootstrapDatabase();

  type Callback = Parameters<typeof checkForNewDocument>['0']['callback'];

  const sendMessage: Callback = async ({ id, title }) => {
    const url = getURLforDocument(id);

    await notify({
      message: `Hey everyone! Great news! New RFC is available! Check out *"<${url}|${title}>"* right away!`,
    });

    logger.info(`notification sent for ${id}`);
  };

  schedule(() => {
    void checkForNewDocument({
      database,
      getDocuments: getAllDocuments,
      callback: sendMessage,
    });
  });
};

main()
  .then(() => logger.info('app is running!'))
  .catch(() => logger.error('fatal error!'));

const healthMessage = {
  status: 'ok',
  message: 'RFCNotion2Slack is running',
};

const printHealth = (): typeof healthMessage => healthMessage;

export default printHealth;
