---
layout: default
title: "Agent"
parent: "Design Pattern"
nav_order: 1
---

# Agent

Agent is a powerful design pattern in which nodes can take dynamic actions based on the context.

<div align="center">
  <img src="https://github.com/the-pocket/.github/raw/main/assets/agent.png?raw=true" width="350"/>
</div>

## Implement Agent with Graph

1. **Context and Action:** Implement nodes that supply context and perform actions.
2. **Branching:** Use branching to connect each action node to an agent node. Use action to allow the agent to direct the [flow](../core_abstraction/flow.md) between nodes—and potentially loop back for multi-step.
3. **Agent Node:** Provide a prompt to decide action—for example:

```typescript
`
### CONTEXT
Task: ${taskDescription}
Previous Actions: ${previousActions}
Current State: ${currentState}

### ACTION SPACE
[1] search
  Description: Use web search to get results
  Parameters:
    - query (str): What to search for

[2] answer
  Description: Conclude based on the results
  Parameters:
    - result (str): Final answer to provide

### NEXT ACTION
Decide the next action based on the current context and available action space.
Return your response in the following format:

\`\`\`yaml
thinking: |
    <your step-by-step reasoning process>
action: <action_name>
parameters:
    <parameter_name>: <parameter_value>
\`\`\``;
```

The core of building **high-performance** and **reliable** agents boils down to:

1. **Context Management:** Provide _relevant, minimal context._ For example, rather than including an entire chat history, retrieve the most relevant via [RAG](./rag.md). Even with larger context windows, LLMs still fall victim to ["lost in the middle"](https://arxiv.org/abs/2307.03172), overlooking mid-prompt content.

2. **Action Space:** Provide _a well-structured and unambiguous_ set of actions—avoiding overlap like separate `read_databases` or `read_csvs`. Instead, import CSVs into the database.

## Example Good Action Design

- **Incremental:** Feed content in manageable chunks (500 lines or 1 page) instead of all at once.

- **Overview-zoom-in:** First provide high-level structure (table of contents, summary), then allow drilling into details (raw texts).

- **Parameterized/Programmable:** Instead of fixed actions, enable parameterized (columns to select) or programmable (SQL queries) actions, for example, to read CSV files.

- **Backtracking:** Let the agent undo the last step instead of restarting entirely, preserving progress when encountering errors or dead ends.

## Example: Search Agent

This agent:

1. Decides whether to search or answer
2. If searches, loops back to decide if more search needed
3. Answers when enough context gathered

````typescript
interface AgentAction {
  action: string;
  reason: string;
  search_term?: string;
}

interface SharedState {
  query?: string;
  context?: Array<{ term: string; result: string }>;
  search_term?: string;
  answer?: string;
}

class DecideAction extends Node<SharedState> {
  async prep(shared: SharedState): Promise<[string, string]> {
    const context = shared.context
      ? JSON.stringify(shared.context)
      : "No previous search";
    const query = shared.query || "";
    return [query, context];
  }

  async exec(inputs: [string, string]): Promise<AgentAction> {
    const [query, context] = inputs;
    const prompt = `
Given input: ${query}
Previous search results: ${context}
Should I: 1) Search web for more info 2) Answer with current knowledge
Output in yaml:
\`\`\`yaml
action: search/answer
reason: why this action
search_term: search phrase if action is search
\`\`\``;
    const resp = await callLlm(prompt);
    const yamlStr = resp.split("```yaml")[1].split("```")[0].trim();
    const result = yaml.load(yamlStr) as AgentAction;

    // Validations
    if (!result || typeof result !== "object") {
      throw new Error("Invalid result format");
    }
    if (!("action" in result)) {
      throw new Error("Missing action in result");
    }
    if (!("reason" in result)) {
      throw new Error("Missing reason in result");
    }
    if (result.action !== "search" && result.action !== "answer") {
      throw new Error(`Invalid action: ${result.action}`);
    }
    if (result.action === "search" && !("search_term" in result)) {
      throw new Error("Missing search_term for search action");
    }

    return result;
  }

  async post(
    shared: SharedState,
    prepRes: [string, string],
    execRes: AgentAction
  ): Promise<string> {
    if (execRes.action === "search") {
      shared.search_term = execRes.search_term;
    }
    return execRes.action;
  }
}

class SearchWeb extends Node<SharedState> {
  async prep(shared: SharedState): Promise<string> {
    return shared.search_term || "";
  }

  async exec(searchTerm: string): Promise<string> {
    return await searchWeb(searchTerm);
  }

  async post(
    shared: SharedState,
    prepRes: string,
    execRes: string
  ): Promise<string> {
    const prevSearches = shared.context || [];
    shared.context = [
      ...prevSearches,
      { term: shared.search_term || "", result: execRes },
    ];
    return "decide";
  }
}

class DirectAnswer extends Node<SharedState> {
  async prep(shared: SharedState): Promise<[string, string]> {
    const contextStr = shared.context ? JSON.stringify(shared.context) : "";
    return [shared.query || "", contextStr];
  }

  async exec(inputs: [string, string]): Promise<string> {
    const [query, context] = inputs;
    return await callLlm(`Context: ${context}\nAnswer: ${query}`);
  }

  async post(
    shared: SharedState,
    prepRes: [string, string],
    execRes: string
  ): Promise<undefined> {
    console.log(`Answer: ${execRes}`);
    shared.answer = execRes;
    return undefined;
  }
}

// Connect nodes
const decide = new DecideAction();
const search = new SearchWeb();
const answer = new DirectAnswer();

decide.on("search", search);
decide.on("answer", answer);
search.on("decide", decide); // Loop back

const flow = new Flow(decide);
await flow.run({ query: "Who won the Nobel Prize in Physics 2024?" });
````
