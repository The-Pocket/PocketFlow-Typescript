---
layout: default
title: "Map Reduce"
parent: "Design Pattern"
nav_order: 4
---

# Map Reduce

MapReduce is a design pattern suitable when you have either:

- Large input data (e.g., multiple files to process), or
- Large output data (e.g., multiple forms to fill)

and there is a logical way to break the task into smaller, ideally independent parts.

<div align="center">
  <img src="https://github.com/the-pocket/.github/raw/main/assets/mapreduce.png?raw=true" width="400"/>
</div>

You first break down the task using [BatchNode](../core_abstraction/batch.md) in the map phase, followed by aggregation in the reduce phase.

### Example: Document Summarization

```typescript
type SharedStorage = {
  files?: Record<string, string>;
  file_summaries?: Record<string, string>;
  all_files_summary?: string;
};

class SummarizeAllFiles extends BatchNode<SharedStorage> {
  async prep(shared: SharedStorage): Promise<[string, string][]> {
    return Object.entries(shared.files || {}); // [["file1.txt", "aaa..."], ["file2.txt", "bbb..."], ...]
  }

  async exec([filename, content]: [string, string]): Promise<[string, string]> {
    const summary = await callLLM(`Summarize the following file:\n${content}`);
    return [filename, summary];
  }

  async post(
    shared: SharedStorage,
    _: [string, string][],
    summaries: [string, string][]
  ): Promise<string> {
    shared.file_summaries = Object.fromEntries(summaries);
    return "summarized";
  }
}

class CombineSummaries extends Node<SharedStorage> {
  async prep(shared: SharedStorage): Promise<Record<string, string>> {
    return shared.file_summaries || {};
  }

  async exec(summaries: Record<string, string>): Promise<string> {
    const text_list = Object.entries(summaries).map(
      ([fname, summ]) => `${fname} summary:\n${summ}\n`
    );

    return await callLLM(
      `Combine these file summaries into one final summary:\n${text_list.join(
        "\n---\n"
      )}`
    );
  }

  async post(
    shared: SharedStorage,
    _: Record<string, string>,
    finalSummary: string
  ): Promise<string> {
    shared.all_files_summary = finalSummary;
    return "combined";
  }
}

// Create and connect flow
const batchNode = new SummarizeAllFiles();
const combineNode = new CombineSummaries();
batchNode.on("summarized", combineNode);

// Run the flow with test data
const flow = new Flow(batchNode);
flow.run({
  files: {
    "file1.txt":
      "Alice was beginning to get very tired of sitting by her sister...",
    "file2.txt": "Some other interesting text ...",
  },
});
```

> **Performance Tip**: The example above works sequentially. You can speed up the map phase by using `ParallelBatchNode` instead of `BatchNode`. See [(Advanced) Parallel](../core_abstraction/parallel.md) for more details.
> {: .note }
