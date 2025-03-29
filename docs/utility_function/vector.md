---
layout: default
title: "Vector Databases"
parent: "Utility Function"
nav_order: 6
---

# Vector Databases

Below is a table of the popular vector search solutions:

| **Tool**     | **Free Tier**  | **Pricing Model**        | **Docs**                               |
| ------------ | -------------- | ------------------------ | -------------------------------------- |
| **FAISS**    | N/A, self-host | Open-source              | [Faiss.ai](https://faiss.ai)           |
| **Pinecone** | 2GB free       | From $25/mo              | [pinecone.io](https://pinecone.io)     |
| **Qdrant**   | 1GB free cloud | Pay-as-you-go            | [qdrant.tech](https://qdrant.tech)     |
| **Weaviate** | 14-day sandbox | From $25/mo              | [weaviate.io](https://weaviate.io)     |
| **Milvus**   | 5GB free cloud | PAYG or $99/mo dedicated | [milvus.io](https://milvus.io)         |
| **Chroma**   | N/A, self-host | Free (Apache 2.0)        | [trychroma.com](https://trychroma.com) |
| **Redis**    | 30MB free      | From $5/mo               | [redis.io](https://redis.io)           |

---

## Example TypeScript Code

Below are basic usage snippets for each tool.

### FAISS

```typescript
import { IndexFlatL2 } from "faiss-node";

// Dimensionality of embeddings
const dimension = 128;

// Create a flat L2 index
const index = new IndexFlatL2(dimension);

// Create random vectors (using standard JS arrays)
const data: number[] = [];
for (let i = 0; i < 1000; i++) {
  for (let j = 0; j < dimension; j++) {
    data.push(Math.random());
  }
}

// Add vectors to the index
for (let i = 0; i < 1000; i++) {
  const vector = data.slice(i * dimension, (i + 1) * dimension);
  index.add(vector);
}

// Query
const query = Array(dimension)
  .fill(0)
  .map(() => Math.random());
const results = index.search(query, 5);

console.log("Distances:", results.distances);
console.log("Neighbors:", results.labels);
```

### Pinecone

```typescript
import { PineconeClient } from "@pinecone-database/pinecone";

// Define interface for your metadata (optional)
interface Metadata {
  type: string;
}

const init = async () => {
  // Initialize the client
  const pinecone = new PineconeClient();
  await pinecone.init({
    apiKey: "YOUR_API_KEY",
    environment: "YOUR_ENVIRONMENT",
  });

  const indexName = "my-index";

  // List indexes to check if it exists
  const indexes = await pinecone.listIndexes();

  // Create index if it doesn't exist
  if (!indexes.includes(indexName)) {
    await pinecone.createIndex({
      name: indexName,
      dimension: 128,
      metric: "cosine",
    });
  }

  // Connect to the index
  const index = pinecone.Index(indexName);

  // Upsert vectors
  await index.upsert({
    upsertRequest: {
      vectors: [
        {
          id: "id1",
          values: Array(128).fill(0.1),
          metadata: { type: "doc1" } as Metadata,
        },
        {
          id: "id2",
          values: Array(128).fill(0.2),
          metadata: { type: "doc2" } as Metadata,
        },
      ],
      namespace: "example-namespace",
    },
  });

  // Query
  const queryResult = await index.query({
    queryRequest: {
      vector: Array(128).fill(0.15),
      topK: 3,
      includeMetadata: true,
      namespace: "example-namespace",
    },
  });

  console.log(queryResult);
};

init();
```

### Qdrant

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const init = async () => {
  const client = new QdrantClient({
    url: "https://YOUR-QDRANT-CLOUD-ENDPOINT",
    apiKey: "YOUR_API_KEY",
  });

  const collectionName = "my_collection";

  // Create or recreate collection
  await client.recreateCollection(collectionName, {
    vectors: {
      size: 128,
      distance: "Cosine",
    },
  });

  // Insert points
  await client.upsert(collectionName, {
    wait: true,
    points: [
      {
        id: "1",
        vector: Array(128).fill(0.1),
        payload: { type: "doc1" },
      },
      {
        id: "2",
        vector: Array(128).fill(0.2),
        payload: { type: "doc2" },
      },
    ],
  });

  // Search
  const searchResult = await client.search(collectionName, {
    vector: Array(128).fill(0.15),
    limit: 2,
  });

  console.log(searchResult);
};

init();
```

### Weaviate

```typescript
import weaviate from "weaviate-client";

const init = async () => {
  // Connect to Weaviate
  const client = weaviate.client({
    scheme: "https",
    host: "YOUR-WEAVIATE-CLOUD-ENDPOINT",
  });

  // Create schema
  const schema = {
    classes: [
      {
        class: "Article",
        vectorizer: "none",
      },
    ],
  };

  await client.schema.create(schema);

  // Add data
  await client.data
    .creator()
    .withClassName("Article")
    .withProperties({
      title: "Hello World",
      content: "Weaviate vector search",
    })
    .withVector(Array(128).fill(0.1))
    .do();

  // Query
  const result = await client.graphql
    .get()
    .withClassName("Article")
    .withFields(["title", "content"])
    .withNearVector({
      vector: Array(128).fill(0.15),
    })
    .withLimit(3)
    .do();

  console.log(result);
};

init();
```

### Milvus

```typescript
import { MilvusClient, DataType } from "@zilliz/milvus2-sdk-node";

const init = async () => {
  // Connect to Milvus
  const client = new MilvusClient("localhost:19530");

  // Wait for connection to be established
  await client.connectPromise;

  const collectionName = "MyCollection";

  // Create collection
  await client.createCollection({
    collection_name: collectionName,
    fields: [
      {
        name: "id",
        data_type: DataType.Int64,
        is_primary_key: true,
        autoID: true,
      },
      {
        name: "embedding",
        data_type: DataType.FloatVector,
        dim: 128,
      },
    ],
  });

  // Create random vectors
  const vectors = [];
  for (let i = 0; i < 10; i++) {
    vectors.push(
      Array(128)
        .fill(0)
        .map(() => Math.random())
    );
  }

  // Insert data
  await client.insert({
    collection_name: collectionName,
    fields_data: vectors.map((vector) => ({
      embedding: vector,
    })),
  });

  // Create index
  await client.createIndex({
    collection_name: collectionName,
    field_name: "embedding",
    extra_params: {
      index_type: "IVF_FLAT",
      metric_type: "L2",
      params: JSON.stringify({ nlist: 128 }),
    },
  });

  // Load collection to memory
  await client.loadCollection({
    collection_name: collectionName,
  });

  // Search
  const searchResult = await client.search({
    collection_name: collectionName,
    vector: Array(128)
      .fill(0)
      .map(() => Math.random()),
    search_params: {
      anns_field: "embedding",
      topk: 3,
      metric_type: "L2",
      params: JSON.stringify({ nprobe: 10 }),
    },
  });

  console.log(searchResult);
};

init();
```

### Chroma

```typescript
import { ChromaClient, Collection } from "chromadb";

const init = async () => {
  const client = new ChromaClient({
    path: "http://localhost:8000", // Default path if using chroma server
  });

  // Create or get collection
  const collection: Collection = await client.createCollection({
    name: "my_collection",
    // Optional metadata
    metadata: { description: "My test collection" },
  });

  // Add vectors
  await collection.add({
    ids: ["id1", "id2"],
    embeddings: [
      [0.1, 0.2, 0.3],
      [0.2, 0.2, 0.2],
    ],
    metadatas: [{ doc: "text1" }, { doc: "text2" }],
  });

  // Query
  const result = await collection.query({
    queryEmbeddings: [[0.15, 0.25, 0.3]],
    nResults: 2,
  });

  console.log(result);
};

init();
```

### Redis

```typescript
import { createClient } from "redis";
import { SchemaFieldTypes, VectorAlgorithms } from "@redis/search";

const init = async () => {
  // Connect to Redis
  const client = createClient({
    url: "redis://localhost:6379",
  });

  await client.connect();

  const indexName = "my_idx";

  // Create index for vector search
  try {
    await client.ft.create(
      indexName,
      {
        embedding: {
          type: SchemaFieldTypes.VECTOR,
          ALGORITHM: VectorAlgorithms.FLAT,
          TYPE: "FLOAT32",
          DIM: 128,
          DISTANCE_METRIC: "L2",
        },
      },
      {
        ON: "HASH",
      }
    );
  } catch (e) {
    console.log("Index might exist already");
  }

  // Create a Float32Array for the vectors
  const createVector = (value: number): Buffer => {
    const vector = new Float32Array(128).fill(value);
    return Buffer.from(vector.buffer);
  };

  // Insert
  await client.hSet("doc1", {
    embedding: createVector(0.1),
  });

  // Search
  const searchResults = await client.ft.search(
    indexName,
    "*=>[KNN 3 @embedding $BLOB AS dist]",
    {
      PARAMS: {
        BLOB: createVector(0.15),
      },
      RETURN: ["dist"],
      DIALECT: 2,
    }
  );

  console.log(searchResults);

  await client.quit();
};

init();
```
