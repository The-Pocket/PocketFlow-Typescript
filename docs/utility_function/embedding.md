---
layout: default
title: "Embedding"
parent: "Utility Function"
nav_order: 5
---

# Embedding

Below you will find an overview table of various text embedding APIs, along with example TypeScript code.

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

### 1. OpenAI

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "YOUR_API_KEY",
});

async function getEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  // Extract the embedding vector from the response
  const embedding = response.data[0].embedding;
  console.log(embedding);
  return embedding;
}

// Usage
getEmbedding("Hello world");
```

### 2. Azure OpenAI

```typescript
import { AzureOpenAI } from "openai";
import {
  getBearerTokenProvider,
  DefaultAzureCredential,
} from "@azure/identity";

// Using Azure credentials (recommended)
const credential = new DefaultAzureCredential();
const scope = "https://cognitiveservices.azure.com/.default";
const azureADTokenProvider = getBearerTokenProvider(credential, scope);

// Or using API key directly
const client = new AzureOpenAI({
  apiKey: "YOUR_AZURE_API_KEY",
  endpoint: "https://YOUR_RESOURCE_NAME.openai.azure.com",
  apiVersion: "2023-05-15", // Update to the latest version
});

async function getEmbedding(text: string) {
  const response = await client.embeddings.create({
    model: "text-embedding-ada-002", // Or your deployment name
    input: text,
  });

  const embedding = response.data[0].embedding;
  console.log(embedding);
  return embedding;
}

// Usage
getEmbedding("Hello world");
```

### 3. Google Vertex AI

```typescript
import { VertexAI } from "@google-cloud/vertexai";

// Initialize Vertex with your Google Cloud project and location
const vertex = new VertexAI({
  project: "YOUR_GCP_PROJECT_ID",
  location: "us-central1",
});

// Access embeddings model
const model = vertex.preview.getTextEmbeddingModel("textembedding-gecko@001");

async function getEmbedding(text: string) {
  const response = await model.getEmbeddings({
    texts: [text],
  });

  const embedding = response.embeddings[0].values;
  console.log(embedding);
  return embedding;
}

// Usage
getEmbedding("Hello world");
```

### 4. AWS Bedrock

```typescript
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: "us-east-1", // Use your AWS region
});

async function getEmbedding(text: string) {
  const modelId = "amazon.titan-embed-text-v2:0";
  const input = {
    inputText: text,
    dimensions: 1536, // Optional: specify embedding dimensions
    normalize: true, // Optional: normalize embeddings
  };

  const command = new InvokeModelCommand({
    modelId: modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(input),
  });

  const response = await client.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const embedding = responseBody.embedding;

  console.log(embedding);
  return embedding;
}

// Usage
getEmbedding("Hello world");
```

### 5. Cohere

```typescript
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  token: "YOUR_API_KEY",
});

async function getEmbedding(text: string) {
  const response = await cohere.embed({
    texts: [text],
    model: "embed-english-v3.0", // Use the latest model
    inputType: "search_query",
  });

  const embedding = response.embeddings[0];
  console.log(embedding);
  return embedding;
}

// Usage
getEmbedding("Hello world");
```

### 6. Hugging Face

```typescript
import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient({
  apiToken: "YOUR_HF_TOKEN",
});

async function getEmbedding(text: string) {
  const model = "sentence-transformers/all-MiniLM-L6-v2";

  const response = await hf.featureExtraction({
    model: model,
    inputs: text,
  });

  console.log(response);
  return response;
}

// Usage
getEmbedding("Hello world");
```

### 7. Jina

```typescript
import axios from "axios";

async function getEmbedding(text: string) {
  const url = "https://api.jina.ai/v1/embeddings";
  const headers = {
    Authorization: `Bearer YOUR_JINA_TOKEN`,
    "Content-Type": "application/json",
  };

  const payload = {
    model: "jina-embeddings-v3",
    input: [text],
    normalized: true,
  };

  const response = await axios.post(url, payload, { headers });
  const embedding = response.data.data[0].embedding;

  console.log(embedding);
  return embedding;
}

// Usage
getEmbedding("Hello world");
```
