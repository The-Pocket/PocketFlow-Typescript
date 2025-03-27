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
Object.defineProperty(exports, "__esModule", { value: true });
var pocketflow_1 = require("./pocketflow");
// Now using RegularNode instead of Node
var LoadDocument = /** @class */ (function (_super) {
    __extends(LoadDocument, _super);
    function LoadDocument() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LoadDocument.prototype.prep = function (shared) {
        console.log("Preparing to load document...");
        return "dummy-file.txt";
    };
    LoadDocument.prototype.exec = function (filename) {
        console.log("Loading document ".concat(filename, "..."));
        return "This is a sample document text.";
    };
    LoadDocument.prototype.post = function (shared, filename, content) {
        console.log("Document loaded successfully");
        shared.rawText = content;
        return "success";
    };
    return LoadDocument;
}(pocketflow_1.RegularNode));
var AnalyzeDocument = /** @class */ (function (_super) {
    __extends(AnalyzeDocument, _super);
    function AnalyzeDocument() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AnalyzeDocument.prototype.prep = function (shared) {
        return shared.rawText;
    };
    AnalyzeDocument.prototype.exec = function (text) {
        var words = text.split(/\s+/).length;
        var sentiment = text.includes("sample") ? "neutral" : "negative";
        return { words: words, sentiment: sentiment };
    };
    AnalyzeDocument.prototype.post = function (shared, text, analysis) {
        shared.wordCount = analysis.words;
        shared.sentiment = analysis.sentiment;
        return "default";
    };
    return AnalyzeDocument;
}(pocketflow_1.RegularNode));
// Create and connect nodes
var loadDoc = new LoadDocument();
var analyzeDoc = new AnalyzeDocument();
// Connect with action
loadDoc.action("success").then(analyzeDoc);
// Create flow
var flow = new pocketflow_1.Flow(loadDoc);
// Run flow
var shared = {};
flow.run(shared);
console.log("Results:");
console.log("Word count:", shared.wordCount);
console.log("Sentiment:", shared.sentiment);
