# Web search with Parallel Search MCP

Run a PocketFlow search flow without an API key or language model. The example
connects to [Parallel Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp)
using the official MCP client, discovers `web_search`, and prints the returned
text and source URLs as a report.

## Setup

Requires Node.js 18 or later and npm. From the repository root, build the local
PocketFlow package, then install this example's dependencies:

```bash
npm ci
npm run build
cd cookbook/pocketflow-parallel-search
npm ci
npm run main -- "PocketFlow TypeScript framework Node Flow shared store"
```

A successful run prints `# Web search sources` followed by search excerpts and
source URLs. Results depend on the query and the live service. This is a source
report, not a generated answer; you can pass `shared.results` to another Node
in your own application.

## How it works

`src/main.ts` reads your query and runs `createSearchFlow().run(shared)`.
The Search Node calls `src/search.ts`, which connects over Streamable HTTP to
`https://search.parallel.ai/mcp`, lists tools, then calls `web_search` with your
query as the objective and search query. It sends a fresh session identifier and
the User-Agent `PocketFlow-Typescript/parallel-search-cookbook`. The Report Node
stores the tool's text in `shared.report`, which the CLI prints.

Anonymous access is free for exploration and light use, subject to service rate
limits. It uses the server's Fast search mode. This example sends no API key,
doesn't load environment credentials or saved settings, and doesn't configure
other applications. Running it explicitly selects Parallel; existing examples
and the core package keep their current behavior and dependencies.

Each MCP request has a 30-second timeout. Connection failures, missing tools,
rate limits, tool errors, and empty text cause a nonzero CLI exit. The client
closes in both success and failure paths. If your network requires an HTTP proxy,
configure your Node runtime to use it; on Node.js 22.21+ you can use
`NODE_OPTIONS=--use-env-proxy` with your existing `HTTPS_PROXY` settings.

## Validation

```bash
npm run typecheck
npm test
```

The offline tests run the real Flow and MCP SDK against an HTTP fixture. They
check tool discovery, anonymous request headers, query arguments, source report
output, missing tools, tool and HTTP errors, empty responses, request timeout,
and stream cleanup. `npm run main -- "your query"` checks the live service
separately and may be rate limited.

See [design.md](design.md) for the shared-store and node design.
