---
layout: default
title: "Embedding"
parent: "Utility Function"
nav_order: 5
---

# Embedding

Below you will find an overview table of various text embedding APIs, along with example TypeScript code that aligns with PocketFlow design patterns.

> Embedding is more a micro optimization, compared to the Flow Design.
>
> It's recommended to start with the most convenient one and optimize later.
> {: .best-practice }

| **API**              | **Free Tier**                           | **Pricing Model**                   | **Docs**                                                                                                                  |
| -------------------- | --------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **OpenAI**           | ~$5 credit                              | ~$0.0001/1K tokens                  | [OpenAI Embeddings](https://platform.openai.com/docs/api-reference/embeddings)                                            |
| **Azure OpenAI**     | $200 credit                             | Same as OpenAI (~$0.0001/1K tokens) | [Azure OpenAI Embeddings](https://learn.microsoft.com/azure/cognitive-services/openai/how-to/create-resource?tabs=portal) |
| **Google Vertex AI** | $300 credit                             | ~$0.025 / million chars             | [Vertex AI Embeddings](https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings)              |
| **AWS Bedrock**      | No free tier, but AWS credits may apply | ~$0.00002/1K tokens (Titan V2)      | [Amazon Bedrock](https://docs.aws.amazon.com/bedrock/)                                                                    |
| **Cohere**           | Limited free tier                       | ~$0.0001/1K tokens                  | [Cohere Embeddings](https://docs.cohere.com/docs/cohere-embed)                                                            |
| **Hugging Face**     | ~$0.10 free compute monthly             | Pay per second of compute           | [HF Inference API](https://huggingface.co/docs/api-inference)                                                             |
| **Jina**             | 1M tokens free                          | Pay per token after                 | [Jina Embeddings](https://jina.ai/embeddings/)                                                                            |

## Example TypeScript Code

Here are examples of how to use embedding APIs with TypeScript in PocketFlow. You can create utility functions for embedding and then use them with PocketFlow nodes.

### 1. OpenAI

```typescript
import OpenAI from "openai";

// Utility function
async function getOpenAIEmbedding(text: string): Promise<number[]> {
  const client = new OpenAI({ apiKey: "YOUR_API_KEY" });
  const response = await client.embeddings.create({
    model: "text-embedding-3-small", // Updated to use the v3 model
    input: text,
  });

  return response.data[0].embedding;
}

// Example Node implementation
class EmbedDocument extends Node<YourSharedStorageType> {
  async prep(shared: YourSharedStorageType): Promise<string> {
    return shared.document || "";
  }

  async exec(document: string): Promise<number[]> {
    return await getOpenAIEmbedding(document);
  }

  async post(
    shared: YourSharedStorageType,
    prepRes: string,
    embedding: number[]
  ): Promise<string | undefined> {
    shared.embedding = embedding;
    return undefined;
  }
}
```

### 2. Azure OpenAI

```typescript
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

// Utility function
async function getAzureEmbedding(text: string): Promise<number[]> {
  const client = new OpenAIClient(
    "https://YOUR_RESOURCE_NAME.openai.azure.com",
    new AzureKeyCredential("YOUR_AZURE_API_KEY")
  );

  const result = await client.getEmbeddings("YOUR_DEPLOYMENT_NAME", [text]);
  return result.data[0].embedding;
}

// Example Node implementation
class EmbedWithAzure extends Node<YourSharedStorageType> {
  async prep(shared: YourSharedStorageType): Promise<string> {
    return shared.text || "";
  }

  async exec(text: string): Promise<number[]> {
    return await getAzureEmbedding(text);
  }

  async post(
    shared: YourSharedStorageType,
    prepRes: string,
    embedding: number[]
  ): Promise<string | undefined> {
    shared.embedding = embedding;
    return undefined;
  }
}
```

### 3. Google Vertex AI

```typescript
import { VertexAI } from "@google-cloud/vertexai";

// Utility function
async function getVertexAIEmbedding(text: string): Promise<number[]> {
  const vertexAI = new VertexAI({
    project: "YOUR_GCP_PROJECT_ID",
    location: "us-central1",
  });

  const embedModel = vertexAI.preview.getTextEmbeddingModel(
    "textembedding-gecko@001"
  );
  const result = await embedModel.getEmbeddings([text]);
  return result.embeddings[0].values;
}

// Example BatchNode implementation for multiple texts
class BatchEmbedWithVertexAI extends BatchNode<YourSharedStorageType> {
  async prep(shared: YourSharedStorageType): Promise<string[]> {
    return shared.textChunks || [];
  }

  async exec(chunk: string): Promise<number[]> {
    return await getVertexAIEmbedding(chunk);
  }

  async post(
    shared: YourSharedStorageType,
    prepRes: string[],
    embeddings: number[][]
  ): Promise<string | undefined> {
    shared.embeddings = embeddings;
    return undefined;
  }
}
```

### 4. AWS Bedrock

```typescript
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Utility function
async function getBedrockEmbedding(text: string): Promise<number[]> {
  const client = new BedrockRuntimeClient({ region: "us-east-1" });

  const command = new InvokeModelCommand({
    modelId: "amazon.titan-embed-text-v2:0",
    contentType: "application/json",
    body: JSON.stringify({ inputText: text }),
  });

  const response = await client.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  return responseBody.embedding;
}

// Example implementation in a Node
class EmbedWithBedrock extends Node<YourSharedStorageType> {
  async prep(shared: YourSharedStorageType): Promise<string> {
    return shared.text || "";
  }

  async exec(text: string): Promise<number[]> {
    return await getBedrockEmbedding(text);
  }

  async post(
    shared: YourSharedStorageType,
    prepRes: string,
    embedding: number[]
  ): Promise<string | undefined> {
    shared.embedding = embedding;
    return undefined;
  }
}
```

### 5. Cohere

```typescript
import { CohereClient } from "cohere-ai";

// Utility function
async function getCohereEmbedding(text: string): Promise<number[]> {
  const cohere = new CohereClient({
    token: "YOUR_API_KEY",
  });

  const response = await cohere.embed({
    texts: [text],
    model: "embed-english-v3.0",
  });

  return response.embeddings[0];
}

// Example Node implementation
class EmbedWithCohere extends Node<YourSharedStorageType> {
  async prep(shared: YourSharedStorageType): Promise<string> {
    return shared.text || "";
  }

  async exec(text: string): Promise<number[]> {
    return await getCohereEmbedding(text);
  }

  async post(
    shared: YourSharedStorageType,
    prepRes: string,
    embedding: number[]
  ): Promise<string | undefined> {
    shared.embedding = embedding;
    return undefined;
  }
}
```

### 6. Hugging Face

```typescript
import { InferenceClient } from "@huggingface/inference";

// Utility function
async function getHuggingFaceEmbedding(text: string): Promise<number[]> {
  const hf = new InferenceClient("YOUR_HF_TOKEN");

  const response = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });

  return response;
}

// Example Node implementation
class EmbedWithHuggingFace extends Node<YourSharedStorageType> {
  async prep(shared: YourSharedStorageType): Promise<string> {
    return shared.text || "";
  }

  async exec(text: string): Promise<number[]> {
    return await getHuggingFaceEmbedding(text);
  }

  async post(
    shared: YourSharedStorageType,
    prepRes: string,
    embedding: number[]
  ): Promise<string | undefined> {
    shared.embedding = embedding;
    return undefined;
  }
}
```

### 7. Jina

```typescript
import axios from "axios";

// Utility function
async function getJinaEmbedding(text: string): Promise<number[]> {
  const response = await axios.post(
    "https://api.jina.ai/v1/embeddings",
    {
      input: [text],
      model: "jina-embeddings-v2-base-en",
      normalized: true,
    },
    {
      headers: {
        Authorization: "Bearer YOUR_JINA_TOKEN",
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.data[0].embedding;
}

// Example Node implementation
class EmbedWithJina extends Node<YourSharedStorageType> {
  async prep(shared: YourSharedStorageType): Promise<string> {
    return shared.text || "";
  }

  async exec(text: string): Promise<number[]> {
    return await getJinaEmbedding(text);
  }

  async post(
    shared: YourSharedStorageType,
    prepRes: string,
    embedding: number[]
  ): Promise<string | undefined> {
    shared.embedding = embedding;
    return undefined;
  }
}
```

## PocketFlow RAG Implementation Example

Here's a complete example of using embeddings in a Retrieval-Augmented Generation (RAG) pattern with PocketFlow:

```typescript
import { Node, BatchNode, Flow } from "pocketflow";

// Define shared storage type for RAG pattern
type RAGSharedStorage = {
  documents?: string[];
  chunks?: string[];
  embeddings?: number[][];
  index?: any;
  question?: string;
  questionEmbedding?: number[];
  retrievedChunk?: string;
  answer?: string;
};

// Utility functions
async function getEmbedding(text: string): Promise<number[]> {
  // Replace with your preferred embedding API
  // This is just a placeholder
  return Array.from(text.substring(0, 5)).map((char) => char.charCodeAt(0));
}

async function createIndex(
  embeddings: number[][]
): Promise<{ embeddings: number[][] }> {
  // In a real implementation, use a vector database
  return { embeddings };
}

async function searchIndex(
  index: { embeddings: number[][] },
  queryEmbedding: number[],
  options: { topK: number }
): Promise<[number[][], number[][]]> {
  // Simple similarity search
  const similarities = index.embeddings.map((emb, idx) => {
    const similarity = emb.reduce(
      (sum, val, i) => sum + val * (queryEmbedding[i] || 0),
      0
    );
    return [idx, similarity];
  });

  similarities.sort((a, b) => b[1] - a[1]);

  const topK = Math.min(options.topK, similarities.length);
  const indices = [similarities.slice(0, topK).map((s) => s[0])];
  const distances = [similarities.slice(0, topK).map((s) => s[1])];

  return [indices, distances];
}

// Indexing Pipeline Nodes
class ChunkDocuments extends Node<RAGSharedStorage> {
  async prep(shared: RAGSharedStorage): Promise<string[]> {
    return shared.documents || [];
  }

  async exec(documents: string[]): Promise<string[]> {
    // Simple chunking by splitting on paragraphs
    const chunks: string[] = [];
    for (const doc of documents) {
      const paragraphs = doc.split("\n\n");
      chunks.push(...paragraphs);
    }
    return chunks;
  }

  async post(
    shared: RAGSharedStorage,
    prepRes: string[],
    chunks: string[]
  ): Promise<string | undefined> {
    shared.chunks = chunks;
    return undefined;
  }
}

class EmbedDocuments extends BatchNode<RAGSharedStorage> {
  async prep(shared: RAGSharedStorage): Promise<string[]> {
    return shared.chunks || [];
  }

  async exec(chunk: string): Promise<number[]> {
    return await getEmbedding(chunk);
  }

  async post(
    shared: RAGSharedStorage,
    prepRes: string[],
    embeddings: number[][]
  ): Promise<string | undefined> {
    shared.embeddings = embeddings;
    return undefined;
  }
}

class CreateIndex extends Node<RAGSharedStorage> {
  async prep(shared: RAGSharedStorage): Promise<number[][]> {
    return shared.embeddings || [];
  }

  async exec(embeddings: number[][]): Promise<unknown> {
    return await createIndex(embeddings);
  }

  async post(
    shared: RAGSharedStorage,
    prepRes: number[][],
    index: unknown
  ): Promise<string | undefined> {
    shared.index = index;
    return undefined;
  }
}

// Query Pipeline Nodes
class EmbedQuery extends Node<RAGSharedStorage> {
  async prep(shared: RAGSharedStorage): Promise<string> {
    return shared.question || "";
  }

  async exec(question: string): Promise<number[]> {
    return await getEmbedding(question);
  }

  async post(
    shared: RAGSharedStorage,
    prepRes: string,
    embedding: number[]
  ): Promise<string | undefined> {
    shared.questionEmbedding = embedding;
    return undefined;
  }
}

// Usage example:
// const indexingFlow = new Flow(new ChunkDocuments().next(new EmbedDocuments()).next(new CreateIndex()));
// const queryFlow = new Flow(new EmbedQuery());
//
// const shared: RAGSharedStorage = {
//   documents: ["Your document text here"]
// };
//
// await indexingFlow.run(shared);
// shared.question = "Your question here?";
// await queryFlow.run(shared);
```
