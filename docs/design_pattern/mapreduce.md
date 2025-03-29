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
import { BatchNode, Node, Flow } from "../src/index";

// Define shared storage type
type SharedStorage = {
  files?: Record<string, string>;
  file_summaries?: Record<string, string>;
  all_files_summary?: string;
};

class SummarizeAllFiles extends BatchNode<SharedStorage> {
  async prep(shared: SharedStorage): Promise<[string, string][]> {
    const files = shared.files || {};
    return Object.entries(files); // [["file1.txt", "aaa..."], ["file2.txt", "bbb..."], ...]
  }

  async exec(one_file: [string, string]): Promise<[string, string]> {
    const [filename, file_content] = one_file;
    const summary_text = await callLLM(
      `Summarize the following file:\n${file_content}`
    );
    return [filename, summary_text];
  }

  async post(
    shared: SharedStorage,
    prepRes: [string, string][],
    execRes: [string, string][]
  ): Promise<string | undefined> {
    shared.file_summaries = Object.fromEntries(execRes);
    return "summarized";
  }
}

class CombineSummaries extends Node<SharedStorage> {
  async prep(shared: SharedStorage): Promise<Record<string, string>> {
    return shared.file_summaries || {};
  }

  async exec(file_summaries: Record<string, string>): Promise<string> {
    // format as: "File1: summary\nFile2: summary...\n"
    const text_list: string[] = [];
    for (const [fname, summ] of Object.entries(file_summaries)) {
      text_list.push(`${fname} summary:\n${summ}\n`);
    }
    const big_text = text_list.join("\n---\n");

    return await callLLM(
      `Combine these file summaries into one final summary:\n${big_text}`
    );
  }

  async post(
    shared: SharedStorage,
    prepRes: Record<string, string>,
    final_summary: string
  ): Promise<string | undefined> {
    shared.all_files_summary = final_summary;
    return "combined";
  }
}

// Helper function to simulate LLM calls
async function callLLM(prompt: string): Promise<string> {
  // In a real implementation, this would call an actual LLM
  return `Summary for: ${prompt.slice(0, 20)}...`;
}

// Create and connect nodes
const batchNode = new SummarizeAllFiles();
const combineNode = new CombineSummaries();
batchNode.on("summarized", combineNode);

// Create flow
const flow = new Flow(batchNode);

// Run the flow
const shared: SharedStorage = {
  files: {
    "file1.txt":
      "Alice was beginning to get very tired of sitting by her sister...",
    "file2.txt": "Some other interesting text ...",
    // ...
  },
};

async function runFlow() {
  await flow.run(shared);
  console.log("Individual Summaries:", shared.file_summaries);
  console.log("\nFinal Summary:\n", shared.all_files_summary);
}

runFlow();
```

> **Performance Tip**: The example above works sequentially. You can speed up the map phase by using `ParallelBatchNode` instead of `BatchNode`. See [(Advanced) Parallel](../core_abstraction/parallel.md) for more details.
> {: .note }
