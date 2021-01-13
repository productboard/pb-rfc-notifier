import {
  checkForNewDocument,
  getAllDocuments,
  getURLforDocument,
} from './notion-client';
import { initDatabase } from './database';
import { schedule } from './cron';
import { notify } from './slack';
import { logger } from './logger';

// $url and $title will be replaced
const MESSAGE_TEMPLATE =
  'Hey everyone! Great news! New RFC is available! Check out *"<$url|$title>"* right away!';

const bootstrapDatabase = async () => {
  const { ids } = await getAllDocuments();

  if (ids.length === 0) {
    logger.warn('No documents in database. Probably expired token.');
  }

  const database = initDatabase(ids);

  return database;
};

const sendMessage: Parameters<
  typeof checkForNewDocument
>['0']['callback'] = async ({ id, title }) => {
  const url = getURLforDocument(id);

  await notify({
    message: MESSAGE_TEMPLATE.replace('$url', url).replace('$title', title),
  });

  logger.info(`notification sent for ${id}`);
};

const run = async () => {
  const database = await bootstrapDatabase();

  schedule(() => {
    void checkForNewDocument({
      database,
      getDocuments: getAllDocuments,
      callback: sendMessage,
    });
  });
};

run()
  .then(() => logger.info('app is running'))
  .catch(() => logger.error('fatal error'));

const healthMessage = {
  status: 'ok',
  message: 'RFCNotion2Slack is running',
};

const printHealth = (): typeof healthMessage => healthMessage;

export default printHealth;
