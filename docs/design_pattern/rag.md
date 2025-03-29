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
type SharedStore = {
  files?: string[];
  allChunks?: string[];
  allEmbeds?: number[][];
  index?: any;
};

class ChunkDocs extends BatchNode<SharedStore> {
  async prep(shared: SharedStore): Promise<string[]> {
    return shared.files || [];
  }

  async exec(filepath: string): Promise<string[]> {
    const text = fs.readFileSync(filepath, "utf-8");
    // Simplified chunking for example
    const chunks: string[] = [];
    const size = 100;
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.substring(i, i + size));
    }
    return chunks;
  }

  async post(
    shared: SharedStore,
    _: string[],
    chunks: string[][]
  ): Promise<undefined> {
    shared.allChunks = chunks.flat();
    return undefined;
  }
}

class EmbedDocs extends BatchNode<SharedStore> {
  async prep(shared: SharedStore): Promise<string[]> {
    return shared.allChunks || [];
  }

  async exec(chunk: string): Promise<number[]> {
    return await getEmbedding(chunk);
  }

  async post(
    shared: SharedStore,
    _: string[],
    embeddings: number[][]
  ): Promise<undefined> {
    shared.allEmbeds = embeddings;
    return undefined;
  }
}

class StoreIndex extends Node<SharedStore> {
  async prep(shared: SharedStore): Promise<number[][]> {
    return shared.allEmbeds || [];
  }

  async exec(allEmbeds: number[][]): Promise<unknown> {
    return await createIndex(allEmbeds);
  }

  async post(
    shared: SharedStore,
    _: number[][],
    index: unknown
  ): Promise<undefined> {
    shared.index = index;
    return undefined;
  }
}

// Create indexing flow
const chunkNode = new ChunkDocs();
const embedNode = new EmbedDocs();
const storeNode = new StoreIndex();

chunkNode.next(embedNode).next(storeNode);
const offlineFlow = new Flow(chunkNode);
```

---

## Stage 2: Online Query & Answer

We have 3 nodes:

1. `EmbedQuery` – embeds the user's question.
2. `RetrieveDocs` – retrieves top chunk from the index.
3. `GenerateAnswer` – calls the LLM with the question + chunk to produce the final answer.

```typescript
type OnlineStore = SharedStore & {
  question?: string;
  qEmb?: number[];
  retrievedChunk?: string;
  answer?: string;
};

class EmbedQuery extends Node<OnlineStore> {
  async prep(shared: OnlineStore): Promise<string> {
    return shared.question || "";
  }

  async exec(question: string): Promise<number[]> {
    return await getEmbedding(question);
  }

  async post(
    shared: OnlineStore,
    _: string,
    qEmb: number[]
  ): Promise<undefined> {
    shared.qEmb = qEmb;
    return undefined;
  }
}

class RetrieveDocs extends Node<OnlineStore> {
  async prep(shared: OnlineStore): Promise<[number[], any, string[]]> {
    return [shared.qEmb || [], shared.index, shared.allChunks || []];
  }

  async exec([qEmb, index, chunks]: [
    number[],
    any,
    string[]
  ]): Promise<string> {
    const [ids] = await searchIndex(index, qEmb, { topK: 1 });
    return chunks[ids[0][0]];
  }

  async post(
    shared: OnlineStore,
    _: [number[], any, string[]],
    chunk: string
  ): Promise<undefined> {
    shared.retrievedChunk = chunk;
    return undefined;
  }
}

class GenerateAnswer extends Node<OnlineStore> {
  async prep(shared: OnlineStore): Promise<[string, string]> {
    return [shared.question || "", shared.retrievedChunk || ""];
  }

  async exec([question, chunk]: [string, string]): Promise<string> {
    return await callLlm(`Question: ${question}\nContext: ${chunk}\nAnswer:`);
  }

  async post(
    shared: OnlineStore,
    _: [string, string],
    answer: string
  ): Promise<undefined> {
    shared.answer = answer;
    return undefined;
  }
}

// Create query flow
const embedQNode = new EmbedQuery();
const retrieveNode = new RetrieveDocs();
const generateNode = new GenerateAnswer();

embedQNode.next(retrieveNode).next(generateNode);
const onlineFlow = new Flow(embedQNode);
```

Usage example:

```typescript
const shared = {
  files: ["doc1.txt", "doc2.txt"], // any text files
};
await offlineFlow.run(shared);
```
