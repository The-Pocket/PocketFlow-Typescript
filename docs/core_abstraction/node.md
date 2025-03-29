---
layout: default
title: "Node"
parent: "Core Abstraction"
nav_order: 1
---

# Node

A **Node** is the smallest building block. Each Node has 3 steps `prep->exec->post`:

<div align="center">
  <img src="https://github.com/the-pocket/.github/raw/main/assets/node.png?raw=true" width="400"/>
</div>

1. `prep(shared)`

   - **Read and preprocess data** from `shared` store.
   - Examples: _query DB, read files, or serialize data into a string_.
   - Return `prepRes`, which is used by `exec()` and `post()`.

2. `exec(prepRes)`

   - **Execute compute logic**, with optional retries and error handling (below).
   - Examples: _(mostly) LLM calls, remote APIs, tool use_.
   - ⚠️ This shall be only for compute and **NOT** access `shared`.
   - ⚠️ If retries enabled, ensure idempotent implementation.
   - Return `execRes`, which is passed to `post()`.

3. `post(shared, prepRes, execRes)`
   - **Postprocess and write data** back to `shared`.
   - Examples: _update DB, change states, log results_.
   - **Decide the next action** by returning a _string_ (`action = "default"` if _None_).

> **Why 3 steps?** To enforce the principle of _separation of concerns_. The data storage and data processing are operated separately.
>
> All steps are _optional_. E.g., you can only implement `prep` and `post` if you just need to process data.
> {: .note }

### Fault Tolerance & Retries

You can **retry** `exec()` if it raises an exception via two parameters when define the Node:

- `max_retries` (int): Max times to run `exec()`. The default is `1` (**no** retry).
- `wait` (int): The time to wait (in **seconds**) before next retry. By default, `wait=0` (no waiting).
  `wait` is helpful when you encounter rate-limits or quota errors from your LLM provider and need to back off.

```typescript
const myNode = new SummarizeFile(3, 10); // maxRetries = 3, wait = 10 seconds
```

When an exception occurs in `exec()`, the Node automatically retries until:

- It either succeeds, or
- The Node has retried `maxRetries - 1` times already and fails on the last attempt.

You can get the current retry times (0-based) from `this.currentRetry`.

### Graceful Fallback

To **gracefully handle** the exception (after all retries) rather than raising it, override:

```typescript
execFallback(prepRes: unknown, error: Error): unknown {
  return "There was an error processing your request.";
}
```

By default, it just re-raises the exception.

### Example: Summarize file

```typescript
type SharedStore = {
  data: string;
  summary?: string;
};

class SummarizeFile extends Node<SharedStore> {
  prep(shared: SharedStore): string {
    return shared.data;
  }

  exec(content: string): string {
    if (!content) return "Empty file content";

    const prompt = `Summarize this text in 10 words: ${content}`;
    return callLlm(prompt);
  }

  execFallback(_: string, error: Error): string {
    return "There was an error processing your request.";
  }

  post(shared: SharedStore, _: string, summary: string): string | undefined {
    shared.summary = summary;
    return undefined; // "default" action
  }
}

// Example usage
const node = new SummarizeFile(3); // maxRetries = 3
const shared: SharedStore = { data: "Long text to summarize..." };
const action = node.run(shared);

console.log("Action:", action);
console.log("Summary:", shared.summary);
```
