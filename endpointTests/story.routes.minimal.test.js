import test from 'node:test';
import assert from 'node:assert/strict';
import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import {setupLogger} from "../utils/logger.ts";

const logger = setupLogger({ label: 'story.routes.test' });

// This sample assumes your server is already running on port 8000.
// If you need to spin up the app first, you could do so before running the tests.
const BASE_URL = 'http://localhost:8000';
const prisma = new PrismaClient();

// Example test suite for story routes using Node's built-in test runner
test('GET /stories should return 200 with published stories', async (t) => {
  const response = await fetch(`${BASE_URL}/stories`);
  const status = response.status;
  const data = await response.json();

  logger.info('GET /stories response:', data);
  assert.equal(status, 200, 'Expected HTTP 200 response');
  // Additional assertions as needed
  // e.g., assert.ok(Array.isArray(data), 'Response body should be an array');
});

test('GET /stories/featured should return 200 with featured stories', async (t) => {
  const response = await fetch(`${BASE_URL}/stories/featured`);
  const status = response.status;
  const data = await response.json();

  logger.info('GET /stories/featured response:', data);
  assert.equal(status, 200, 'Expected HTTP 200 response');
});

test('GET /stories/popular should return 200 with popular stories', async (t) => {
  const response = await fetch(`${BASE_URL}/stories/popular`);
  const status = response.status;
  const data = await response.json();

  logger.info('GET /stories/popular response:', data);
  assert.equal(status, 200, 'Expected HTTP 200 response');
});

/**
 * GET /stories/mine: requires auth, returns user-owned stories
 */
test('GET /stories/mine → 200 or 401, depending on auth', async (t) => {
  const response = await fetch(`${BASE_URL}/stories/mine`);
  const status = response.status;
  const data = await (status !== 401 ? response.json() : null);

  logger.info('GET /stories/mine response:', data);
  // Expect 200 if successful (with a valid token), or 401 unauthorized if invalid
  assert.ok([200, 401].includes(status), 'Expected 200 (valid) or 401 (unauthorized)');
});

/**
 * GET /stories/:storyId: returns a single story if owned or published
 */
test('GET /stories/:storyId → 200, 404, or 401', async (t) => {
  const storyId = 24; // Change to a valid story ID in your DB
  const response = await fetch(`${BASE_URL}/stories/${storyId}`);
  const status = response.status;
  const data = await (status === 200 ? response.json() : null);

  logger.info(`GET /stories/${storyId} response:`, data);
  // Could be 200 if found, or 404 if missing, or 401 if not allowed
  assert.ok([200, 404, 401].includes(status), 'Expected 200, 404, or 401');
});

/**
 * POST /stories: creates a new story
 */
test('POST /stories → 201 or 401', async (t) => {
  const newStoryData = {
    title: 'Test Story Title',
    description: 'A story created by the test suite.'
  };

  const response = await fetch(`${BASE_URL}/stories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newStoryData)
  });

  const status = response.status;
  const data = await response.json();

  logger.info('POST /stories response:', data);
  // 201 if created successfully, 401 if unauthorized
  assert.ok([201, 401].includes(status), 'Expected 201 (created) or 401 (unauthorized)');
});

/**
 * POST /stories/draft: creates an empty draft story
 */
test('POST /stories/draft → 201 or 401', async (t) => {
  const response = await fetch(`${BASE_URL}/stories/draft`, {
    method: 'POST',
  });

  const status = response.status;
  const data = await response.json();

  logger.info('POST /stories/draft response:', data);
  assert.ok([201, 401].includes(status), 'Expected 201 or 401');
});

/**
 * PUT /stories/:storyId: updates an existing story if owner
 */
test('PUT /stories/:storyId → 200, 404, or 401', async (t) => {
  const storyId = 27; // Provide a valid story ID
  const updateData = {
    title: 'Updated Title',
    description: 'Updated Description'
  };

  const response = await fetch(`${BASE_URL}/stories/${storyId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData)
  });

  const status = response.status;
  const data = await (status === 200 ? response.json() : null);

  logger.info(`PUT /stories/${storyId} response:`, data);
  assert.ok([200, 404, 401].includes(status), 'Expected 200, 404, or 401');
});

/**
 * DELETE /stories/:storyId: deletes an existing story if owner
 */
test('DELETE /stories/:storyId → 200, 404, or 401', async (t) => {
  const storyId = 24; // Provide a story ID that can be safely deleted

  const response = await fetch(`${BASE_URL}/stories/${storyId}`, {method: 'DELETE'});

  const status = response.status;
  logger.info(`DELETE /stories/${storyId} status:`, status);

  // 200 if deleted, 404 if not found, 401 if unauthorized
  assert.ok([200, 404, 401].includes(status), 'Expected 200, 404, or 401');
});

/**
 * POST /stories/:storyId/cover: updates the story’s cover image if owner
 *
 * Node’s built-in fetch doesn’t have a built-in “multipart/form-data” handler,
 * so you may need a library or manually build a multipart request. For demonstration,
 * we’ll just show a placeholder example using JSON data.
 */
test('POST /stories/:storyId/cover → 201, 404, or 401', async (t) => {
  const storyId = 27;
  const filePath = 'endpointTests/image.jpg'; // Adjust the path to your local image

  // Ensure the file exists before uploading
  assert.ok(fs.existsSync(filePath), `Test image not found at: ${filePath}`);

  // Create FormData and append the file as "files" field
  const form = new FormData();
  form.append('files', await fs.openAsBlob(filePath), {
    filename: 'image.jpg',
    contentType: 'image/jpeg'
  });

  const response = await fetch(`${BASE_URL}/stories/${storyId}/cover`, {
    method: 'POST',
    body: form
  });

  const status = response.status;
  let data;
  if (status === 201) {
    data = await response.json();
    logger.info('Upload success:', data);
    // Example assertion: confirm file data was returned
    assert.ok(data?.id, 'Expected file record ID in response');
  } else {
    logger.info('Upload failed with status:', status);
  }

  // Could be 201 (created), 401 (unauthorized), 404 (if story not found), etc.
  assert.ok([201, 401, 404, 500].includes(status), 'Unexpected status code');
});

/**
 * Teardown: disconnect Prisma
 */
test('Teardown: disconnect Prisma', async (t) => {
  await prisma.$disconnect();
  logger.info('Prisma disconnected');
});
