import { test } from "node:test";
import assert from "node:assert/strict";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  clampIndex,
  logPosition,
  sceneMeters,
  scenes,
  toMeters,
} from "../lib/scenes";
import {
  createAskHandler,
  createLimiter,
  resolveContext,
} from "../lib/assistant";

test("physical units and log ruler preserve ratios and endpoints", () => {
  assert.equal(toMeters(2, "nm"), 2e-9);
  assert.equal(toMeters(1, "au"), 149597870700);
  assert.equal(toMeters(12756, "km"), 12756000);
  assert.equal(logPosition(1e-10), 0);
  assert.equal(logPosition(1e27), 100);
  assert.ok(
    Math.abs(
      logPosition(100) - logPosition(10) - (logPosition(10) - logPosition(1)),
    ) < 1e-10,
  );
  assert.throws(() => logPosition(0));
  assert.throws(() => logPosition(Infinity));
  assert.ok(
    scenes.every(
      (scene, i) => !i || sceneMeters(scene) > sceneMeters(scenes[i - 1]),
    ),
  );
});
test("navigation clamps rapid input and invalid numbers", () => {
  assert.equal(clampIndex(-100), 0);
  assert.equal(clampIndex(100), 7);
  assert.equal(clampIndex(NaN), 0);
  let index = 0;
  for (let i = 0; i < 500; i++) index = clampIndex(index + 1);
  assert.equal(index, 7);
  for (let i = 0; i < 500; i++) index = clampIndex(index - 1);
  assert.equal(index, 0);
});
test("context comes from server facts, with annotation ownership checked", () => {
  assert.equal(
    resolveContext({
      question: "What is this?",
      sceneId: "earth",
      annotationId: "ocean",
      description: "invented client facts",
    }).annotation?.title,
    "A world of water",
  );
  for (const body of [
    null,
    [],
    { question: "", sceneId: "earth" },
    { question: "a".repeat(601), sceneId: "earth" },
    { question: "hi", sceneId: "other" },
    { question: "hi", sceneId: "dna", annotationId: "ocean" },
  ])
    assert.throws(() => resolveContext(body));
});
test("per-visitor and process daily quotas are bounded and expire", () => {
  const limit = createLimiter();
  for (let i = 0; i < 5; i++) assert.equal(limit("one", 0), true);
  assert.equal(limit("one", 1), false);
  assert.equal(limit("one", 60001), true);
  for (let i = 0; i < 94; i++) assert.equal(limit(`visitor${i}`, 60002), true);
  assert.equal(limit("new", 60003), false);
  assert.equal(limit("new", 86400000), true);
});

async function request(
  handler: ReturnType<typeof createAskHandler>,
  body: unknown,
  method = "POST",
  origin = "http://localhost:3010",
) {
  let status = 200;
  let payload: Record<string, unknown> = {};
  const req = {
    method,
    body,
    headers: {
      host: "localhost:3010",
      origin,
      "content-type": "application/json",
    },
    socket: { remoteAddress: "127.0.0.1" },
  } as NextApiRequest;
  const res = {
    setHeader() {},
    status(code: number) {
      status = code;
      return this;
    },
    json(value: Record<string, unknown>) {
      payload = value;
      return this;
    },
  } as unknown as NextApiResponse;
  await handler(req, res);
  return { status, payload };
}
const question = {
  question: "What is this part?",
  sceneId: "earth",
  annotationId: "ocean",
};
test("offline, invalid input, cross-origin and HTTP method failures are useful", async () => {
  const handler = createAskHandler({
    key: () => undefined,
    enabled: () => false,
  });
  assert.equal((await request(handler, question)).status, 503);
  assert.equal((await request(handler, {})).status, 400);
  assert.equal((await request(handler, question, "GET")).status, 405);
  assert.equal(
    (await request(handler, question, "POST", "https://other.test")).status,
    403,
  );
});
test("provider receives selected feature; only curated sources leave the server", async () => {
  const handler = createAskHandler({
    key: () => "test-only",
    enabled: () => true,
    fetcher: (async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.store, false);
      assert.equal(body.max_output_tokens, 500);
      assert.match(body.instructions, /A world of water/);
      assert.match(body.instructions, /71%/);
      assert.equal(body.input[0].content, question.question);
      return Response.json({
        status: "completed",
        output: [
          {
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  answer: "Oceans cover about 71% of Earth’s surface.",
                  sourceIndices: [0],
                }),
              },
            ],
          },
        ],
      });
    }) as typeof fetch,
  });
  const result = await request(handler, question);
  assert.equal(result.status, 200);
  assert.equal(result.payload.sceneId, "earth");
  assert.deepEqual(result.payload.sources, scenes[4].sources);
});
test("provider rate limits, timeouts, invented citations and incomplete answers are rejected", async () => {
  for (const [fetcher, status] of [
    [async () => new Response("{}", { status: 429 }), 429],
    [
      async () => {
        throw new DOMException("timeout", "TimeoutError");
      },
      504,
    ],
    [
      async () =>
        Response.json({
          status: "completed",
          output: [
            {
              content: [
                {
                  type: "output_text",
                  text: '{"answer":"See https://invented.test","sourceIndices":[99]}',
                },
              ],
            },
          ],
        }),
      502,
    ],
    [async () => Response.json({ status: "incomplete" }), 502],
  ] as const) {
    assert.equal(
      (
        await request(
          createAskHandler({
            key: () => "test-only",
            enabled: () => true,
            fetcher: fetcher as typeof fetch,
          }),
          question,
        )
      ).status,
      status,
    );
  }
});
