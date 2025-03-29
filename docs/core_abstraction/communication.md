---
layout: default
title: "Communication"
parent: "Core Abstraction"
nav_order: 3
---

# Communication

Nodes and Flows **communicate** in 2 ways:

1. **Shared Store (for almost all the cases)**

   - A global data structure (often an in-mem dict) that all nodes can read ( `prep()`) and write (`post()`).
   - Great for data results, large content, or anything multiple nodes need.
   - You shall design the data structure and populate it ahead.
   - > **Separation of Concerns:** Use `Shared Store` for almost all cases to separate _Data Schema_ from _Compute Logic_! This approach is both flexible and easy to manage, resulting in more maintainable code. `Params` is more a syntax sugar for [Batch](./batch.md).
     > {: .best-practice }

2. **Params (only for [Batch](./batch.md))**
   - Each node has a local, ephemeral `params` dict passed in by the **parent Flow**, used as an identifier for tasks. Parameter keys and values shall be **immutable**.
   - Good for identifiers like filenames or numeric IDs, in Batch mode.

If you know memory management, think of the **Shared Store** like a **heap** (shared by all function calls), and **Params** like a **stack** (assigned by the caller).

---

## 1. Shared Store

### Overview

A shared store is typically an in-mem dictionary, like:

```typescript
interface SharedStore {
  data: Record<string, unknown>;
  summary: Record<string, unknown>;
  config: Record<string, unknown>;
  // ...other properties
}

const shared: SharedStore = { data: {}, summary: {}, config: {} /* ... */ };
```

It can also contain local file handlers, DB connections, or a combination for persistence. We recommend deciding the data structure or DB schema first based on your app requirements.

### Example

```typescript
interface SharedStore {
  data: string;
  summary: string;
}

class LoadData extends Node<SharedStore> {
  async post(
    shared: SharedStore,
    prepRes: unknown,
    execRes: unknown
  ): Promise<string | undefined> {
    // We write data to shared store
    shared.data = "Some text content";
    return "default";
  }
}

class Summarize extends Node<SharedStore> {
  async prep(shared: SharedStore): Promise<unknown> {
    // We read data from shared store
    return shared.data;
  }

  async exec(prepRes: unknown): Promise<unknown> {
    // Call LLM to summarize
    const prompt = `Summarize: ${prepRes}`;
    const summary = await callLlm(prompt);
    return summary;
  }

  async post(
    shared: SharedStore,
    prepRes: unknown,
    execRes: unknown
  ): Promise<string | undefined> {
    // We write summary to shared store
    shared.summary = execRes as string;
    return "default";
  }
}

const loadData = new LoadData();
const summarize = new Summarize();
loadData.next(summarize);
const flow = new Flow(loadData);

const shared: SharedStore = { data: "", summary: "" };
flow.run(shared);
```

Here:

- `LoadData` writes to `shared.data`.
- `Summarize` reads from `shared.data`, summarizes, and writes to `shared.summary`.

---

## 2. Params

**Params** let you store _per-Node_ or _per-Flow_ config that doesn't need to live in the shared store. They are:

- **Immutable** during a Node's run cycle (i.e., they don't change mid-`prep->exec->post`).
- **Set** via `setParams()`.
- **Cleared** and updated each time a parent Flow calls it.

> Only set the uppermost Flow params because others will be overwritten by the parent Flow.
>
> If you need to set child node params, see [Batch](./batch.md).
> {: .warning }

Typically, **Params** are identifiers (e.g., file name, page number). Use them to fetch the task you assigned or write to a specific part of the shared store.

### Example

```typescript
interface SharedStore {
  data: Record<string, string>;
  summary: Record<string, string>;
}

interface SummarizeParams {
  filename: string;
}

// 1) Create a Node that uses params
class SummarizeFile extends Node<SharedStore, SummarizeParams> {
  async prep(shared: SharedStore): Promise<unknown> {
    // Access the node's param
    const filename = this._params.filename;
    return shared.data[filename] || "";
  }

  async exec(prepRes: unknown): Promise<unknown> {
    const prompt = `Summarize: ${prepRes}`;
    return await callLlm(prompt);
  }

  async post(
    shared: SharedStore,
    prepRes: unknown,
    execRes: unknown
  ): Promise<string | undefined> {
    const filename = this._params.filename;
    shared.summary[filename] = execRes as string;
    return "default";
  }
}

// 2) Set params
const node = new SummarizeFile();

// 3) Set Node params directly (for testing)
node.setParams({ filename: "doc1.txt" });
node.run(shared);

// 4) Create Flow
const flow = new Flow<SharedStore, SummarizeParams>(node);

// 5) Set Flow params (overwrites node params)
flow.setParams({ filename: "doc2.txt" });
flow.run(shared); // The node summarizes doc2, not doc1
```
