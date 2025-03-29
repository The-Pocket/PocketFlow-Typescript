---
layout: default
title: "(Advanced) Multi-Agents"
parent: "Design Pattern"
nav_order: 6
---

# (Advanced) Multi-Agents

Multiple [Agents](./flow.md) can work together by handling subtasks and communicating the progress.
Communication between agents is typically implemented using message queues in shared storage.

> Most of time, you don't need Multi-Agents. Start with a simple solution first.
> {: .best-practice }

### Example Agent Communication: Message Queue

Here's a simple example showing how to implement agent communication using a TypeScript message queue.
The agent listens for messages, processes them, and continues listening:

```typescript
import { Node, Flow } from "../src/index";

// Define shared storage with message queue
type SharedStorage = {
  messages: string[];
  processing?: boolean;
};

class AgentNode extends Node<SharedStorage> {
  async prep(shared: SharedStorage): Promise<string | undefined> {
    // Check if there are messages to process
    if (shared.messages.length === 0) {
      return undefined;
    }
    // Get the next message
    return shared.messages.shift();
  }

  async exec(message: string | undefined): Promise<string | undefined> {
    if (!message) {
      return undefined;
    }
    console.log(`Agent received: ${message}`);
    return message;
  }

  async post(
    shared: SharedStorage,
    prepRes: string | undefined,
    execRes: string | undefined
  ): Promise<string> {
    if (shared.messages.length === 0) {
      // Add a small delay to avoid tight loop CPU consumption
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    // Continue processing messages
    return "continue";
  }
}

// Message sender function
function sendSystemMessages(shared: SharedStorage) {
  let counter = 0;
  const messages = [
    "System status: all systems operational",
    "Memory usage: normal",
    "Network connectivity: stable",
    "Processing load: optimal",
  ];

  // Add a new message every second
  let intervalId: NodeJS.Timeout;
  intervalId = setInterval(() => {
    const message = `${
      messages[counter % messages.length]
    } | timestamp_${counter}`;
    shared.messages.push(message);
    counter++;

    // Stop after a few messages for demonstration
    if (counter >= 10) {
      clearInterval(intervalId);
    }
  }, 1000);
}

async function main() {
  // Create shared storage with empty message queue
  const shared: SharedStorage = {
    messages: [],
  };

  // Create agent node
  const agent = new AgentNode();
  agent.on("continue", agent); // Connect to self to continue processing

  // Create flow
  const flow = new Flow(agent);

  // Start sending messages
  sendSystemMessages(shared);

  // Run the flow
  await flow.run(shared);
}

main().catch(console.error);
```

The output:

```
Agent received: System status: all systems operational | timestamp_0
Agent received: Memory usage: normal | timestamp_1
Agent received: Network connectivity: stable | timestamp_2
Agent received: Processing load: optimal | timestamp_3
Agent received: System status: all systems operational | timestamp_4
Agent received: Memory usage: normal | timestamp_5
Agent received: Network connectivity: stable | timestamp_6
Agent received: Processing load: optimal | timestamp_7
Agent received: System status: all systems operational | timestamp_8
Agent received: Memory usage: normal | timestamp_9
```

### Interactive Multi-Agent Example: Taboo Game

Here's a more complex example where two agents play the word-guessing game Taboo.
One agent provides hints while avoiding forbidden words, and another agent tries to guess the target word:

```typescript
import { Node, Flow } from "../src/index";

// Define shared storage for the game
type SharedStorage = {
  targetWord: string;
  forbiddenWords: string[];
  pastGuesses: string[];
  hinterQueue: string[];
  guesserQueue: string[];
  gameOver: boolean;
};

// Utility function to simulate LLM call
function callLLM(prompt: string): string {
  // In a real implementation, this would call an actual LLM API
  console.log(`[LLM PROMPT]: ${prompt}`);

  // For demonstration, return predefined responses
  if (prompt.includes("Generate hint")) {
    if (prompt.includes("popsicle")) {
      return "When childhood cartoons make you emotional";
    }
    if (prompt.includes("nostalgic")) {
      return "When old songs move you";
    }
    if (prompt.includes("memories")) {
      return "That warm emotion about childhood";
    }
    return "Thinking of childhood summer days";
  } else if (prompt.includes("Given hint")) {
    if (prompt.includes("Thinking of childhood summer days")) {
      return "popsicle";
    }
    if (prompt.includes("When childhood cartoons make you emotional")) {
      return "nostalgic";
    }
    if (prompt.includes("When old songs move you")) {
      return "memories";
    }
    if (prompt.includes("That warm emotion about childhood")) {
      return "nostalgia";
    }
    return "unknown";
  }
  return "no response";
}

// Hinter agent that provides clues
class Hinter extends Node<SharedStorage> {
  async prep(shared: SharedStorage): Promise<any> {
    if (shared.gameOver) {
      return null;
    }

    // Wait for a message in the hinter queue
    while (shared.hinterQueue.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (shared.gameOver) return null;
    }

    const guess = shared.hinterQueue.shift();
    if (guess === "GAME_OVER") {
      shared.gameOver = true;
      return null;
    }

    return {
      target: shared.targetWord,
      forbidden: shared.forbiddenWords,
      pastGuesses: shared.pastGuesses,
    };
  }

  async exec(inputs: any): Promise<string | null> {
    if (inputs === null) {
      return null;
    }

    const { target, forbidden, pastGuesses } = inputs;
    let prompt = `Generate hint for '${target}'\nForbidden words: ${forbidden.join(
      ", "
    )}`;

    if (pastGuesses && pastGuesses.length > 0) {
      prompt += `\nPrevious wrong guesses: ${pastGuesses.join(
        ", "
      )}\nMake hint more specific.`;
    }

    prompt += "\nUse at most 5 words.";

    const hint = callLLM(prompt);
    console.log(`\nHinter: Here's your hint - ${hint}`);
    return hint;
  }

  async post(
    shared: SharedStorage,
    prepRes: any,
    execRes: string | null
  ): Promise<string> {
    if (execRes === null) {
      return "end";
    }

    // Send the hint to the guesser
    shared.guesserQueue.push(execRes);
    return "continue";
  }
}

