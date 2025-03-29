---
layout: default
title: "LLM Wrapper"
parent: "Utility Function"
nav_order: 1
---

# LLM Wrappers

Check out popular libraries like [LangChain](https://github.com/langchain-ai/langchainjs) (13.8k+ GitHub stars), [ModelFusion](https://github.com/vercel/modelfusion) (1.2k+ GitHub stars), or [Firebase GenKit](https://firebase.google.com/docs/genkit) for unified LLM interfaces.
Here, we provide some minimal example implementations:

1. OpenAI

   ```typescript
   import { OpenAI } from "openai";

   async function callLlm(prompt: string): Promise<string> {
     const client = new OpenAI({ apiKey: "YOUR_API_KEY_HERE" });
     const r = await client.chat.completions.create({
       model: "gpt-4o",
       messages: [{ role: "user", content: prompt }],
     });
     return r.choices[0].message.content || "";
   }

   // Example usage
   callLlm("How are you?").then(console.log);
   ```

   > Store the API key in an environment variable like OPENAI_API_KEY for security.
   > {: .best-practice }

2. Claude (Anthropic)

   ```typescript
   import Anthropic from "@anthropic-ai/sdk";

   async function callLlm(prompt: string): Promise<string> {
     const client = new Anthropic({
       apiKey: "YOUR_API_KEY_HERE",
     });
     const response = await client.messages.create({
       model: "claude-3-7-sonnet-20250219",
       max_tokens: 3000,
       messages: [{ role: "user", content: prompt }],
     });
     return response.content[0].text;
   }
   ```

3. Google (Vertex AI)

   ```typescript
   import { VertexAI } from "@google-cloud/vertexai";

   async function callLlm(prompt: string): Promise<string> {
     const vertexAI = new VertexAI({
       project: "YOUR_PROJECT_ID",
       location: "us-central1",
     });

     const generativeModel = vertexAI.getGenerativeModel({
       model: "gemini-1.5-flash",
     });

     const response = await generativeModel.generateContent({
       contents: [{ role: "user", parts: [{ text: prompt }] }],
     });

     return response.response.candidates[0].content.parts[0].text;
   }
   ```

4. Azure (Azure OpenAI)

   ```typescript
   import { AzureOpenAI } from "openai";

   async function callLlm(prompt: string): Promise<string> {
     const client = new AzureOpenAI({
       apiKey: "YOUR_API_KEY_HERE",
       azure: {
         apiVersion: "2023-05-15",
         endpoint: "https://<YOUR_RESOURCE_NAME>.openai.azure.com/",
       },
     });

     const r = await client.chat.completions.create({
       model: "<YOUR_DEPLOYMENT_NAME>",
       messages: [{ role: "user", content: prompt }],
     });

     return r.choices[0].message.content || "";
   }
   ```

5. Ollama (Local LLM)

   ```typescript
   import ollama from "ollama";

   async function callLlm(prompt: string): Promise<string> {
     const response = await ollama.chat({
       model: "llama2",
       messages: [{ role: "user", content: prompt }],
     });
     return response.message.content;
   }
   ```

## Improvements

Feel free to enhance your `callLlm` function as needed. Here are examples:

- Handle chat history:

```typescript
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

async function callLlm(messages: Message[]): Promise<string> {
  const client = new OpenAI({ apiKey: "YOUR_API_KEY_HERE" });
  const r = await client.chat.completions.create({
    model: "gpt-4o",
    messages: messages,
  });
  return r.choices[0].message.content || "";
}
```

- Add in-memory caching

```typescript
import { memoize } from "lodash";

const callLlmMemoized = memoize(async (prompt: string): Promise<string> => {
  // Your implementation here
  return "";
});

async function callLlm(prompt: string, useCache = true): Promise<string> {
  if (useCache) {
    return callLlmMemoized(prompt);
  }
  // Call the underlying function directly
  return callLlmInternal(prompt);
}

class SummarizeNode {
  private curRetry = 0;

  async exec(text: string): Promise<string> {
    return callLlm(`Summarize: ${text}`, this.curRetry === 0);
  }
}
```

- Enable logging:

```typescript
async function callLlm(prompt: string): Promise<string> {
  console.info(`Prompt: ${prompt}`);
  // Your implementation here
  const response = ""; // Response from your implementation
  console.info(`Response: ${response}`);
  return response;
}
```
