---
layout: default
title: "Workflow"
parent: "Design Pattern"
nav_order: 2
---

# Workflow

Many real-world tasks are too complex for one LLM call. The solution is to **Task Decomposition**: decompose them into a [chain](../core_abstraction/flow.md) of multiple Nodes.

<div align="center">
  <img src="https://github.com/the-pocket/.github/raw/main/assets/workflow.png?raw=true" width="400"/>
</div>

> - You don't want to make each task **too coarse**, because it may be _too complex for one LLM call_.
> - You don't want to make each task **too granular**, because then _the LLM call doesn't have enough context_ and results are _not consistent across nodes_.
>
> You usually need multiple _iterations_ to find the _sweet spot_. If the task has too many _edge cases_, consider using [Agents](./agent.md).
> {: .best-practice }

### Example: Article Writing

```typescript
interface SharedState {
  topic?: string;
  outline?: string;
  draft?: string;
  final_article?: string;
}

// Helper function to simulate LLM call
async function callLLM(prompt: string): Promise<string> {
  return `Response to: ${prompt}`;
}

class GenerateOutline extends Node<SharedState> {
  async prep(shared: SharedState): Promise<string> {
    return shared.topic || "";
  }

  async exec(topic: string): Promise<string> {
    return await callLLM(
      `Create a detailed outline for an article about ${topic}`
    );
  }

  async post(shared: SharedState, _: string, outline: string): Promise<string> {
    shared.outline = outline;
    return "default";
  }
}

class WriteSection extends Node<SharedState> {
  async prep(shared: SharedState): Promise<string> {
    return shared.outline || "";
  }

  async exec(outline: string): Promise<string> {
    return await callLLM(`Write content based on this outline: ${outline}`);
  }

  async post(shared: SharedState, _: string, draft: string): Promise<string> {
    shared.draft = draft;
    return "default";
  }
}

class ReviewAndRefine extends Node<SharedState> {
  async prep(shared: SharedState): Promise<string> {
    return shared.draft || "";
  }

  async exec(draft: string): Promise<string> {
    return await callLLM(`Review and improve this draft: ${draft}`);
  }

  async post(
    shared: SharedState,
    _: string,
    final: string
  ): Promise<undefined> {
    shared.final_article = final;
    return undefined;
  }
}

// Connect nodes in sequence
const outline = new GenerateOutline();
const write = new WriteSection();
const review = new ReviewAndRefine();

outline.next(write).next(review);

// Create and run flow
const writingFlow = new Flow(outline);
writingFlow.run({ topic: "AI Safety" });
```

For _dynamic cases_, consider using [Agents](./agent.md).
