import assert from "node:assert/strict";
import { test } from "node:test";
import { createSearchFlow, SearchStore } from "../src/flow";
import { SEARCH_URL, USER_AGENT } from "../src/search";

interface RpcRequest {
  id?: number;
  method: string;
  params?: { name?: string; arguments?: Record<string, unknown> };
}

function fixture(mode: "ok" | "missing" | "error" | "empty" | "timeout" | "http-error" = "ok") {
  const requests: RpcRequest[] = [];
  let streamClosed = false;
  const fetch: typeof globalThis.fetch = async (url, init) => {
    assert.equal(String(url), SEARCH_URL);
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("user-agent"), USER_AGENT);
    assert.equal(headers.get("authorization"), null);
    if (init?.method === "GET") {
      const body = new ReadableStream({
        start(controller) {
          init.signal?.addEventListener("abort", () => {
            streamClosed = true;
            controller.close();
          }, { once: true });
        },
        cancel() { streamClosed = true; },
      });
      return new Response(body, { headers: { "Content-Type": "text/event-stream" } });
    }
    const rpc = JSON.parse(String(init?.body)) as RpcRequest;
    requests.push(rpc);
    if (rpc.id === undefined) return new Response(null, { status: 202 });
    let result: unknown;
    if (rpc.method === "initialize") {
      result = {
        protocolVersion: "2025-03-26", capabilities: { tools: {} },
        serverInfo: { name: "fixture", version: "1.0.0" },
      };
    } else if (rpc.method === "tools/list") {
      result = { tools: mode === "missing" ? [] : [{
        name: "web_search", inputSchema: { type: "object" },
      }] };
    } else if (rpc.method === "tools/call") {
      if (mode === "http-error") return new Response("unavailable", { status: 503 });
      if (mode === "timeout") return new Promise(() => {});
      result = {
        isError: mode === "error",
        content: mode === "empty" ? [] : [{ type: "text", text: mode === "error"
          ? "rate limit exceeded"
          : "PocketFlow is a minimalist framework. Source: https://github.com/The-Pocket/PocketFlow-Typescript" }],
      };
    } else {
      throw new Error(`Unexpected method ${rpc.method}`);
    }
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: rpc.id, result }), {
      headers: { "Content-Type": "application/json", "mcp-session-id": "fixture-session" },
    });
  };
  return { fetch, requests, closed: () => streamClosed };
}

test("Flow discovers and executes anonymous search, then stores a useful source report", async () => {
  const server = fixture();
  const shared: SearchStore = { query: "PocketFlow TypeScript framework" };
  await createSearchFlow({ fetch: server.fetch }).run(shared);
  assert.match(shared.report!, /^# Web search sources/);
  assert.match(shared.report!, /minimalist framework/);
  assert.match(shared.report!, /https:\/\/github.com\/The-Pocket\/PocketFlow-Typescript/);
  assert.deepEqual(server.requests.filter((r) => r.id !== undefined).map((r) => r.method),
    ["initialize", "tools/list", "tools/call"]);
  const call = server.requests.find((r) => r.method === "tools/call")!;
  assert.equal(call.params?.name, "web_search");
  assert.equal(call.params?.arguments?.objective, shared.query);
  assert.deepEqual(call.params?.arguments?.search_queries, [shared.query]);
  assert.match(String(call.params?.arguments?.session_id), /^[0-9a-f-]{36}$/);
  assert.equal(call.params?.arguments?.model_name, undefined);
  assert.equal(server.closed(), true);
});

for (const [mode, error] of [
  ["missing", /did not advertise web_search/],
  ["error", /rate limit exceeded/],
  ["empty", /returned no text/],
  ["timeout", /timed out/i],
  ["http-error", /unavailable/],
] as const) {
  test(`Flow propagates ${mode} and closes the connection without a report`, async () => {
    const server = fixture(mode);
    const shared: SearchStore = { query: "PocketFlow TypeScript framework" };
    await assert.rejects(createSearchFlow({ fetch: server.fetch, timeout: 100 }).run(shared), error);
    assert.equal(shared.report, undefined);
    assert.equal(server.closed(), true);
  });
}

test("blank query makes no network request", async () => {
  const server = fixture();
  await assert.rejects(createSearchFlow({ fetch: server.fetch }).run({ query: "  " }), /nonempty/);
  assert.equal(server.requests.length, 0);
});
