---
layout: default
title: "LLM Wrapper"
parent: "Utility Function"
nav_order: 1
---

# LLM Wrappers

For a unified interface to multiple LLM providers, check out these popular TypeScript libraries:

- [LangChain.js](https://github.com/langchain-ai/langchainjs) - A comprehensive framework for building LLM applications with 13.8k+ GitHub stars
- [ModelFusion](https://github.com/vercel/modelfusion) - A TypeScript library for building AI applications with 1.2k+ GitHub stars, now part of Vercel
- [Firebase Genkit](https://firebase.google.com/docs/genkit) - An official Google/Firebase toolkit for integrating AI models with unified APIs

Here, we provide some minimal example implementations for direct API integration:

1. OpenAI

   ```typescript
   import { OpenAI } from "openai";

   async function callLlm(prompt: string): Promise<string> {
     const client = new OpenAI({
       apiKey: process.env.OPENAI_API_KEY,
     });
     const completion = await client.chat.completions.create({
       model: "gpt-4o",
       messages: [{ role: "user", content: prompt }],
     });
     return completion.choices[0].message.content || "";
   }

   // Example usage
   await callLlm("How are you?");
   ```

   > Store the API key in an environment variable like OPENAI_API_KEY for security.
   > {: .best-practice }

2. Claude (Anthropic)

   ```typescript
   import Anthropic from "@anthropic-ai/sdk";

   async function callLlm(prompt: string): Promise<string> {
     const client = new Anthropic({
       apiKey: process.env.ANTHROPIC_API_KEY,
     });
     const response = await client.messages.create({
       model: "claude-3-5-sonnet-20240620",
       max_tokens: 3000,
       messages: [{ role: "user", content: prompt }],
     });
     return response.content[0].text;
   }
   ```

3. Google (Generative AI)

   ```typescript
   import { GoogleGenerativeAI } from "@google/generative-ai";

   async function callLlm(prompt: string): Promise<string> {
     const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
     const model = genAI.getGenerativeModel({
       model: "gemini-1.5-flash",
     });
     const result = await model.generateContent(prompt);
     return result.response.text();
   }
   ```

4. Azure (Azure OpenAI)

   ```typescript
   import { AzureOpenAI } from "openai";

   async function callLlm(prompt: string): Promise<string> {
     const client = new AzureOpenAI({
       apiKey: process.env.AZURE_OPENAI_API_KEY,
       endpoint: "https://<YOUR_RESOURCE_NAME>.openai.azure.com",
       apiVersion: "2024-02-01",
     });
     const completion = await client.chat.completions.create({
       model: "<YOUR_DEPLOYMENT_NAME>",
       messages: [{ role: "user", content: prompt }],
     });
     return completion.choices[0].message.content || "";
   }
   ```

5. Ollama (Local LLM)

   ```typescript
   import { Ollama } from "ollama";

   async function callLlm(prompt: string): Promise<string> {
     const ollama = new Ollama();
     const response = await ollama.chat({
       model: "llama3.1",
       messages: [{ role: "user", content: prompt }],
     });
     return response.message.content;
   }
   ```

## Integration with PocketFlow

You can integrate these LLM functions with the PocketFlow Node class:

```typescript
import { Node } from "pocketflow";
import { OpenAI } from "openai";

// Define a properly typed interface for chat messages
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// LLM Node implementation that integrates with PocketFlow
class LlmNode<
  S = unknown,
  P extends Record<string, unknown> = Record<string, unknown>
> extends Node<S, P> {
  private client: OpenAI;
  private model: string;

  constructor(maxRetries: number = 3, waitSeconds: number = 2) {
    super(maxRetries, waitSeconds);
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = "gpt-4o";
  }

  async exec(prompt: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
    });
    return completion.choices[0].message.content || "";
  }

  async execFallback(prompt: string, error: Error): Promise<string> {
    console.error("LLM call failed:", error.message);
    return "I encountered an error processing your request.";
  }
}

// Example usage in a flow
const summarizeNode = new LlmNode(3, 2);
const translateNode = new LlmNode(2, 1);

// Create a simple flow
const flow = new Flow(summarizeNode);
summarizeNode.next(translateNode);

// Set custom prompts via params
summarizeNode.setParams({ prompt: "Summarize the following text: {{text}}" });
translateNode.setParams({ prompt: "Translate to French: {{text}}" });
```

## Improvements

Here are some ways to enhance your LLM integration:

- Chat history handling with properly typed messages:

```typescript
import { OpenAI } from "openai";
import { Node } from "pocketflow";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

class ChatNode extends Node {
  private client: OpenAI;
  private model: string;

  constructor(maxRetries: number = 2, waitSeconds: number = 1) {
    super(maxRetries, waitSeconds);
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = "gpt-4o";
  }

  async exec(messages: ChatMessage[]): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages,
    });
    return completion.choices[0].message.content || "";
  }
}
```

- Add in-memory caching that works with retries:

```typescript
import NodeCache from "node-cache";
import { Node } from "pocketflow";
import { OpenAI } from "openai";

// Create a cache instance
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL

class CachedLlmNode extends Node {
  private client: OpenAI;
  private model: string;

  constructor(maxRetries: number = 2, waitSeconds: number = 1) {
    super(maxRetries, waitSeconds);
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = "gpt-4o";
  }

  async exec(prompt: string): Promise<string> {
    // Only use cache on first attempt (not on retries)
    if (this.currentRetry === 0) {
      const cachedResult = cache.get<string>(prompt);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
    });

    const result = completion.choices[0].message.content || "";

    // Only cache successful results
    if (result) {
      cache.set(prompt, result);
    }

    return result;
  }
}
```

- Enable logging for monitoring:

```typescript
import { Node } from "pocketflow";
import { OpenAI } from "openai";

class LoggingLlmNode extends Node {
  private client: OpenAI;
  private model: string;

  constructor(maxRetries: number = 2, waitSeconds: number = 1) {
    super(maxRetries, waitSeconds);
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = "gpt-4o";
  }

  async exec(prompt: string): Promise<string> {
    console.info(
      `LLM Request (attempt ${this.currentRetry + 1}/${
        this.maxRetries
      }): ${prompt.substring(0, 50)}...`
    );

    const startTime = Date.now();
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
    });
    const duration = Date.now() - startTime;

    const result = completion.choices[0].message.content || "";
    console.info(`LLM Response (${duration}ms): ${result.substring(0, 50)}...`);

    return result;
  }
}
```
