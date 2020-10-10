import { notify } from '../slack';
import fetch from 'node-fetch';

jest.mock('../environment', () => ({
  SLACK_WEBHOOK_URL: 'https://api.slack.com/webhook',
}));

jest.mock('node-fetch', () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

it('can sent message', async () => {
  await notify({ message: 'this is message' });

  expect(fetch).toBeCalledWith('https://api.slack.com/webhook', {
    body: '{"text":"this is message"}',
    headers: { 'Content-Type': 'application/json' },
    method: 'post',
  });
});
