import { NotionAPI } from 'notion-client';
import { logger } from './logger';
import {
  NOTION_BASE,
  NOTION_API,
  NOTION_COLLECTION,
  NOTION_COLLECTION_VIEW,
} from './environment';
import { initDatabase } from './database';
import { Values } from './types';

const api = new NotionAPI({
  authToken: NOTION_API,
});

type Documents = {
  ids: Array<string>;
  documents: {
    [id: string]: {
      id: string;
      title: string;
    };
  };
};

export const getAllDocuments = async (): Promise<Documents> => {
  const collectionData = await api.getCollectionData(
    NOTION_COLLECTION,
    NOTION_COLLECTION_VIEW
  );

  if (!collectionData.result) {
    logger.error(`collection not found or you don't have permissions!`);

    throw Error('collection not found');
  }

  const ids = collectionData.result.blockIds;

  const getDocument = (id: string) => {
    const collection =
      collectionData.recordMap.block && collectionData.recordMap.block[id];

    if (!collection) {
      logger.error(`document ${id} not found`);

      return {
        id: '-1',
        title: '',
      };
    }

    const block = collection.value;
    const title = (block.properties as { title?: Array<string> })?.title;

    return {
      id: collection.value.id,
      title: title?.flat()[0] as string,
    };
  };

  const normalizedDocuments = ids.map(getDocument).reduce((acc, val) => {
    if (!val.title) {
      logger.debug(`${val.id} has no title`);
      return acc;
    }

    acc[val.id] = val;

    return acc;
  }, {} as { [key: string]: ReturnType<typeof getDocument> });

  return {
    ids: Object.keys(normalizedDocuments),
    documents: normalizedDocuments,
  };
};

export const getURLforDocument = (id: string): string =>
  `${NOTION_BASE}${id.replace(/-/g, '')}`;

type Document = Values<Documents['documents']>;
type Database = ReturnType<typeof initDatabase>;

type TCheckForNewDocument = {
  database: Database;
  getDocuments: typeof getAllDocuments;
  callback: (data: Document) => void;
};

export const checkForNewDocument = async ({
  database,
  getDocuments,
  callback,
}: TCheckForNewDocument): Promise<void> => {
  logger.info(`checking for new documents...`);

  const { ids, documents } = await getDocuments();

  const newDocuments = ids
    .filter((id) => !database.has(id))
    .map((id) => documents[id]);

  newDocuments.forEach(({ id, title }) => {
    database.add(id);

    logger.info(`new document: ${title}`);

    callback({ id, title });
  });
};