// Guesser agent that tries to guess the word
class Guesser extends Node<SharedStorage> {
  async prep(shared: SharedStorage): Promise<any> {
    if (shared.gameOver) {
      return null;
    }

    // Wait for a hint in the guesser queue
    while (shared.guesserQueue.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (shared.gameOver) return null;
    }

    const hint = shared.guesserQueue.shift();
    return {
      hint,
      pastGuesses: shared.pastGuesses,
    };
  }

  async exec(inputs: any): Promise<string | null> {
    if (inputs === null) {
      return null;
    }

    const { hint, pastGuesses } = inputs;
    const prompt = `Given hint: ${hint}, past wrong guesses: ${pastGuesses.join(
      ", "
    )}, make a new guess. Directly reply a single word:`;

    const guess = callLLM(prompt);
    console.log(`Guesser: I guess it's - ${guess}`);
    return guess;
  }

  async post(
    shared: SharedStorage,
    prepRes: any,
    execRes: string | null
  ): Promise<string> {
    if (execRes === null) {
      return "end";
    }

    if (execRes.toLowerCase() === shared.targetWord.toLowerCase()) {
      console.log("Game Over - Correct guess!");
      shared.gameOver = true;
      shared.hinterQueue.push("GAME_OVER");
      return "end";
    }

    // Add to past guesses
    shared.pastGuesses.push(execRes);

    // Send the guess to the hinter
    shared.hinterQueue.push(execRes);
    return "continue";
  }
}

async function main() {
  // Set up game
  const shared: SharedStorage = {
    targetWord: "nostalgia",
    forbiddenWords: ["memory", "past", "remember", "feeling", "longing"],
    pastGuesses: [],
    hinterQueue: [],
    guesserQueue: [],
    gameOver: false,
  };

  console.log("Game starting!");
  console.log(`Target word: ${shared.targetWord}`);
  console.log(`Forbidden words: ${shared.forbiddenWords.join(", ")}`);

  // Initialize by sending empty guess to hinter
  shared.hinterQueue.push("");

  // Create agents
  const hinter = new Hinter();
  const guesser = new Guesser();

  // Set up flows
  hinter.on("continue", hinter);
  guesser.on("continue", guesser);

  const hinterFlow = new Flow(hinter);
  const guesserFlow = new Flow(guesser);

  // Run both agents
  await Promise.all([hinterFlow.run(shared), guesserFlow.run(shared)]);
}

main().catch(console.error);
```

The Output:

```
Game starting!
Target word: nostalgia
Forbidden words: memory, past, remember, feeling, longing

[LLM PROMPT]: Generate hint for 'nostalgia'
Forbidden words: memory, past, remember, feeling, longing
Use at most 5 words.

Hinter: Here's your hint - Thinking of childhood summer days

[LLM PROMPT]: Given hint: Thinking of childhood summer days, past wrong guesses: , make a new guess. Directly reply a single word:
Guesser: I guess it's - popsicle

[LLM PROMPT]: Generate hint for 'nostalgia'
Forbidden words: memory, past, remember, feeling, longing
Previous wrong guesses: popsicle
Make hint more specific.
Use at most 5 words.

Hinter: Here's your hint - When childhood cartoons make you emotional

[LLM PROMPT]: Given hint: When childhood cartoons make you emotional, past wrong guesses: popsicle, make a new guess. Directly reply a single word:
Guesser: I guess it's - nostalgic

[LLM PROMPT]: Generate hint for 'nostalgia'
Forbidden words: memory, past, remember, feeling, longing
Previous wrong guesses: popsicle, nostalgic
Make hint more specific.
Use at most 5 words.

Hinter: Here's your hint - When old songs move you

[LLM PROMPT]: Given hint: When old songs move you, past wrong guesses: popsicle, nostalgic, make a new guess. Directly reply a single word:
Guesser: I guess it's - memories

[LLM PROMPT]: Generate hint for 'nostalgia'
Forbidden words: memory, past, remember, feeling, longing
Previous wrong guesses: popsicle, nostalgic, memories
Make hint more specific.
Use at most 5 words.

Hinter: Here's your hint - That warm emotion about childhood

[LLM PROMPT]: Given hint: That warm emotion about childhood, past wrong guesses: popsicle, nostalgic, memories, make a new guess. Directly reply a single word:
Guesser: I guess it's - nostalgia
Game Over - Correct guess!
```
