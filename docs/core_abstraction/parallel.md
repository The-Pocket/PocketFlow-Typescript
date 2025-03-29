---
layout: default
title: "(Advanced) Parallel"
parent: "Core Abstraction"
nav_order: 6
---

# (Advanced) Parallel

**Parallel** Nodes and Flows let you run multiple operations **concurrently**—for example, summarizing multiple texts at once. This can improve performance by overlapping I/O and compute.

> Parallel nodes and flows excel at overlapping I/O-bound work—like LLM calls, database queries, API requests, or file I/O. TypeScript's Promise-based implementation allows for truly concurrent execution of asynchronous operations.
> {: .warning }

> - **Ensure Tasks Are Independent**: If each item depends on the output of a previous item, **do not** parallelize.
>
> - **Beware of Rate Limits**: Parallel calls can **quickly** trigger rate limits on LLM services. You may need a **throttling** mechanism.
>
> - **Consider Single-Node Batch APIs**: Some LLMs offer a **batch inference** API where you can send multiple prompts in a single call. This is more complex to implement but can be more efficient than launching many parallel requests and mitigates rate limits.
>   {: .best-practice }

## ParallelBatchNode

Like **BatchNode**, but runs operations in **parallel** using Promise.all():

```typescript
class TextSummarizer extends ParallelBatchNode<SharedStorage> {
  async prep(shared: SharedStorage): Promise<string[]> {
    // e.g., multiple texts
    return shared.texts || [];
  }

  async exec(text: string): Promise<string> {
    const prompt = `Summarize: ${text}`;
    return await callLlm(prompt);
  }

  async post(
    shared: SharedStorage,
    prepRes: string[],
    execRes: string[]
  ): Promise<string | undefined> {
    shared.summaries = execRes;
    return "default";
  }
}

const node = new TextSummarizer();
const flow = new Flow(node);
```

## ParallelBatchFlow

Parallel version of **BatchFlow**. Each iteration of the sub-flow runs **concurrently** using Promise.all():

```typescript
class SummarizeMultipleFiles extends ParallelBatchFlow<SharedStorage> {
  async prep(shared: SharedStorage): Promise<Record<string, any>[]> {
    return (shared.files || []).map((f) => ({ filename: f }));
  }
}

const subFlow = new Flow(new LoadAndSummarizeFile());
const parallelFlow = new SummarizeMultipleFiles(subFlow);
await parallelFlow.run(shared);
```
