const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const listeners = {};
const writes = [];
let networkRequests = 0;

const cachedResponse = new Response('old asset');
const deployedResponse = new Response('new asset', { status: 200 });

const context = {
  URL,
  Response,
  caches: {
    match: async () => cachedResponse,
    open: async () => ({
      addAll: async () => {},
      put: async (request, response) => {
        writes.push({ request, body: await response.text() });
      }
    }),
    keys: async () => []
  },
  fetch: async () => {
    networkRequests += 1;
    return deployedResponse;
  },
  self: {
    location: { origin: 'https://culpable.github.io' },
    addEventListener: (type, listener) => { listeners[type] = listener; },
    skipWaiting: () => {},
    clients: { claim: async () => {} }
  }
};

vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'),
  context,
  { filename: 'sw.js' }
);

async function verifyStaleWhileRevalidate() {
  const waits = [];
  let responsePromise;
  const request = {
    method: 'GET',
    mode: 'cors',
    url: 'https://culpable.github.io/japan-trip/assets/app-icon-192.png'
  };

  listeners.fetch({
    request,
    respondWith: (promise) => { responsePromise = promise; },
    waitUntil: (promise) => { waits.push(promise); }
  });

  const response = await responsePromise;
  assert.equal(await response.text(), 'old asset', 'cached assets should remain available immediately');

  await Promise.all(waits);
  assert.equal(networkRequests, 1, 'cached assets should revalidate against the deployed version');
  assert.equal(writes.length, 1, 'the deployed asset should replace the stale cache entry');
  assert.equal(writes[0].body, 'new asset');
}

verifyStaleWhileRevalidate()
  .then(() => console.log('service-worker stale-while-revalidate test passed'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
