// tests/multi-agent-pattern.test.ts
import { Node, Flow } from '../src/index';

// Define shared storage with message queue for basic agent communication
type MessageQueueSharedStorage = {
  messages: string[];
  processedMessages: string[];
  processing?: boolean;
};

// Mock utility function to simulate LLM calls
function mockLLM(prompt: string): string {
  // Simple mock LLM that responds based on the prompt
  if (prompt.includes('Generate hint')) {
    return 'This is a hint: Something cold on a stick';
  } else if (prompt.includes('Guess')) {
    return 'popsicle';
  }
  return `Response to: ${prompt.substring(0, 20)}...`;
}

// Basic Agent Communication Example
class ListenerAgent extends Node<MessageQueueSharedStorage> {
  async prep(shared: MessageQueueSharedStorage): Promise<string | undefined> {
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
    
    // Process the message (in real implementation, this could call an LLM)
    const response = `Processed: ${message}`;
    return response;
  }

  async post(
    shared: MessageQueueSharedStorage,
    prepRes: string | undefined,
    execRes: string | undefined
  ): Promise<string> {
    if (execRes) {
      // Store the processed message
      shared.processedMessages.push(execRes);
    }
    
    if (shared.messages.length === 0) {
      // Add a small delay to avoid tight loop CPU consumption in real implementation
      return "finished";
    }
    
    // Continue processing messages
    return "continue";
  }
}

// Taboo Game Example
// Define shared storage for the game
type TabooGameSharedStorage = {
  targetWord: string;
  forbiddenWords: string[];
  pastGuesses: string[];
  hinterQueue: string[];
  guesserQueue: string[];
  gameOver: boolean;
  maxRounds: number;
  currentRound: number;
  isCorrectGuess: boolean;
};

// Hinter agent that provides clues
class Hinter extends Node<TabooGameSharedStorage> {
  async prep(shared: TabooGameSharedStorage): Promise<any> {
    if (shared.gameOver) {
      return null;
    }

    // In test, we'll simulate waiting for a message by checking if it's our turn
    if (shared.hinterQueue.length === 0) {
      return null;
    }

    const message = shared.hinterQueue.shift();
    
    return {
      target: shared.targetWord,
      forbidden: shared.forbiddenWords,
      pastGuesses: shared.pastGuesses,
      message
    };
  }

  async exec(input: any): Promise<string | null> {
    if (!input) return null;
    
    // Generate a hint using mock LLM
    const prompt = `Generate hint for word "${input.target}" without using forbidden words: ${input.forbidden.join(', ')}`;
    const hint = mockLLM(prompt);
    return hint;
  }

  async post(
    shared: TabooGameSharedStorage,
    prepRes: any,
    hint: string | null
  ): Promise<string | undefined> {
    if (!hint) {
      if (shared.gameOver) {
        return "finished";
      }
      return "continue_hinter";
    }
    
    // Send hint to guesser
    shared.guesserQueue.push(hint);
    shared.currentRound++;
    
    return "continue_hinter";
  }
}

// Guesser agent that tries to guess the target word
class Guesser extends Node<TabooGameSharedStorage> {
  async prep(shared: TabooGameSharedStorage): Promise<string | null> {
    if (shared.gameOver) {
      return null;
    }

    // Wait for a hint from the hinter
    if (shared.guesserQueue.length === 0) {
      return null;
    }

    return shared.guesserQueue.shift() || null;
  }

  async exec(hint: string | null): Promise<string | null> {
    if (!hint) return null;
    
    // Generate a guess using mock LLM
    const prompt = `Guess the word based on the hint: ${hint}`;
    const guess = mockLLM(prompt);
    return guess;
  }

  async post(
    shared: TabooGameSharedStorage,
    hint: string | null,
    guess: string | null
  ): Promise<string | undefined> {
    if (!guess) {
      if (shared.gameOver) {
        return "finished";
      }
      return "continue_guesser";
    }
    
    // Record the guess
    shared.pastGuesses.push(guess);
    
    // Check if the guess is correct
    if (guess.toLowerCase() === shared.targetWord.toLowerCase()) {
      shared.isCorrectGuess = true;
      shared.gameOver = true;
      return "finished";
    }
    
    // Check if we've reached maximum rounds
    if (shared.currentRound >= shared.maxRounds) {
      shared.gameOver = true;
      return "finished";
    }
    
    // Send message to hinter for next round
    shared.hinterQueue.push("next_hint");
    
    return "continue_guesser";
  }
}

