import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export const SEARCH_URL = "https://search.parallel.ai/mcp";
export const USER_AGENT = "PocketFlow-Typescript/parallel-search-cookbook";

export interface SearchOptions {
  fetch?: typeof globalThis.fetch;
  timeout?: number;
}

/** Search the web anonymously and return the MCP tool's text, including sources. */
export async function searchWeb(query: string, options: SearchOptions = {}): Promise<string> {
  if (!query.trim()) throw new Error("Provide a nonempty search query.");
  const client = new Client({ name: "pocketflow-parallel-search", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(SEARCH_URL), {
    requestInit: { headers: { "User-Agent": USER_AGENT } },
    fetch: options.fetch,
  });
  const requestOptions = { timeout: options.timeout ?? 30_000 };
  try {
    await client.connect(transport, requestOptions);
    const { tools } = await client.listTools({}, requestOptions);
    if (!tools.some((tool) => tool.name === "web_search")) {
      throw new Error("The MCP server did not advertise web_search.");
    }
    const result = CallToolResultSchema.parse(await client.callTool({
      name: "web_search",
      arguments: {
        objective: query,
        search_queries: [query],
        session_id: randomUUID(),
      },
    }, CallToolResultSchema, requestOptions));
    const text = result.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
    if (result.isError) throw new Error(`Search failed: ${text || "MCP tool error"}`);
    if (!text.trim()) throw new Error("Search returned no text.");
    return text;
  } finally {
    await client.close();
  }
}
