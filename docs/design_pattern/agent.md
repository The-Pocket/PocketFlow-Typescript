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
Task: ${task}
Previous Actions: ${prevActions}
Current State: ${state}

### ACTION SPACE
[1] search
  Description: Use web search to get results
  Parameters: query (str)

[2] answer
  Description: Conclude based on the results
  Parameters: result (str)

### NEXT ACTION
Decide the next action based on the current context.
Return your response in YAML format:

\`\`\`yaml
thinking: <reasoning process>
action: <action_name>
parameters: <parameters>
\`\`\``;
```

The core of building **high-performance** and **reliable** agents boils down to:

1. **Context Management:** Provide _relevant, minimal context._ For example, rather than including an entire chat history, retrieve the most relevant via [RAG](./rag.md).

2. **Action Space:** Provide _a well-structured and unambiguous_ set of actions—avoiding overlap like separate `read_databases` or `read_csvs`.

## Example Good Action Design

- **Incremental:** Feed content in manageable chunks instead of all at once.
- **Overview-zoom-in:** First provide high-level structure, then allow drilling into details.
- **Parameterized/Programmable:** Enable parameterized or programmable actions.
- **Backtracking:** Let the agent undo the last step instead of restarting entirely.

## Example: Search Agent

This agent:

1. Decides whether to search or answer
2. If searches, loops back to decide if more search needed
3. Answers when enough context gathered

````typescript
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
    return [shared.query || "", context];
  }

  async exec([query, context]: [string, string]): Promise<any> {
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
    return yaml.load(yamlStr);
  }

  async post(
    shared: SharedState,
    _: [string, string],
    result: any
  ): Promise<string> {
    if (result.action === "search") {
      shared.search_term = result.search_term;
    }
    return result.action;
  }
}

class SearchWeb extends Node<SharedState> {
  async prep(shared: SharedState): Promise<string> {
    return shared.search_term || "";
  }

  async exec(searchTerm: string): Promise<string> {
    return await searchWeb(searchTerm);
  }

  async post(shared: SharedState, _: string, execRes: string): Promise<string> {
    shared.context = [
      ...(shared.context || []),
      { term: shared.search_term || "", result: execRes },
    ];
    return "decide";
  }
}

class DirectAnswer extends Node<SharedState> {
  async prep(shared: SharedState): Promise<[string, string]> {
    return [
      shared.query || "",
      shared.context ? JSON.stringify(shared.context) : "",
    ];
  }

  async exec([query, context]: [string, string]): Promise<string> {
    return await callLlm(`Context: ${context}\nAnswer: ${query}`);
  }

  async post(
    shared: SharedState,
    _: [string, string],
    execRes: string
  ): Promise<undefined> {
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