// Tests for Multi-Agent pattern
describe('Multi-Agent Pattern Tests', () => {
  // Test basic agent message queue
  test('Basic Agent Message Queue', async () => {
    // Create agent node
    const agent = new ListenerAgent();
    agent.on("continue", agent); // Connect to self to continue processing
    
    // Create flow
    const flow = new Flow(agent);
    
    // Create shared storage with messages
    const shared: MessageQueueSharedStorage = {
      messages: [
        "System status: all systems operational",
        "Memory usage: normal",
        "Network connectivity: stable",
        "Processing load: optimal",
      ],
      processedMessages: []
    };
    
    // Run the flow
    await flow.run(shared);
    
    // Verify results
    expect(shared.messages.length).toBe(0);
    expect(shared.processedMessages.length).toBe(4);
    expect(shared.processedMessages[0]).toBe("Processed: System status: all systems operational");
  });
  
  // Test Taboo game multi-agent interaction
  test('Taboo Game Multi-Agent Interaction', async () => {
    // Create the agents
    const hinter = new Hinter();
    const guesser = new Guesser();
    
    // Connect agents
    hinter.on("continue_hinter", hinter);
    guesser.on("continue_guesser", guesser);
    
    // Create shared game state
    const shared: TabooGameSharedStorage = {
      targetWord: "popsicle",
      forbiddenWords: ["ice", "cream", "frozen", "stick", "summer"],
      pastGuesses: [],
      hinterQueue: ["start_game"], // Initial message to start the game
      guesserQueue: [],
      gameOver: false,
      maxRounds: 3,
      currentRound: 0,
      isCorrectGuess: false
    };
    
    // Create flows
    const hinterFlow = new Flow(hinter);
    const guesserFlow = new Flow(guesser);
    
    // Run both flows concurrently to simulate multi-agent interaction
    const hinterPromise = hinterFlow.run(shared);
    const guesserPromise = guesserFlow.run(shared);
    
    // Wait for both to finish
    await Promise.all([hinterPromise, guesserPromise]);
    
    // Verify results
    expect(shared.gameOver).toBe(true);
    expect(shared.pastGuesses.length).toBeGreaterThan(0);
    expect(shared.isCorrectGuess).toBe(true);
  });
  
  // Test changing agent behavior with different parameters
  test('Configurable Agent Behavior', async () => {
    // Create a configurable agent that can be adjusted for testing
    class ConfigurableAgent extends Node<MessageQueueSharedStorage> {
      private processingDelay: number;
      
      constructor(processingDelay: number = 0) {
        super();
        this.processingDelay = processingDelay;
      }
      
      async prep(shared: MessageQueueSharedStorage): Promise<string | undefined> {
        if (shared.messages.length === 0) {
          return undefined;
        }
        return shared.messages.shift();
      }
      
      async exec(message: string | undefined): Promise<string | undefined> {
        if (!message) {
          return undefined;
        }
        
        // Simulate processing time
        if (this.processingDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.processingDelay));
        }
        
        return `Processed with ${this.processingDelay}ms delay: ${message}`;
      }
      
      async post(
        shared: MessageQueueSharedStorage,
        prepRes: string | undefined,
        execRes: string | undefined
      ): Promise<string> {
        if (execRes) {
          shared.processedMessages.push(execRes);
        }
        
        if (shared.messages.length === 0) {
          return "finished";
        }
        return "continue";
      }
    }
    
    // Test with fast agent
    const fastAgent = new ConfigurableAgent(0);
    fastAgent.on("continue", fastAgent);
    const fastFlow = new Flow(fastAgent);
    
    const fastShared: MessageQueueSharedStorage = {
      messages: ["Message 1", "Message 2", "Message 3"],
      processedMessages: []
    };
    
    await fastFlow.run(fastShared);
    
    // Test with slow agent
    const slowAgent = new ConfigurableAgent(10);
    slowAgent.on("continue", slowAgent);
    const slowFlow = new Flow(slowAgent);
    
    const slowShared: MessageQueueSharedStorage = {
      messages: ["Message 1", "Message 2", "Message 3"],
      processedMessages: []
    };
    
    await slowFlow.run(slowShared);
    
    // Verify both processed all messages
    expect(fastShared.processedMessages.length).toBe(3);
    expect(slowShared.processedMessages.length).toBe(3);
    
    // Verify processing indicators in the output
    expect(fastShared.processedMessages[0]).toContain("Processed with 0ms delay");
    expect(slowShared.processedMessages[0]).toContain("Processed with 10ms delay");
  });
}); 