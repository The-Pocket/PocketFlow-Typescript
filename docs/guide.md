---
layout: default
title: "Agentic Coding"
---

# Agentic Coding: Humans Design, Agents code!

> If you are an AI agents involved in building LLM Systems, read this guide **VERY, VERY** carefully! This is the most important chapter in the entire document. Throughout development, you should always (1) start with a small and simple solution, (2) design at a high level (`docs/design.md`) before implementation, and (3) frequently ask humans for feedback and clarification.
> {: .warning }

## Agentic Coding Steps

Agentic Coding should be a collaboration between Human System Design and Agent Implementation:

| Steps             |   Human    |     AI     | Comment                                                                                        |
| :---------------- | :--------: | :--------: | :--------------------------------------------------------------------------------------------- |
| 1. Requirements   |  ★★★ High  |  ★☆☆ Low   | Humans understand the requirements and context.                                                |
| 2. Flow           | ★★☆ Medium | ★★☆ Medium | Humans specify the high-level design, and the AI fills in the details.                         |
| 3. Utilities      | ★★☆ Medium | ★★☆ Medium | Humans provide available external APIs and integrations, and the AI helps with implementation. |
| 4. Node           |  ★☆☆ Low   |  ★★★ High  | The AI helps design the node types and data handling based on the flow.                        |
| 5. Implementation |  ★☆☆ Low   |  ★★★ High  | The AI implements the flow based on the design.                                                |
| 6. Optimization   | ★★☆ Medium | ★★☆ Medium | Humans evaluate the results, and the AI helps optimize.                                        |
| 7. Reliability    |  ★☆☆ Low   |  ★★★ High  | The AI writes test cases and addresses corner cases.                                           |

1. **Requirements**: Clarify the requirements for your project, and evaluate whether an AI system is a good fit.

   - Understand AI systems' strengths and limitations:
     - **Good for**: Routine tasks requiring common sense (filling forms, replying to emails)
     - **Good for**: Creative tasks with well-defined inputs (building slides, writing SQL)
     - **Not good for**: Ambiguous problems requiring complex decision-making (business strategy, startup planning)
   - **Keep It User-Centric:** Explain the "problem" from the user's perspective rather than just listing features.
   - **Balance complexity vs. impact**: Aim to deliver the highest value features with minimal complexity early.

2. **Flow Design**: Outline at a high level, describe how your AI system orchestrates nodes.

   - Identify applicable design patterns (e.g., [Map Reduce](./design_pattern/mapreduce.md), [Agent](./design_pattern/agent.md), [RAG](./design_pattern/rag.md)).
     - For each node in the flow, start with a high-level one-line description of what it does.
     - If using **Map Reduce**, specify how to map (what to split) and how to reduce (how to combine).
     - If using **Agent**, specify what are the inputs (context) and what are the possible actions.
     - If using **RAG**, specify what to embed, noting that there's usually both offline (indexing) and online (retrieval) workflows.
   - Outline the flow and draw it in a mermaid diagram. For example:

     ```mermaid
     flowchart LR
         start[Start] --> batch[Batch]
         batch --> check[Check]
         check -->|OK| process
         check -->|Error| fix[Fix]
         fix --> check

         subgraph process[Process]
           step1[Step 1] --> step2[Step 2]
         end

         process --> endNode[End]
     ```

   - > **If Humans can't specify the flow, AI Agents can't automate it!** Before building an LLM system, thoroughly understand the problem and potential solution by manually solving example inputs to develop intuition.  
     > {: .best-practice }

