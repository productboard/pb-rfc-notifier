import { NotionAPI } from 'notion-client';
import { logger } from './logger';
import {
  NOTION_BASE,
  NOTION_API,
  NOTION_COLLECTION,
  NOTION_COLLECTION_VIEW,
  NOTION_COLLECTION_FILTER,
} from './environment';
import { initDatabase } from './database';
import { Await, Values } from './types';

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

type NotionCollectionData = Await<ReturnType<typeof api.getCollectionData>>;
type NotionBlockProperties = {
  [key: string]: Array<string> | undefined;
};
type NotionDocument = {
  id: string;
  title: string;
  otherFields: { [key: string]: string };
};

const normalizeProperties = (properties: NotionBlockProperties) =>
  Object.entries(properties).reduce(
    (acc, [key, value]) => {
      const normalizedValue = value?.flat()[0];
      if (!normalizedValue) {
        return acc;
      }

      if (key === 'title') {
        acc.title = normalizedValue;

        return acc;
      }

      acc.otherFields[key] = normalizedValue;

      return acc;
    },
    { otherFields: {}, title: '' } as {
      otherFields: { [key: string]: string };
      title: string;
    }
  );

const normalizeDocuments = (
  ids: NotionCollectionData['result']['blockIds'],
  collectionData: NotionCollectionData
) => {
  const getDocument = getDocumentFactory(collectionData);

  return ids.map(getDocument).reduce((acc, val) => {
    if (!val) {
      logger.info(`some document has no title or other fields`);
      return acc;
    }

    // filter out documents we don't want to watch for, kinda naive but it works
    if (
      NOTION_COLLECTION_FILTER &&
      !Object.values(val['otherFields']).includes(NOTION_COLLECTION_FILTER)
    ) {
      return acc;
    }

    acc[val.id] = val;

    return acc;
  }, {} as { [key: string]: Document });
};

const getDocumentFactory = (collectionData: NotionCollectionData) => (
  id: string
): NotionDocument | null => {
  const collection =
    collectionData.recordMap.block && collectionData.recordMap.block[id];

  if (!collection) {
    logger.error(`document ${id} not found`);

    return null;
  }

  const block = collection.value;
  const properties = block.properties as NotionBlockProperties | undefined;

  if (!properties) {
    return null;
  }

  const fields = normalizeProperties(properties);

  const { title, otherFields } = fields;

  return {
    id: collection.value.id,
    otherFields: otherFields,
    title,
  };
};

export const getAllDocuments = async (): Promise<Documents> => {
  let collectionData: Await<ReturnType<typeof api.getCollectionData>>;

  try {
    collectionData = await api.getCollectionData(
      NOTION_COLLECTION,
      NOTION_COLLECTION_VIEW
    );
  } catch (e) {
    logger.error(`notion-client failed to get data`);

    throw Error('notion-client failed');
  }

  if (!collectionData.result) {
    logger.error(`collection not found or you don't have permissions!`);

    throw Error('collection not found');
  }

  const ids = collectionData.result.blockIds;

  if (ids.length === 0) {
    logger.error('No documents in database. Probably expired token.');
  }

  let normalizedDocuments: ReturnType<typeof normalizeDocuments> = {};
  try {
    normalizedDocuments = normalizeDocuments(ids, collectionData);
  } catch (e) {
    logger.error('getting normalizedDocuments failed');
  }

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
