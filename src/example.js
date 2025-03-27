"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pocketflow_1 = require("./pocketflow");
// Simple document processing nodes - now all async
var LoadDocument = /** @class */ (function (_super) {
    __extends(LoadDocument, _super);
    function LoadDocument() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LoadDocument.prototype.prep = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("Preparing to load document...");
                return [2 /*return*/, "dummy-file.txt"];
            });
        });
    };
    LoadDocument.prototype.exec = function (filename) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Loading document ".concat(filename, "..."));
                        // Simulate file loading with a slight delay
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 1:
                        // Simulate file loading with a slight delay
                        _a.sent();
                        return [2 /*return*/, "This is a sample document text that contains multiple words for analysis."];
                }
            });
        });
    };
    LoadDocument.prototype.post = function (shared, filename, content) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("Document loaded successfully");
                shared.rawText = content;
                return [2 /*return*/, "success"];
            });
        });
    };
    return LoadDocument;
}(pocketflow_1.Node));
var AnalyzeDocument = /** @class */ (function (_super) {
    __extends(AnalyzeDocument, _super);
    function AnalyzeDocument() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AnalyzeDocument.prototype.prep = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, shared.rawText];
            });
        });
    };
    AnalyzeDocument.prototype.exec = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var words, sentiment;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Simulate processing time
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 200); })];
                    case 1:
                        // Simulate processing time
                        _a.sent();
                        words = text.split(/\s+/).length;
                        sentiment = text.includes("sample") ? "neutral" : "negative";
                        return [2 /*return*/, { words: words, sentiment: sentiment }];
                }
            });
        });
    };
    AnalyzeDocument.prototype.post = function (shared, text, analysis) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                shared.wordCount = analysis.words;
                shared.sentiment = analysis.sentiment;
                return [2 /*return*/, "default"];
            });
        });
    };
    return AnalyzeDocument;
}(pocketflow_1.Node));
var SummarizeDocument = /** @class */ (function (_super) {
    __extends(SummarizeDocument, _super);
    function SummarizeDocument() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SummarizeDocument.prototype.prep = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, shared.rawText];
            });
        });
    };
    SummarizeDocument.prototype.exec = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Simulate processing time
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 300); })];
                    case 1:
                        // Simulate processing time
                        _a.sent();
                        return [2 /*return*/, "This is a summary of the document."];
                }
            });
        });
    };
    SummarizeDocument.prototype.post = function (shared, text, summary) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                shared.summary = summary;
                return [2 /*return*/, "complete"];
            });
        });
    };
    return SummarizeDocument;
}(pocketflow_1.Node));
var BatchSearchTerms = /** @class */ (function (_super) {
    __extends(BatchSearchTerms, _super);
    function BatchSearchTerms() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BatchSearchTerms.prototype.prep = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            var text;
            return __generator(this, function (_a) {
                text = shared.rawText || "";
                return [2 /*return*/, text.split(/\s+/).filter(function (word) { return word.length > 4; })]; // Only search for words with >4 chars
            });
        });
    };
    BatchSearchTerms.prototype.exec = function (term) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Searching for: ".concat(term));
                        // Simulate API call
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100 + Math.random() * 200); })];
                    case 1:
                        // Simulate API call
                        _a.sent();
                        return [2 /*return*/, "Results for ".concat(term)];
                }
            });
        });
    };
    BatchSearchTerms.prototype.post = function (shared, terms, results) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("Got ".concat(results.length, " search results"));
                shared.searchResults = results;
                return [2 /*return*/, "default"];
            });
        });
    };
    return BatchSearchTerms;
}(pocketflow_1.ParallelBatchNode));
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var loadDoc, analyzeDoc, summarizeDoc, searchTerms, flow, shared;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    loadDoc = new LoadDocument();
                    analyzeDoc = new AnalyzeDocument();
                    summarizeDoc = new SummarizeDocument();
                    searchTerms = new BatchSearchTerms(2, 0.5);
                    // Build the flow
                    loadDoc
                        .next(analyzeDoc, "success")
                        .next(summarizeDoc)
                        .next(searchTerms, "complete");
                    flow = new pocketflow_1.Flow(loadDoc);
                    shared = {};
                    console.time("Flow execution");
                    return [4 /*yield*/, flow.run(shared)];
                case 1:
                    _a.sent();
                    console.timeEnd("Flow execution");
                    // Output results
                    console.log("\nResults:");
                    console.log("Word count:", shared.wordCount);
                    console.log("Sentiment:", shared.sentiment);
                    console.log("Summary:", shared.summary);
                    console.log("Search results:", shared.searchResults);
                    return [2 /*return*/];
            }
        });
    });
}
// Run the async example
main().catch(console.error);