3. **Utilities**: Based on the Flow Design, identify and implement necessary utility functions.

   - Think of your AI system as the brain. It needs a body—these _external utility functions_—to interact with the real world:
       <div align="center"><img src="https://github.com/the-pocket/.github/raw/main/assets/utility.png?raw=true" width="400"/></div>

     - Reading inputs (e.g., retrieving Slack messages, reading emails)
     - Writing outputs (e.g., generating reports, sending emails)
     - Using external tools (e.g., calling LLMs, searching the web)
     - **NOTE**: _LLM-based tasks_ (e.g., summarizing text, analyzing sentiment) are **NOT** utility functions; rather, they are _core functions_ internal in the AI system.

   - For each utility function, implement it and write a simple test.
   - Document their input/output, as well as why they are necessary. For example:
     - `name`: `getEmbedding` (`src/utils/getEmbedding.ts`)
     - `input`: `string`
     - `output`: a vector of 3072 numbers
     - `necessity`: Used by the second node to embed text
   - Example utility implementation:

     ```typescript
     // src/utils/callLlm.ts
     import { OpenAI } from "openai";

     export async function callLlm(prompt: string): Promise<string> {
       const client = new OpenAI({
         apiKey: process.env.OPENAI_API_KEY,
       });

       const response = await client.chat.completions.create({
         model: "gpt-4o",
         messages: [{ role: "user", content: prompt }],
       });

       return response.choices[0].message.content || "";
     }
     ```

   - > **Sometimes, design Utilies before Flow:** For example, for an LLM project to automate a legacy system, the bottleneck will likely be the available interface to that system. Start by designing the hardest utilities for interfacing, and then build the flow around them.
     > {: .best-practice }

4. **Node Design**: Plan how each node will read and write data, and use utility functions.

   - One core design principle for PocketFlow is to use a [shared store](./core_abstraction/communication.md), so start with a shared store design:

     - For simple systems, use an in-memory object.
     - For more complex systems or when persistence is required, use a database.
     - **Don't Repeat Yourself**: Use in-memory references or foreign keys.
     - Example shared store design:

       ```typescript
       interface SharedStore {
         user: {
           id: string;
           context: {
             weather: { temp: number; condition: string };
             location: string;
           };
         };
         results: Record<string, unknown>;
       }

       const shared: SharedStore = {
         user: {
           id: "user123",
           context: {
             weather: { temp: 72, condition: "sunny" },
             location: "San Francisco",
           },
         },
         results: {}, // Empty object to store outputs
       };
       ```

   - For each [Node](./core_abstraction/node.md), describe its type, how it reads and writes data, and which utility function it uses. Keep it specific but high-level without codes. For example:
     - `type`: Node (or BatchNode, or ParallelBatchNode)
     - `prep`: Read "text" from the shared store
     - `exec`: Call the embedding utility function
     - `post`: Write "embedding" to the shared store

5. **Implementation**: Implement the initial nodes and flows based on the design.

   - 🎉 If you've reached this step, humans have finished the design. Now _Agentic Coding_ begins!
   - **"Keep it simple, stupid!"** Avoid complex features and full-scale type checking.
   - **FAIL FAST**! Avoid `try` logic so you can quickly identify any weak points in the system.
   - Add logging throughout the code to facilitate debugging.

6. **Optimization**:

   - **Use Intuition**: For a quick initial evaluation, human intuition is often a good start.
   - **Redesign Flow (Back to Step 3)**: Consider breaking down tasks further, introducing agentic decisions, or better managing input contexts.
   - If your flow design is already solid, move on to micro-optimizations:

     - **Prompt Engineering**: Use clear, specific instructions with examples to reduce ambiguity.
     - **In-Context Learning**: Provide robust examples for tasks that are difficult to specify with instructions alone.

   - > **You'll likely iterate a lot!** Expect to repeat Steps 3–6 hundreds of times.
     >
     > <div align="center"><img src="https://github.com/the-pocket/.github/raw/main/assets/success.png?raw=true" width="400"/></div>
     > {: .best-practice }

7. **Reliability**
   - **Node Retries**: Add checks in the node `exec` to ensure outputs meet requirements, and consider increasing `maxRetries` and `wait` times.
   - **Logging and Visualization**: Maintain logs of all attempts and visualize node results for easier debugging.
   - **Self-Evaluation**: Add a separate node (powered by an LLM) to review outputs when results are uncertain.

