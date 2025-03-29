---
layout: default
title: "Web Search"
parent: "Utility Function"
nav_order: 3
---

# Web Search

We recommend some implementations of commonly used web search tools.

| **API**                           | **Free Tier**                                       | **Pricing Model**                                   | **Docs**                                                                    |
| --------------------------------- | --------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| **Google Custom Search JSON API** | 100 queries/day free                                | $5 per 1000 queries.                                | [Link](https://developers.google.com/custom-search/v1/overview)             |
| **Bing Web Search API**           | 1,000 queries/month                                 | $15–$25 per 1,000 queries.                          | [Link](https://learn.microsoft.com/en-us/bing/search-apis/bing-web-search/) |
| **DuckDuckGo Instant Answer**     | Completely free (Instant Answers only, **no URLs**) | No paid plans; usage unlimited, but data is limited | [Link](https://duckduckgo.com/api)                                          |
| **Brave Search API**              | 2,000 queries/month free                            | $3 per 1k queries for Base, $5 per 1k for Pro       | [Link](https://brave.com/search/api/)                                       |
| **SerpApi**                       | 100 searches/month free                             | Start at $75/month for 5,000 searches               | [Link](https://serpapi.com/)                                                |

## Example TypeScript Code

### 1. Google Custom Search JSON API

```typescript
// Google doesn't provide an official SDK for JavaScript/TypeScript
// This example uses the googleapis package which provides a more SDK-like experience

import { google } from "googleapis";

interface GoogleSearchResult {
  kind: string;
  url: {
    type: string;
    template: string;
  };
  queries: {
    request: any[];
    nextPage?: any[];
  };
  context: {
    title: string;
  };
  searchInformation: {
    searchTime: number;
    formattedSearchTime: string;
    totalResults: string;
    formattedTotalResults: string;
  };
  items: Array<{
    kind: string;
    title: string;
    htmlTitle: string;
    link: string;
    displayLink: string;
    snippet: string;
    htmlSnippet: string;
    formattedUrl: string;
    htmlFormattedUrl: string;
    pagemap?: Record<string, any>;
  }>;
}

/**
 * Perform a Google Custom Search using the Google APIs client library
 */
async function googleSearch(
  query: string,
  apiKey: string,
  cxId: string,
  start: number = 1
): Promise<GoogleSearchResult> {
  // Initialize the Custom Search API service
  const customsearch = google.customsearch("v1");

  try {
    // Make the search request
    const response = await customsearch.cse.list({
      auth: apiKey,
      cx: cxId,
      q: query,
      start,
    });

    return response.data as GoogleSearchResult;
  } catch (error) {
    console.error("Error performing Google Custom Search:", error);
    throw error;
  }
}

// Example usage
const API_KEY = "YOUR_API_KEY";
const CX_ID = "YOUR_CX_ID";

googleSearch("example query", API_KEY, CX_ID)
  .then((results) => {
    console.log(`Total Results: ${results.searchInformation.totalResults}`);
    results.items.forEach((item) => {
      console.log(`Title: ${item.title}`);
      console.log(`Link: ${item.link}`);
      console.log(`Snippet: ${item.snippet}`);
      console.log("---");
    });
  })
  .catch((error) => {
    console.error("Search failed:", error);
  });
```

### 2. Bing Web Search API

```typescript
// Using the official Microsoft Bing Web Search SDK
import * as BingWebSearchAPI from "@azure/cognitiveservices-websearch";
import { CognitiveServicesCredentials } from "@azure/ms-rest-azure-js";

/**
 * Perform a Bing Web Search using the official Microsoft SDK
 */
async function bingSearch(
  query: string,
  subscriptionKey: string,
  count: number = 10,
  offset: number = 0,
  market: string = "en-US"
) {
  // Create a Cognitive Services credentials instance with your subscription key
  const credentials = new CognitiveServicesCredentials(subscriptionKey);

  // Create the search client
  const client = new BingWebSearchAPI.WebSearchClient(credentials);

  try {
    // Make the search request
    const searchResponse = await client.web.search(query, {
      count,
      offset,
      market,
      responseFilter: ["Webpages", "News", "Videos", "RelatedSearches"],
    });

    return searchResponse;
  } catch (error) {
    console.error("Error performing Bing Web Search:", error);
    throw error;
  }
}

// Example usage
const SUBSCRIPTION_KEY = "YOUR_BING_API_KEY";

bingSearch("example query", SUBSCRIPTION_KEY)
  .then((results) => {
    if (results.webPages) {
      console.log(`Total Results: ${results.webPages.totalEstimatedMatches}`);
      results.webPages.value.forEach((item) => {
        console.log(`Title: ${item.name}`);
        console.log(`URL: ${item.url}`);
        console.log(`Snippet: ${item.snippet}`);
        console.log("---");
      });
    } else {
      console.log("No web results found");
    }
  })
  .catch((error) => {
    console.error("Search failed:", error);
  });
```

### 3. DuckDuckGo Instant Answer API

```typescript
// Using duck-duck-scrape, a community SDK for DuckDuckGo
import { DuckDuckGo } from "duck-duck-scrape";

interface DuckDuckGoResultItem {
  title: string;
  url: string;
  description: string;
}

/**
 * Search DuckDuckGo using the duck-duck-scrape library
 * This provides more functionality than the Instant Answer API alone
 */
async function duckDuckGoSearch(query: string, maxResults: number = 10) {
  const ddg = new DuckDuckGo();

  try {
    // Get instant answers and search results
    const response = await ddg.search(query, {
      safeSearch: "moderate",
      time: "y", // past year
      region: "us-en",
    });

    return {
      // Get instant answer if available
      abstractText: response.abstractText || "",
      abstractSource: response.abstractSource || "",
      abstractUrl: response.abstractUrl || "",

      // Get search results
      results: response.results.slice(0, maxResults).map((result) => ({
        title: result.title,
        url: result.url,
        description: result.description,
      })),

      // Get related topics
      relatedTopics: (response.relatedTopics || [])
        .slice(0, 5)
        .map((topic) => ({
          text: topic.text,
          url: topic.url,
        })),
    };
  } catch (error) {
    console.error("Error performing DuckDuckGo search:", error);
    throw error;
  }
}

// Example usage
duckDuckGoSearch("climate change")
  .then((results) => {
    if (results.abstractText) {
      console.log(`Abstract: ${results.abstractText}`);
      console.log(`Source: ${results.abstractSource} (${results.abstractUrl})`);
    }

    if (results.results.length > 0) {
      console.log("\nResults:");
      results.results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   ${result.description}`);
        console.log("---");
      });
    }

    if (results.relatedTopics.length > 0) {
      console.log("\nRelated Topics:");
      results.relatedTopics.forEach((topic) => {
        console.log(`- ${topic.text} (${topic.url})`);
      });
    }
  })
  .catch((error) => {
    console.error("Search failed:", error);
  });
