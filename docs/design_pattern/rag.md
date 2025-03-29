---
layout: default
title: "RAG"
parent: "Design Pattern"
nav_order: 3
---

# RAG (Retrieval Augmented Generation)

For certain LLM tasks like answering questions, providing relevant context is essential. One common architecture is a **two-stage** RAG pipeline:

<div align="center">
  <img src="https://github.com/the-pocket/.github/raw/main/assets/rag.png?raw=true" width="400"/>
</div>

1. **Offline stage**: Preprocess and index documents ("building the index").
2. **Online stage**: Given a question, generate answers by retrieving the most relevant context.

---

## Stage 1: Offline Indexing

We create three Nodes:

1. `ChunkDocs` – [chunks](../utility_function/chunking.md) raw text.
2. `EmbedDocs` – [embeds](../utility_function/embedding.md) each chunk.
3. `StoreIndex` – stores embeddings into a [vector database](../utility_function/vector.md).

```typescript
class ChunkDocs extends BatchNode {
  async prep(shared: unknown): Promise<string[]> {
    // A list of file paths in shared["files"]. We process each file.
    return shared["files"];
  }

  async exec(filepath: string): Promise<string[]> {
    // read file content. In real usage, do error handling.
    const text = fs.readFileSync(filepath, "utf-8");
    // chunk by 100 chars each
    const chunks: string[] = [];
    const size = 100;
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.substring(i, i + size));
    }
    return chunks;
  }

  async post(
    shared: unknown,
    prepRes: string[],
    execResList: string[][]
  ): Promise<Action | undefined> {
    // execResList is a list of chunk-lists, one per file.
    // flatten them all into a single list of chunks.
    const allChunks: string[] = [];
    for (const chunkList of execResList) {
      allChunks.push(...chunkList);
    }
    shared["allChunks"] = allChunks;
    return undefined;
  }
}

class EmbedDocs extends BatchNode {
  async prep(shared: unknown): Promise<string[]> {
    return shared["allChunks"];
  }

  async exec(chunk: string): Promise<number[]> {
    return await getEmbedding(chunk);
  }

  async post(
    shared: unknown,
    prepRes: string[],
    execResList: number[][]
  ): Promise<Action | undefined> {
    // Store the list of embeddings.
    shared["allEmbeds"] = execResList;
    console.log(`Total embeddings: ${execResList.length}`);
    return undefined;
  }
}

class StoreIndex extends Node {
  async prep(shared: unknown): Promise<number[][]> {
    // We'll read all embeds from shared.
    return shared["allEmbeds"];
  }

  async exec(allEmbeds: number[][]): Promise<unknown> {
    // Create a vector index (faiss or other DB in real usage).
    const index = await createIndex(allEmbeds);
    return index;
  }

  async post(
    shared: unknown,
    prepRes: number[][],
    index: unknown
  ): Promise<Action | undefined> {
    shared["index"] = index;
    return undefined;
  }
}

// Wire them in sequence
const chunkNode = new ChunkDocs();
const embedNode = new EmbedDocs();
const storeNode = new StoreIndex();

chunkNode.next(embedNode);
embedNode.next(storeNode);

const offlineFlow = new Flow(chunkNode);
```

Usage example:

```typescript
const shared = {
  files: ["doc1.txt", "doc2.txt"], // any text files
};
await offlineFlow.run(shared);
```

---

## Stage 2: Online Query & Answer

We have 3 nodes:

1. `EmbedQuery` – embeds the user's question.
2. `RetrieveDocs` – retrieves top chunk from the index.
3. `GenerateAnswer` – calls the LLM with the question + chunk to produce the final answer.

```typescript
class EmbedQuery extends Node {
  async prep(shared: unknown): Promise<string> {
    return shared["question"];
  }

  async exec(question: string): Promise<number[]> {
    return await getEmbedding(question);
  }

  async post(
    shared: unknown,
    prepRes: string,
    qEmb: number[]
  ): Promise<Action | undefined> {
    shared["qEmb"] = qEmb;
    return undefined;
  }
}

class RetrieveDocs extends Node {
  async prep(shared: unknown): Promise<[number[], unknown, string[]]> {
    // We'll need the query embedding, plus the offline index/chunks
    return [shared["qEmb"], shared["index"], shared["allChunks"]];
  }

  async exec(inputs: [number[], unknown, string[]]): Promise<string> {
    const [qEmb, index, chunks] = inputs;
    const [I, D] = await searchIndex(index, qEmb, { topK: 1 });
    const bestId = I[0][0];
    const relevantChunk = chunks[bestId];
    return relevantChunk;
  }

  async post(
    shared: unknown,
    prepRes: [number[], unknown, string[]],
    relevantChunk: string
  ): Promise<Action | undefined> {
    shared["retrievedChunk"] = relevantChunk;
    console.log("Retrieved chunk:", relevantChunk.substring(0, 60), "...");
    return undefined;
  }
}

class GenerateAnswer extends Node {
  async prep(shared: unknown): Promise<[string, string]> {
    return [shared["question"], shared["retrievedChunk"]];
  }

  async exec(inputs: [string, string]): Promise<string> {
    const [question, chunk] = inputs;
    const prompt = `Question: ${question}\nContext: ${chunk}\nAnswer:`;
    return await callLlm(prompt);
  }

  async post(
    shared: unknown,
    prepRes: [string, string],
    answer: string
  ): Promise<Action | undefined> {
    shared["answer"] = answer;
    console.log("Answer:", answer);
    return undefined;
  }
}

const embedQNode = new EmbedQuery();
const retrieveNode = new RetrieveDocs();
const generateNode = new GenerateAnswer();

embedQNode.next(retrieveNode);
retrieveNode.next(generateNode);
const onlineFlow = new Flow(embedQNode);
```

Usage example:

```typescript
// Suppose we already ran OfflineFlow and have:
// shared["allChunks"], shared["index"], etc.
shared["question"] = "Why do people like cats?";

await onlineFlow.run(shared);
// final answer in shared["answer"]
```
