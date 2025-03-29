---
layout: default
title: "Batch"
parent: "Core Abstraction"
nav_order: 4
---

# Batch

**Batch** makes it easier to handle large inputs in one Node or **rerun** a Flow multiple times. Example use cases:

- **Chunk-based** processing (e.g., splitting large texts).
- **Iterative** processing over lists of input items (e.g., user queries, files, URLs).

## 1. BatchNode

A **BatchNode** extends `Node` but changes `prep()` and `exec()`:

- **`prep(shared)`**: returns an **array** of items to process.
- **`exec(item)`**: called **once** per item in that iterable.
- **`post(shared, prepRes, execResList)`**: after all items are processed, receives a **list** of results (`execResList`) and returns an **Action**.

### Example: Summarize a Large File

```typescript
type SharedStorage = {
  data: string;
  summary?: string;
};

class MapSummaries extends BatchNode<SharedStorage> {
  async prep(shared: SharedStorage): Promise<string[]> {
    // Chunk content into manageable pieces
    const content = shared.data;
    const chunks: string[] = [];
    const chunkSize = 10000;

    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }

    return chunks;
  }

  async exec(chunk: string): Promise<string> {
    const prompt = `Summarize this chunk in 10 words: ${chunk}`;
    return await callLlm(prompt);
  }

  async post(
    shared: SharedStorage,
    _: string[],
    summaries: string[]
  ): Promise<string> {
    shared.summary = summaries.join("\n");
    return "default";
  }
}

// Usage
const flow = new Flow(new MapSummaries());
await flow.run({ data: "very long text content..." });
```

---

## 2. BatchFlow

A **BatchFlow** runs a **Flow** multiple times, each time with different `params`. Think of it as a loop that replays the Flow for each parameter set.

### Example: Summarize Many Files

```typescript
type SharedStorage = {
  files: string[];
};

type FileParams = {
  filename: string;
};

class SummarizeAllFiles extends BatchFlow<SharedStorage> {
  async prep(shared: SharedStorage): Promise<FileParams[]> {
    return shared.files.map((filename) => ({ filename }));
  }
}

// Create a per-file summarization flow
const summarizeFile = new SummarizeFile();
const summarizeAllFiles = new SummarizeAllFiles(summarizeFile);

await summarizeAllFiles.run({ files: ["file1.txt", "file2.txt"] });
```

### Under the Hood

1. `prep(shared)` returns a list of param objects—e.g., `[{filename: "file1.txt"}, {filename: "file2.txt"}, ...]`.
2. The **BatchFlow** loops through each object and:
   - Merges it with the BatchFlow's own `params`
   - Calls `flow.run(shared)` using the merged result
3. This means the sub-Flow runs **repeatedly**, once for every param object.

---

## 3. Nested Batches

You can nest BatchFlows to handle hierarchical data processing:

```typescript
type DirectoryParams = {
  directory: string;
};

type FileParams = DirectoryParams & {
  filename: string;
};

class FileBatchFlow extends BatchFlow<SharedStorage> {
  async prep(shared: SharedStorage): Promise<FileParams[]> {
    const directory = this._params.directory;
    const files = await getFilesInDirectory(directory).filter((f) =>
      f.endsWith(".txt")
    );

    return files.map((filename) => ({
      directory, // Pass on directory from parent
      filename, // Add filename for this batch item
    }));
  }
}

class DirectoryBatchFlow extends BatchFlow<SharedStorage> {
  async prep(shared: SharedStorage): Promise<DirectoryParams[]> {
    return ["/path/to/dirA", "/path/to/dirB"].map((directory) => ({
      directory,
    }));
  }
}

// Process all files in all directories
const processingNode = new ProcessingNode();
const fileFlow = new FileBatchFlow(processingNode);
const dirFlow = new DirectoryBatchFlow(fileFlow);
await dirFlow.run({});
```