```

### 4. Brave Search API

```typescript
// Using brave-search TypeScript SDK
import { BraveSearch } from "brave-search";

/**
 * Perform a Brave Search using the brave-search SDK
 */
async function braveSearchWithSDK(
  query: string,
  apiKey: string,
  count: number = 10,
  offset: number = 0
) {
  // Initialize the Brave Search client
  const braveClient = new BraveSearch(apiKey);

  try {
    // Make the search request
    const results = await braveClient.search({
      q: query,
      count,
      offset,
    });

    return results;
  } catch (error) {
    console.error("Error performing Brave search:", error);
    throw error;
  }
}

// Example usage
const BRAVE_API_TOKEN = "YOUR_BRAVE_API_TOKEN";

braveSearchWithSDK("renewable energy", BRAVE_API_TOKEN)
  .then((results) => {
    console.log("Search Results:");

    // Access the web results
    if (results.web && results.web.results) {
      results.web.results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   ${result.description}`);
        console.log("---");
      });
    }

    // Check if automatic summarization is available (Pro plan feature)
    if (results.goggles) {
      console.log("Automatic Summarization:");
      console.log(results.goggles.content);
    }
  })
  .catch((error) => {
    console.error("Search failed:", error);
  });
```

### 5. SerpApi

```typescript
// Using the official SerpApi SDK
import { getJson } from "serpapi";

interface SerpApiResult {
  search_metadata: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    google_url: string;
    raw_html_file: string;
    total_time_taken: number;
  };
  search_parameters: {
    engine: string;
    q: string;
    location_requested: string;
    location_used: string;
    google_domain: string;
    hl: string;
    gl: string;
    device: string;
  };
  search_information: {
    organic_results_state: string;
    query_displayed: string;
    total_results: number;
    time_taken_displayed: number;
  };
  organic_results: Array<{
    position: number;
    title: string;
    link: string;
    displayed_link: string;
    snippet: string;
    snippet_highlighted_words: string[];
    sitelinks?: any;
    about_this_result?: any;
    cached_page_link?: string;
    related_pages_link?: string;
  }>;
  related_questions?: any[];
  related_searches?: any[];
  pagination?: any;
  knowledge_graph?: any;
  answer_box?: any;
}

/**
 * Perform a search using the SerpApi SDK
 */
async function serpApiSearch(
  query: string,
  apiKey: string,
  location: string = "United States",
  num: number = 10,
  start: number = 0
): Promise<SerpApiResult> {
  try {
    // Make the search request using the SDK
    return (await getJson({
      engine: "google",
      api_key: apiKey,
      q: query,
      location,
      num,
      start,
    })) as SerpApiResult;
  } catch (error) {
    console.error("Error performing SerpApi search:", error);
    throw error;
  }
}

// Example usage
const SERPAPI_KEY = "YOUR_SERPAPI_KEY";

serpApiSearch("electric vehicles", SERPAPI_KEY)
  .then((response) => {
    console.log(`Total Results: ${response.search_information.total_results}`);
    console.log("Organic Results:");

    response.organic_results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.link}`);
      console.log(`   ${result.snippet}`);
      console.log("---");
    });

    if (response.pagination) {
      console.log("Pagination available for more results");
    }
  })
  .catch((error) => {
    console.error("Search failed:", error);
  });
```