## Example LLM Project File Structure

```
my-project/
├── src/
│   ├── index.ts
│   ├── nodes.ts
│   ├── flow.ts
│   ├── types.ts
│   └── utils/
│       ├── index.ts
│       ├── callLlm.ts
│       └── searchWeb.ts
├── tests/
│   ├── flow.test.ts
│   └── nodes.test.ts
├── docs/
│   └── design.md
├── package.json
└── tsconfig.json
```

- **`docs/design.md`**: Contains project documentation for each step above. This should be _high-level_ and _no-code_.
- **`src/types.ts`**: Contains shared type definitions and interfaces used throughout the project.
- **`src/utils/`**: Contains all utility functions.
  - It's recommended to dedicate one TypeScript file to each API call, for example `callLlm.ts` or `searchWeb.ts`.
  - Each file should export functions that can be imported elsewhere in the project
  - Include tests in the `tests` directory for each utility function
- **`src/nodes.ts`**: Contains all the node definitions.

  ```typescript
  // src/types.ts
  export interface QASharedStore {
    question?: string;
    answer?: string;
    [key: string]: unknown;
  }
  ```

  ```typescript
  // src/nodes.ts
  import { Node } from "pocketflow";
  import { callLlm } from "./utils/callLlm";
  import { QASharedStore } from "./types";

  export class GetQuestionNode extends Node<QASharedStore> {
    async exec(_: unknown): Promise<string> {
      // Get question directly from user input
      const userQuestion = prompt("Enter your question: ") || "";
      return userQuestion;
    }

    async post(
      shared: QASharedStore,
      _: unknown,
      execRes: string
    ): Promise<string | undefined> {
      // Store the user's question
      shared.question = execRes;
      return "default"; // Go to the next node
    }
  }

  export class AnswerNode extends Node<QASharedStore> {
    async prep(shared: QASharedStore): Promise<string> {
      // Read question from shared
      return shared.question || "";
    }

    async exec(question: string): Promise<string> {
      // Call LLM to get the answer
      return await callLlm(question);
    }

    async post(
      shared: QASharedStore,
      _: unknown,
      execRes: string
    ): Promise<string | undefined> {
      // Store the answer in shared
      shared.answer = execRes;
      return undefined;
    }
  }
  ```

- **`src/flow.ts`**: Implements functions that create flows by importing node definitions and connecting them.

  ```typescript
  // src/flow.ts
  import { Flow } from "pocketflow";
  import { GetQuestionNode, AnswerNode } from "./nodes";

  export function createQaFlow(): Flow {
    // Create nodes
    const getQuestionNode = new GetQuestionNode();
    const answerNode = new AnswerNode();

    // Connect nodes in sequence
    getQuestionNode.next(answerNode);

    // Create flow starting with input node
    return new Flow(getQuestionNode);
  }
  ```

- **`src/index.ts`**: Serves as the project's entry point.

  ```typescript
  // src/index.ts
  import { createQaFlow } from "./flow";
  import { QASharedStore } from "./types";

  // Example main function
  async function main(): Promise<void> {
    const shared: QASharedStore = {
      question: undefined, // Will be populated by GetQuestionNode from user input
      answer: undefined, // Will be populated by AnswerNode
    };

    // Create the flow and run it
    const qaFlow = createQaFlow();
    await qaFlow.run(shared);
    console.log(`Question: ${shared.question}`);
    console.log(`Answer: ${shared.answer}`);
  }

  // Run the main function
  main().catch(console.error);
  ```

- **`tests/`**: Contains test files that verify the functionality of your nodes, flows, and utilities.

  - Use a testing framework like Jest or Mocha
  - Write tests for each node, flow, and utility function
  - Consider using mock data and interfaces for testing

- **`package.json`**: Contains project metadata and dependencies.

- **`tsconfig.json`**: Contains TypeScript compiler configuration.
