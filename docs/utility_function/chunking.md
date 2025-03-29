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

### 1. Naive (Fixed-Size) Chunking

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

However, sentences are often cut awkwardly, losing coherence.

### 2. Sentence-Based Chunking

Using the popular [compromise](https://github.com/spencermountain/compromise) library (11.6k+ GitHub stars).

```typescript
import nlp from "compromise";

function sentenceBasedChunk(text: string, maxSentences: number = 2): string[] {
  // Parse the text into sentences
  const doc = nlp(text);
  const sentences = doc.sentences().out("array");

  // Group sentences into chunks
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += maxSentences) {
    chunks.push(sentences.slice(i, i + maxSentences).join(" "));
  }

  return chunks;
}
```

However, might not handle very long sentences or paragraphs well.

### 3. Other Chunking

- **Paragraph-Based**: Split text by paragraphs (e.g., newlines). Large paragraphs can create big chunks.

```typescript
function paragraphBasedChunk(text: string): string[] {
  // Split by double newlines (paragraphs)
  return text
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim().length > 0);
}
```

- **Semantic**: Use embeddings or topic modeling to chunk by semantic boundaries.
- **Agentic**: Use an LLM to decide chunk boundaries based on context or meaning.
