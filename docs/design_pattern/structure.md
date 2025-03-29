---
layout: default
title: "Structured Output"
parent: "Design Pattern"
nav_order: 5
---

# Structured Output

In many use cases, you may want the LLM to output a specific structure, such as a list or a dictionary with predefined keys.

There are several approaches to achieve a structured output:

- **Prompting** the LLM to strictly return a defined structure.
- Using LLMs that natively support **schema enforcement**.
- **Post-processing** the LLM's response to extract structured content.

In practice, **Prompting** is simple and reliable for modern LLMs.

### Example Use Cases

- Extracting Key Information

```yaml
product:
  name: Widget Pro
  price: 199.99
  description: |
    A high-quality widget designed for professionals.
    Recommended for advanced users.
```

- Summarizing Documents into Bullet Points

```yaml
summary:
  - This product is easy to use.
  - It is cost-effective.
  - Suitable for all skill levels.
```

## TypeScript Implementation

When using PocketFlow with structured output, follow these TypeScript patterns:

1. **Define Types** for your structured input/output
2. **Implement Validation** in your Node methods
3. **Use Type-Safe Operations** throughout your flow

### Example Text Summarization

````typescript
// Define types
type SummaryResult = {
  summary: string[];
};

type SharedStorage = {
  text?: string;
  result?: SummaryResult;
};

class SummarizeNode extends Node<SharedStorage> {
  async prep(shared: SharedStorage): Promise<string | undefined> {
    return shared.text;
  }

  async exec(text: string | undefined): Promise<SummaryResult> {
    if (!text) return { summary: ["No text provided"] };

    const prompt = `
Please summarize the following text as YAML, with exactly 3 bullet points

${text}

Output:
\`\`\`yaml
summary:
  - bullet 1
  - bullet 2
  - bullet 3
\`\`\``;

    // Simulated LLM call
    const response =
      "```yaml\nsummary:\n  - First point\n  - Second insight\n  - Final conclusion\n```";

    // Parse YAML response
    const yamlStr = response.split("```yaml")[1].split("```")[0].trim();

    // Extract bullet points
    const result: SummaryResult = {
      summary: yamlStr
        .split("\n")
        .filter((line) => line.trim().startsWith("- "))
        .map((line) => line.trim().substring(2)),
    };

    // Validate
    if (!result.summary || !Array.isArray(result.summary)) {
      throw new Error("Invalid summary structure");
    }

    return result;
  }

  async post(
    shared: SharedStorage,
    _: string | undefined,
    result: SummaryResult
  ): Promise<string | undefined> {
    shared.result = result;
    return "default";
  }
}
````

### Why YAML instead of JSON?

Current LLMs struggle with escaping. YAML is easier with strings since they don't always need quotes.

**In JSON**

```json
{
  "dialogue": "Alice said: \"Hello Bob.\\nHow are you?\\nI am good.\""
}
```

**In YAML**

```yaml
dialogue: |
  Alice said: "Hello Bob.
  How are you?
  I am good."
```
