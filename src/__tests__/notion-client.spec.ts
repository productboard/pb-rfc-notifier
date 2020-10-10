import {
  getURLforDocument,
  getAllDocuments,
  checkForNewDocument,
} from '../notion-client';
import { initDatabase } from '../database';
import { Await } from '../types';

jest.mock('../environment', () => ({
  NOTION_BASE: 'https://www.notion.so/swag/',
}));

jest.mock('../logger', () => {
  const loggerMock = new Proxy(
    {},
    {
      get: () => () => loggerMock,
    }
  );

  return { logger: loggerMock };
});

jest.mock('notion-client', () => ({
  NotionAPI: class NotionAPI {
    getCollectionData() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return require('./__fixtures__/collection.json');
    }
  },
}));

it('return correct url', () => {
  expect(getURLforDocument('123-abc')).toBe(
    'https://www.notion.so/swag/123abc'
  );
});

it('should return document', () => {
  void expect(getAllDocuments()).resolves.toMatchInlineSnapshot(`
    Object {
      "documents": Object {
        "a333e20f-0201-4afb-9ae5-103797e9633e": Object {
          "id": "a333e20f-0201-4afb-9ae5-103797e9633e",
          "title": "Second RFC",
        },
        "c8601e50-dd0f-41b7-b571-5eadf4145483": Object {
          "id": "c8601e50-dd0f-41b7-b571-5eadf4145483",
          "title": "First RFC",
        },
      },
      "ids": Array [
        "c8601e50-dd0f-41b7-b571-5eadf4145483",
        "a333e20f-0201-4afb-9ae5-103797e9633e",
      ],
    }
  `);
});

describe('checkForNewDocument', () => {
  const setup = <
    DB extends Parameters<typeof initDatabase>[0],
    Documents extends Await<ReturnType<typeof getAllDocuments>>
  >(
    db: DB,
    documents: Documents
  ) => {
    const database = initDatabase(db);
    const getDocuments = () => Promise.resolve(documents);
    const callback = jest.fn();

    return { database, getDocuments, callback };
  };

  it('should callback with newly added document', async () => {
    const { database, getDocuments, callback } = setup(['1', '2'], {
      ids: ['1', '2', '3'],
      documents: {
        '1': {
          id: '1',
          title: 'Fist RFC',
        },
        '2': {
          id: '2',
          title: 'Second RFC',
        },
        '3': {
          id: '3',
          title: 'Third RFC',
        },
      },
    });

    await checkForNewDocument({
      database,
      getDocuments,
      callback,
    });

    expect(callback).toHaveBeenCalledWith({ id: '3', title: 'Third RFC' });
    expect(callback).toHaveBeenCalledTimes(1);

    await checkForNewDocument({
      database,
      getDocuments,
      callback,
    });

    // now new document is found, the previous was saved so, it should have been called still once

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not callback because document are still the same', async () => {
    const { database, getDocuments, callback } = setup(['1', '2', '3'], {
      ids: ['1', '2', '3'],
      documents: {
        '1': {
          id: '1',
          title: 'Fist RFC',
        },
        '2': {
          id: '2',
          title: 'Second RFC',
        },
        '3': {
          id: '3',
          title: 'Third RFC',
        },
      },
    });

    await checkForNewDocument({
      database,
      getDocuments,
      callback,
    });

    expect(callback).toHaveBeenCalledTimes(0);
  });
});
