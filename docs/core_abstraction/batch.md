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
// Define shared storage type
type SharedStorage = {
  data: string;
  summary?: string;
};

class MapSummaries extends BatchNode<SharedStorage> {
  async prep(shared: SharedStorage): Promise<string[]> {
    // Suppose we have a big file; chunk it
    const content = shared.data;
    const chunks: string[] = [];
    const chunkSize = 10000;

    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }

    return chunks;
  }

  async exec(chunk: string): Promise<string> {
    // Process each chunk with LLM
    const prompt = `Summarize this chunk in 10 words: ${chunk}`;
    const summary = await callLlm(prompt);
    return summary;
  }

  async post(
    shared: SharedStorage,
    prepRes: string[],
    execRes: string[]
  ): Promise<string | undefined> {
    // Combine summaries
    const combined = execRes.join("\n");
    shared.summary = combined;
    return "default";
  }
}

// Usage
const mapSummaries = new MapSummaries();
const flow = new Flow(mapSummaries);
await flow.run({ data: "very long text content..." });
```

---

## 2. BatchFlow

A **BatchFlow** runs a **Flow** multiple times, each time with different `params`. Think of it as a loop that replays the Flow for each parameter set.

### Example: Summarize Many Files

```typescript
// Define shared storage and parameter types
type SharedStorage = {
  files: string[];
};

type FileParams = {
  filename: string;
};

class SummarizeAllFiles extends BatchFlow<SharedStorage, FileParams> {
  async prep(shared: SharedStorage): Promise<FileParams[]> {
    return shared.files.map((filename) => ({ filename }));
  }
}

// Suppose we have a per-file Flow (e.g., load_file >> summarize >> reduce):
const summarizeFile = new SummarizeFile(loadFile);

// Wrap that flow into a BatchFlow:
const summarizeAllFiles = new SummarizeAllFiles(summarizeFile);
await summarizeAllFiles.run(shared);
```

### Under the Hood

1. `prep(shared)` returns a list of param dicts—e.g., `[{filename: "file1.txt"}, {filename: "file2.txt"}, ...]`.
2. The **BatchFlow** loops through each dict. For each one:
   - It merges the dict with the BatchFlow's own `params`.
   - It calls `flow.run(shared)` using the merged result.
3. This means the sub-Flow is run **repeatedly**, once for every param dict.

---

## 3. Nested or Multi-Level Batches

You can nest a **BatchFlow** in another **BatchFlow**. For instance:

- **Outer** batch: returns a list of directory param dicts (e.g., `{"directory": "/pathA"}`, `{"directory": "/pathB"}`, ...).
- **Inner** batch: returning a list of per-file param dicts.

At each level, **BatchFlow** merges its own param dict with the parent's. By the time you reach the **innermost** node, the final `params` is the merged result of **all** parents in the chain. This way, a nested structure can keep track of the entire context (e.g., directory + file name) at once.

```typescript
// Define shared storage and parameter types
type SharedStorage = {
  [key: string]: any;
};

type DirectoryParams = {
  directory: string;
};

type FileParams = DirectoryParams & {
  filename: string;
};

class FileBatchFlow extends BatchFlow<SharedStorage, FileParams> {
  async prep(shared: SharedStorage): Promise<FileParams[]> {
    const directory = this._params.directory;
    // Get files from the directory
    const files = await getFilesInDirectory(directory).filter((f) =>
      f.endsWith(".txt")
    );

    return files.map((filename) => ({
      directory, // Pass on the directory from parent
      filename, // Add the filename for this batch item
    }));
  }
}

class DirectoryBatchFlow extends BatchFlow<SharedStorage, DirectoryParams> {
  async prep(shared: SharedStorage): Promise<DirectoryParams[]> {
    const directories = ["/path/to/dirA", "/path/to/dirB"];
    return directories.map((directory) => ({
      directory,
    }));
  }
}

// MapSummaries will have params like {"directory": "/path/to/dirA", "filename": "file1.txt"}
const mapSummaries = new MapSummaries();
const innerFlow = new FileBatchFlow(mapSummaries);
const outerFlow = new DirectoryBatchFlow(innerFlow);
await outerFlow.run({});
```
