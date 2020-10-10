import fetch, { Response } from 'node-fetch';
import { SLACK_WEBHOOK_URL } from './environment';

export const notify = ({ message }: { message: string }): Promise<Response> =>
  fetch(SLACK_WEBHOOK_URL, {
    method: 'post',
    body: JSON.stringify({
      text: message,
    }),
    headers: { 'Content-Type': 'application/json' },
  });
