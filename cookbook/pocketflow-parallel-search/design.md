# Web search flow

The user supplies a query on the command line. A Search Node reads it from the
shared store and calls a search utility. A Report Node formats the returned text
as a source report in the shared store, which the entry point prints.

```mermaid
flowchart LR
    Search[Search Node] --> Report[Report Node]
```

The utility connects to Parallel Search MCP over Streamable HTTP, discovers the
web_search tool, and executes it without credentials. It preserves returned text
and source links, propagates connection and tool errors, bounds requests with a
timeout, and closes the client. Each run has one fresh search session identifier.

The example is explicitly invoked and has its own dependencies. PocketFlow's
core, existing search examples, and other applications' provider choices stay as
configured. No language model or saved settings are needed for this source report.

Tests execute Flow.run with an HTTP fixture at the SDK transport boundary to
check discovery, tool arguments, output, errors, timeout, and connection cleanup.
A live run separately checks anonymous access and actual search output.
