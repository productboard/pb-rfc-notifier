import { logger } from './logger';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      NOTION_BASE: string;
      SLACK_WEBHOOK_URL: string;
      NOTION_API: string;
      NOTION_COLLECTION: string;
      NOTION_COLLECTION_VIEW: string;
      NOTION_COLLECTION_FILTER: string;
    }
  }
}

export const VERSION = process.env.CI_COMMIT_SHORT_SHA || 'development';
export const NOTION_BASE = process.env.NOTION_BASE;
export const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
export const NOTION_API = process.env.NOTION_API;
export const NOTION_COLLECTION = process.env.NOTION_COLLECTION;
export const NOTION_COLLECTION_VIEW = process.env.NOTION_COLLECTION_VIEW;
export const NOTION_COLLECTION_FILTER =
  process.env.NOTION_COLLECTION_FILTER || '';

if (
  !NOTION_BASE ||
  !SLACK_WEBHOOK_URL ||
  !NOTION_API ||
  !NOTION_COLLECTION ||
  !NOTION_COLLECTION_VIEW
) {
  logger.error('ENV are not configured correctly!');

  throw Error();
}
