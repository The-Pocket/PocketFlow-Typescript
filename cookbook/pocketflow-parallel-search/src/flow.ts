import { Flow, Node } from "pocketflow";
import { searchWeb, SearchOptions } from "./search";

export interface SearchStore {
  query: string;
  results?: string;
  report?: string;
}

class SearchNode extends Node<SearchStore> {
  constructor(private readonly options: SearchOptions) { super(); }
  async prep(shared: SearchStore): Promise<string> { return shared.query; }
  async exec(query: string): Promise<string> { return searchWeb(query, this.options); }
  async post(shared: SearchStore, _: unknown, results: string): Promise<string> {
    shared.results = results;
    return "default";
  }
}

class ReportNode extends Node<SearchStore> {
  async prep(shared: SearchStore): Promise<string> { return shared.results ?? ""; }
  async exec(results: string): Promise<string> { return `# Web search sources\n\n${results}`; }
  async post(shared: SearchStore, _: unknown, report: string): Promise<undefined> {
    shared.report = report;
    return undefined;
  }
}

/** Create an explicitly selected web search flow; no other providers are configured. */
export function createSearchFlow(options: SearchOptions = {}): Flow<SearchStore> {
  const search = new SearchNode(options);
  search.next(new ReportNode());
  return new Flow<SearchStore>(search);
}
