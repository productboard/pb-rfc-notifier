import { initDatabase } from '../database';
import { Await } from '../types';

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

it('return correct url', async () => {
  jest.doMock('../environment', () => ({
    NOTION_BASE: 'https://www.notion.so/swag/',
  }));

  const { getURLforDocument } = await import('../notion-client');

  expect(getURLforDocument('123-abc')).toBe(
    'https://www.notion.so/swag/123abc'
  );
});

it('should return non-filtered documents', async () => {
  jest.doMock('../environment', () => ({
    NOTION_BASE: 'https://www.notion.so/swag/',
    NOTION_COLLECTION_FILTER: '',
  }));

  const { getAllDocuments } = await import('../notion-client');

  void expect(getAllDocuments()).resolves.toMatchInlineSnapshot(`
          Object {
            "documents": Object {
              "a333e20f-0201-4afb-9ae5-103797e9633e": Object {
                "id": "a333e20f-0201-4afb-9ae5-103797e9633e",
                "otherFields": Object {},
                "title": "Second RFC",
              },
              "c8601e50-dd0f-41b7-b571-5eadf4145483": Object {
                "id": "c8601e50-dd0f-41b7-b571-5eadf4145483",
                "otherFields": Object {},
                "title": "First RFC",
              },
              "e3ab7bda-fba5-41c8-aa15-f2c782ad7d14": Object {
                "id": "e3ab7bda-fba5-41c8-aa15-f2c782ad7d14",
                "otherFields": Object {
                  "?o?E": "24",
                  "it]k": "Resolved",
                  "mz{\`": "‣",
                  "neQt": "infra",
                  "pb>J": "‣",
                  "ssMN": "‣",
                },
                "title": "More properties!",
              },
            },
            "ids": Array [
              "c8601e50-dd0f-41b7-b571-5eadf4145483",
              "a333e20f-0201-4afb-9ae5-103797e9633e",
              "e3ab7bda-fba5-41c8-aa15-f2c782ad7d14",
            ],
          }
        `);
});

it('should return filtered documents', async () => {
  jest.doMock('../environment', () => ({
    NOTION_BASE: 'https://www.notion.so/swag/',
    NOTION_COLLECTION_FILTER: 'Resolved',
  }));

  const { getAllDocuments } = await import('../notion-client');

  void expect(getAllDocuments()).resolves.toMatchInlineSnapshot(`
          Object {
            "documents": Object {
              "e3ab7bda-fba5-41c8-aa15-f2c782ad7d14": Object {
                "id": "e3ab7bda-fba5-41c8-aa15-f2c782ad7d14",
                "otherFields": Object {
                  "?o?E": "24",
                  "it]k": "Resolved",
                  "mz{\`": "‣",
                  "neQt": "infra",
                  "pb>J": "‣",
                  "ssMN": "‣",
                },
                "title": "More properties!",
              },
            },
            "ids": Array [
              "e3ab7bda-fba5-41c8-aa15-f2c782ad7d14",
            ],
          }
        `);
});

it('should return filtered documents based on partial filter', async () => {
  jest.doMock('../environment', () => ({
    NOTION_BASE: 'https://www.notion.so/swag/',
    NOTION_COLLECTION_FILTER: 'solved',
  }));

  const { getAllDocuments } = await import('../notion-client');

  void expect(getAllDocuments()).resolves.toMatchInlineSnapshot(`
          Object {
            "documents": Object {
              "e3ab7bda-fba5-41c8-aa15-f2c782ad7d14": Object {
                "id": "e3ab7bda-fba5-41c8-aa15-f2c782ad7d14",
                "otherFields": Object {
                  "?o?E": "24",
                  "it]k": "Resolved",
                  "mz{\`": "‣",
                  "neQt": "infra",
                  "pb>J": "‣",
                  "ssMN": "‣",
                },
                "title": "More properties!",
              },
            },
            "ids": Array [
              "e3ab7bda-fba5-41c8-aa15-f2c782ad7d14",
            ],
          }
        `);
});

describe('checkForNewDocument', () => {
  jest.doMock('../environment', () => ({}));

  const setup = <
    DB extends Parameters<typeof initDatabase>[0],
    Documents extends Await<
      ReturnType<typeof import('../notion-client').getAllDocuments>
    >
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
    const { checkForNewDocument } = await import('../notion-client');

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
    const { checkForNewDocument } = await import('../notion-client');

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
