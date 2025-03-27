import { AsyncNode, Flow } from 'pocketflow';

// Define a shared storage
type SharedStorage = { text?: string };

// Node that stores text
class StoreTextNode extends AsyncNode<SharedStorage> {
  constructor(private text: string) {
    super();
  }
  
  async prep(shared: SharedStorage): Promise<void> {
    shared.text = this.text;
  }
}

// Node that prints text
class PrintTextNode extends AsyncNode<SharedStorage> {
  async prep(shared: SharedStorage): Promise<void> {
    console.log(shared.text || "No text");
  }
}

// Run example
async function main() {
  const shared: SharedStorage = {};
  
  const storeNode = new StoreTextNode("Hello World");
  const printNode = new PrintTextNode();
  storeNode.next(printNode);
  
  const flow = new Flow(storeNode);
  await flow.run(shared);
}

main();