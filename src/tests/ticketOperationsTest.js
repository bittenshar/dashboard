/**
 * Ticket purchase and admin issuance sanity checks.
 *
 * Required env vars for purchase:
 *   BASE_URL       -> e.g. https://api.example.com
 *   EVENT_ID       -> event identifier to associate with the ticket
 *   USER_ID        -> user identifier receiving the ticket
 *   JWT_TOKEN      -> user-scoped JWT cookie value
 *
 * Optional env vars:
 *   TICKET_QUANTITY -> defaults to 1
 *   TICKET_NOTES    -> defaults to "Optional notes for this ticket"
 *   ADMIN_JWT       -> admin JWT cookie for issuing pending tickets
 */

const ensureEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const buildUrl = (base, path) => new URL(path, base).toString();

const requestJson = async (url, init) => {
  const response = await fetch(url, init);
  const text = await response.text();
  let parsed;

  try {
    parsed = text ? JSON.parse(text) : null;
  } catch (error) {
    console.warn('Failed to parse JSON response, falling back to raw text.');
    parsed = text;
  }

  if (!response.ok) {
    const message = `Request failed (${response.status} ${response.statusText})`;
    const error = new Error(message);
    error.status = response.status;
    error.details = parsed;
    throw error;
  }

  return parsed;
};

const purchaseTicket = async () => {
  const baseUrl = ensureEnv('BASE_URL');
  const eventId = ensureEnv('EVENT_ID');
  const userId = ensureEnv('USER_ID');
  const jwt = ensureEnv('JWT_TOKEN');
  const quantity = Number.parseInt(process.env.TICKET_QUANTITY ?? '1', 10) || 1;
  const notes = process.env.TICKET_NOTES ?? 'Optional notes for this ticket';

  const endpoint = buildUrl(baseUrl, '/api/tickets');
  console.log(`\n➡️  Purchasing ticket via ${endpoint}`);

  const payload = { eventId, userId, quantity, notes };

  const result = await requestJson(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': `jwt=${jwt}`
    },
    body: JSON.stringify(payload)
  });

  console.log('✅ Ticket purchase response:', JSON.stringify(result, null, 2));
  return result;
};

const issuePendingTickets = async () => {
  const baseUrl = ensureEnv('BASE_URL');
  const userId = ensureEnv('USER_ID');
  const adminJwt = ensureEnv('ADMIN_JWT');
  const endpoint = buildUrl(baseUrl, `/api/admin/users/${userId}/issue-tickets`);

  console.log(`\n➡️  Issuing pending tickets via ${endpoint}`);

  const result = await requestJson(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': `jwt=${adminJwt}`
    },
    body: JSON.stringify({})
  });

  console.log('✅ Admin issuance response:', JSON.stringify(result, null, 2));
  return result;
};

const run = async () => {
  console.log('🎟️  Ticket operations test starting...');

  try {
    await purchaseTicket();
  } catch (error) {
    console.error('❌ Ticket purchase failed:', error.message);
    if (error.details) {
      console.error('Details:', JSON.stringify(error.details, null, 2));
    }
    console.error('Aborting before admin issuance.');
    return;
  }

  if (!process.env.ADMIN_JWT) {
    console.log('\nℹ️  ADMIN_JWT not set; skipping admin issuance call.');
    return;
  }

  try {
    await issuePendingTickets();
  } catch (error) {
    console.error('❌ Admin issuance failed:', error.message);
    if (error.details) {
      console.error('Details:', JSON.stringify(error.details, null, 2));
    }
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error('Unexpected error while running ticket operations test:', error);
    process.exitCode = 1;
  });
}

export { purchaseTicket, issuePendingTickets };
