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

- Generating Configuration Files

```yaml
server:
  host: 127.0.0.1
  port: 8080
  ssl: true
```

## TypeScript Implementation

When using PocketFlow with structured output, follow these TypeScript patterns:

1. **Define Types** for your structured input/output
2. **Implement Validation** in your Node methods
3. **Use Type-Safe Operations** throughout your flow

### Example Text Summarization

````typescript
// Define structured output type
type SummaryResult = {
  summary: string[];
};

// Type for shared state
type SharedStorage = {
  text?: string;
  result?: SummaryResult;
};

class SummarizeNode extends Node<SharedStorage> {
  async prep(shared: SharedStorage): Promise<string | undefined> {
    // Return the text to summarize from shared state
    return shared.text;
  }

  async exec(prepRes: string | undefined): Promise<SummaryResult> {
    if (!prepRes) {
      return { summary: ["No text provided"] };
    }

    // Call LLM with prompt for structured output in YAML format
    const prompt = `
Please summarize the following text as YAML, with exactly 3 bullet points

${prepRes}

Now, output:
\`\`\`yaml
summary:
  - bullet 1
  - bullet 2
  - bullet 3
\`\`\``;

    // Simulated LLM call
    const response =
      "```yaml\nsummary:\n  - First important point\n  - Second key insight\n  - Final conclusion\n```";

    // Parse YAML response
    const yamlStr = response.split("```yaml")[1].split("```")[0].trim();

    // Convert to TypeScript object
    // In practice, you might use a library like js-yaml
    const result: SummaryResult = {
      summary: yamlStr
        .split("\n")
        .filter((line) => line.trim().startsWith("- "))
        .map((line) => line.trim().substring(2)),
    };

    // Validate the structure
    if (!result.summary || !Array.isArray(result.summary)) {
      throw new Error("Invalid summary structure");
    }

    return result;
  }

  async post(
    shared: SharedStorage,
    prepRes: string | undefined,
    execRes: SummaryResult
  ): Promise<string | undefined> {
    // Store the result in shared state
    shared.result = execRes;
    return "default";
  }
}
````

### Validation in TypeScript

In TypeScript, you can use several approaches for validation:

1. **Type Checking**: TypeScript's static type system catches many issues at compile time
2. **Runtime Assertions**: Use conditional checks and throw errors for invalid data
3. **Schema Validation Libraries**: For more complex scenarios, consider libraries like:
   - [Zod](https://github.com/colinhacks/zod) - TypeScript-first schema validation
   - [Yup](https://github.com/jquense/yup) - Schema validation with clear error messages
   - [io-ts](https://github.com/gcanti/io-ts) - Runtime type system for IO validation

### Why YAML instead of JSON?

Current LLMs struggle with escaping. YAML is easier with strings since they don't always need quotes.

**In JSON**

```json
{
  "dialogue": "Alice said: \"Hello Bob.\\nHow are you?\\nI am good.\""
}
```

- Every double quote inside the string must be escaped with `\"`.
- Each newline in the dialogue must be represented as `\n`.

**In YAML**

```yaml
dialogue: |
  Alice said: "Hello Bob.
  How are you?
  I am good."
```

- No need to escape interior quotes—just place the entire text under a block literal (`|`).
- Newlines are naturally preserved without needing `\n`.
