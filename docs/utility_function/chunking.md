---
layout: default
title: "Text Chunking"
parent: "Utility Function"
nav_order: 4
---

# Text Chunking

We recommend some implementations of commonly used text chunking approaches.

> Text Chunking is more a micro optimization, compared to the Flow Design.
>
> It's recommended to start with the Naive Chunking and optimize later.
> {: .best-practice }

---

## Example TypeScript Code Samples

### 1. Naive (Fixed-Size) Character Chunking

Splits text by a fixed number of characters, ignoring sentence or semantic boundaries.

```typescript
function fixedSizeChunk(text: string, chunkSize: number = 100): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}
```

This approach is used in multiple examples in our codebase, but sentences are often cut awkwardly, losing coherence.

### 2. Sentence-Based Chunking

```typescript
function sentenceBasedChunk(text: string, maxSentences: number = 2): string[] {
  // Simple sentence splitting by common punctuation
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < sentences.length; i += maxSentences) {
    chunks.push(sentences.slice(i, i + maxSentences).join(" "));
  }

  return chunks;
}
```

For more advanced sentence splitting, consider using natural language processing libraries like `natural` for Node.js.

### 3. Implementation with PocketFlow BatchNode

Text chunking can be implemented elegantly using the `BatchNode` pattern:

```typescript
class ChunkText extends BatchNode<SharedStorage> {
  private chunkSize: number;

  constructor(chunkSize: number = 100) {
    super();
    this.chunkSize = chunkSize;
  }

  async prep(shared: SharedStorage): Promise<string[]> {
    // Get text to process from shared storage
    const text = shared.textToProcess || "";

    // Create chunks
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += this.chunkSize) {
      chunks.push(text.substring(i, i + this.chunkSize));
    }

    // Store chunks in shared storage (optional)
    shared.chunks = chunks;

    return chunks;
  }

  async exec(chunk: string): Promise<string> {
    // Process each chunk - this could be any transformation
    return chunk;
  }

  async post(
    shared: SharedStorage,
    prepRes: string[],
    execRes: string[]
  ): Promise<string | undefined> {
    // Store processed chunks
    shared.processedChunks = execRes;
    return undefined;
  }
}
```

### 4. Other Chunking Approaches

- **Paragraph-Based**: Split text by paragraphs (e.g., newlines). Large paragraphs can create big chunks.

  ```typescript
  function paragraphChunk(text: string): string[] {
    return text.split(/\n\s*\n/);
  }
  ```

- **Semantic**: Use embeddings or topic modeling to chunk by semantic boundaries.
- **Agentic**: Use an LLM to decide chunk boundaries based on context or meaning.
