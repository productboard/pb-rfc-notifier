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

function isIgnored(document: NotionDocument) {
  // filter out documents we don't want to watch for, kinda naive but it works
  if (
    NOTION_COLLECTION_FILTER &&
    // this matches also partial filter, eg. "📂 Open" and "Open"
    !Object.values(document['otherFields']).find((field) =>
      field.includes(NOTION_COLLECTION_FILTER)
    )
  ) {
    return true;
  }

  return false;
}

const normalizeDocuments = (
  ids: NotionCollectionData['result']['blockIds'],
  collectionData: NotionCollectionData
) => {
  const getDocument = createGetDocument(collectionData);

  return ids.reduce((documents, id) => {
    const document = getDocument(id);

    if (!document) {
      return documents;
    }

    if (isIgnored(document)) {
      return documents;
    }

    documents[document.id] = document;

    return documents;
  }, {} as { [key: string]: Document });
};

const createGetDocument = (collectionData: NotionCollectionData) => (
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
    logger.info(`ignoring document ${id} as it's without properties`);

    return null;
  }

  const fields = normalizeProperties(properties);

  const { title, otherFields } = fields;

  // ignore documents with possibly mistaken titles
  if (title.trim().length < 3) {
    logger.info(
      `ignoring document ${id} because has wrong title format (<3 chars)`
    );

    return null;
  }

  return {
    id: collection.value.id,
    otherFields: otherFields,
    title,
  };
};

export const getAllDocuments = async (): Promise<Documents> => {
  const collectionData: Await<ReturnType<
    typeof api.getCollectionData
  >> = await api.getCollectionData(NOTION_COLLECTION, NOTION_COLLECTION_VIEW);

  if (!collectionData.result) {
    throw Error(`collection not found or you don't have permissions`);
  }

  const ids = collectionData.result.blockIds;

  if (ids.length === 0) {
    throw Error('no documents in database - probably expired token');
  }

  let normalizedDocuments: ReturnType<typeof normalizeDocuments> = {};
  try {
    normalizedDocuments = normalizeDocuments(ids, collectionData);
  } catch (e) {
    throw Error('normalizedDocuments failed');
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
