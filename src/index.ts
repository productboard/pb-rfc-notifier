import {
  checkForNewDocument,
  getAllDocuments,
  getURLforDocument,
} from './notion-client';
import { initDatabase } from './database';
import { schedule } from './cron';
import { notify } from './slack';
import { logger } from './logger';
import { VERSION } from './environment';

// $url and $title will be replaced
const MESSAGE_TEMPLATE =
  'Hey everyone! Great news! New RFC is available! Check out *"<$url|$title>"* right away!';

const bootstrapDatabase = async () => {
  const { ids } = await getAllDocuments();

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
  .then(() => logger.info(`app (${VERSION}) is running`))
  .catch((e) => logger.error(`fatal error: ${e}`));

const healthMessage = {
  status: 'ok',
  message: `RFCNotion2Slack (${VERSION}) is running`,
};

const printHealth = (): typeof healthMessage => healthMessage;

export default printHealth;
