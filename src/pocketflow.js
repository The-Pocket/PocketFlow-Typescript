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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.AsyncParallelBatchFlow = exports.AsyncBatchFlow = exports.AsyncFlow = exports.AsyncParallelBatchNode = exports.AsyncBatchNode = exports.AsyncNode = exports.BatchFlow = exports.Flow = exports.BatchNode = exports.Node = exports.BaseNode = void 0;
// Base Node class with generic types - S (shared) first, P (params) second
var BaseNode = /** @class */ (function () {
    function BaseNode() {
        this.params = {};
        this.successors = new Map();
    }
    BaseNode.prototype.setParams = function (params) {
        this.params = params;
    };
    BaseNode.prototype.addSuccessor = function (node, action) {
        if (action === void 0) { action = "default"; }
        if (this.successors.has(action)) {
            console.warn("Overwriting successor for action '".concat(action, "'"));
        }
        this.successors.set(action, node);
        return node;
    };
    BaseNode.prototype.prep = function (shared) {
        return undefined;
    };
    BaseNode.prototype.exec = function (prepRes) {
        return undefined;
    };
    BaseNode.prototype.post = function (shared, prepRes, execRes) {
        return undefined;
    };
    BaseNode.prototype._exec = function (prepRes) {
        return this.exec(prepRes);
    };
    BaseNode.prototype._run = function (shared) {
        var p = this.prep(shared);
        var e = this._exec(p);
        return this.post(shared, p, e);
    };
    BaseNode.prototype.run = function (shared) {
        if (this.successors.size > 0) {
            console.warn("Node won't run successors. Use Flow.");
        }
        return this._run(shared);
    };
    // Operator overloading equivalent
    BaseNode.prototype.then = function (node) {
        return this.addSuccessor(node);
    };
    BaseNode.prototype.action = function (actionName) {
        if (typeof actionName === 'string') {
            return new ConditionalTransition(this, actionName);
        }
        throw new TypeError("Action must be a string");
    };
    return BaseNode;
}());
exports.BaseNode = BaseNode;
// Helper class for conditional transitions
var ConditionalTransition = /** @class */ (function () {
    function ConditionalTransition(src, action) {
        this.src = src;
        this.action = action;
    }
    ConditionalTransition.prototype.then = function (target) {
        return this.src.addSuccessor(target, this.action);
    };
    return ConditionalTransition;
}());
// Regular Node with retry capability
var Node = /** @class */ (function (_super) {
    __extends(Node, _super);
    function Node(maxRetries, wait) {
        if (maxRetries === void 0) { maxRetries = 1; }
        if (wait === void 0) { wait = 0; }
        var _this = _super.call(this) || this;
        _this.currentRetry = 0;
        _this.maxRetries = maxRetries;
        _this.wait = wait;
        return _this;
    }
    Node.prototype.execFallback = function (prepRes, error) {
        throw error;
    };
    Node.prototype._exec = function (prepRes) {
        for (this.currentRetry = 0; this.currentRetry < this.maxRetries; this.currentRetry++) {
            try {
                return this.exec(prepRes);
            }
            catch (e) {
                if (this.currentRetry === this.maxRetries - 1) {
                    return this.execFallback(prepRes, e);
                }
                if (this.wait > 0) {
                    // In JavaScript, we can't block like in Python, but for simplicity
                    // I'm using a sync sleep - in real code use async/await
                    var now = Date.now();
                    while (Date.now() - now < this.wait * 1000) {
                        // busy wait
                    }
                }
            }
        }
    };
    return Node;
}(BaseNode));
exports.Node = Node;
// BatchNode for handling iterable inputs
var BatchNode = /** @class */ (function (_super) {
    __extends(BatchNode, _super);
    function BatchNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BatchNode.prototype._exec = function (items) {
        var _this = this;
        return (items || []).map(function (item) { return _super.prototype._exec.call(_this, item); });
    };
    return BatchNode;
}(Node));
exports.BatchNode = BatchNode;
// Flow for orchestrating nodes
var Flow = /** @class */ (function (_super) {
    __extends(Flow, _super);
    function Flow(start) {
        var _this = _super.call(this) || this;
        _this.start = start;
        return _this;
    }
    Flow.prototype.getNextNode = function (current, action) {
        var nextAction = action || "default";
        var next = current.successors.get(nextAction);
        if (!next && current.successors.size > 0) {
            console.warn("Flow ends: '".concat(nextAction, "' not found in [").concat(Array.from(current.successors.keys()), "]"));
        }
        return next;
    };
    Flow.prototype._orchestrate = function (shared, params) {
        var current = this.cloneNode(this.start);
        var p = params || this.params;
        while (current) {
            current.setParams(p);
            var action = current._run(shared);
            current = this.getNextNode(current, action);
            if (current) {
                current = this.cloneNode(current);
            }
        }
    };
    Flow.prototype._run = function (shared) {
        var pr = this.prep(shared);
        this._orchestrate(shared);
        return this.post(shared, pr, undefined);
    };
    Flow.prototype.exec = function (prepRes) {
        throw new Error("Flow can't exec.");
    };
    // Helper method to clone nodes
    Flow.prototype.cloneNode = function (node) {
        // In TypeScript, we can't easily deep clone objects with methods
        // This is a simplified approach - in a real implementation, you would need
        // a more sophisticated cloning strategy
        var clonedNode = Object.create(Object.getPrototypeOf(node));
        Object.assign(clonedNode, node);
        clonedNode.params = __assign({}, node.params);
        clonedNode.successors = new Map(node.successors);
        return clonedNode;
    };
    return Flow;
}(BaseNode));
exports.Flow = Flow;
// BatchFlow for running flows with different parameters
// Using P for batch item type and defining params as P
var BatchFlow = /** @class */ (function (_super) {
    __extends(BatchFlow, _super);
    function BatchFlow() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BatchFlow.prototype._run = function (shared) {
        // In BatchFlow, prep() should return an array of parameter objects
        var batchParams = this.prep(shared) || [];
        for (var _i = 0, batchParams_1 = batchParams; _i < batchParams_1.length; _i++) {
            var bp = batchParams_1[_i];
            // Merge flow params with batch params, matching Python's {**self.params, **bp}
            var mergedParams = __assign(__assign({}, this.params), bp);
            this._orchestrate(shared, mergedParams);
        }
        return this.post(shared, batchParams, undefined);
    };
    return BatchFlow;
}(Flow));
exports.BatchFlow = BatchFlow;
// AsyncNode for asynchronous operations
var AsyncNode = /** @class */ (function (_super) {
    __extends(AsyncNode, _super);
    function AsyncNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AsyncNode.prototype.prep = function (shared) {
        throw new Error("Use prepAsync.");
    };
    AsyncNode.prototype.exec = function (prepRes) {
        throw new Error("Use execAsync.");
    };
    AsyncNode.prototype.post = function (shared, prepRes, execRes) {
        throw new Error("Use postAsync.");
    };
    AsyncNode.prototype.execFallback = function (prepRes, error) {
        throw new Error("Use execFallbackAsync.");
    };
    AsyncNode.prototype._run = function (shared) {
        throw new Error("Use runAsync.");
    };
    AsyncNode.prototype.prepAsync = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, undefined];
            });
        });
    };
    AsyncNode.prototype.execAsync = function (prepRes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, undefined];
            });
        });
    };
    AsyncNode.prototype.execFallbackAsync = function (prepRes, error) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw error;
            });
        });
    };
    AsyncNode.prototype.postAsync = function (shared, prepRes, execRes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, undefined];
            });
        });
    };
    AsyncNode.prototype._execAsync = function (prepRes) {
        return __awaiter(this, void 0, void 0, function () {
            var i, e_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < this.maxRetries)) return [3 /*break*/, 10];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 9]);
                        return [4 /*yield*/, this.execAsync(prepRes)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        e_1 = _a.sent();
                        if (!(i === this.maxRetries - 1)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.execFallbackAsync(prepRes, e_1)];
                    case 5: return [2 /*return*/, _a.sent()];
                    case 6:
                        if (!(this.wait > 0)) return [3 /*break*/, 8];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, _this.wait * 1000); })];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [3 /*break*/, 9];
                    case 9:
                        i++;
                        return [3 /*break*/, 1];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    AsyncNode.prototype.runAsync = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.successors.size > 0) {
                            console.warn("Node won't run successors. Use AsyncFlow.");
                        }
                        return [4 /*yield*/, this._runAsync(shared)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AsyncNode.prototype._runAsync = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            var p, e;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prepAsync(shared)];
                    case 1:
                        p = _a.sent();
                        return [4 /*yield*/, this._execAsync(p)];
                    case 2:
                        e = _a.sent();
                        return [4 /*yield*/, this.postAsync(shared, p, e)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return AsyncNode;
}(Node));
exports.AsyncNode = AsyncNode;
// AsyncBatchNode for batch processing with async operations
var AsyncBatchNode = /** @class */ (function (_super) {
    __extends(AsyncBatchNode, _super);
    function AsyncBatchNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AsyncBatchNode.prototype._execAsync = function (items) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, _a, item, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        results = [];
                        _i = 0, _a = items || [];
                        _d.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        item = _a[_i];
                        _c = (_b = results).push;
                        return [4 /*yield*/, _super.prototype._execAsync.call(this, item)];
                    case 2:
                        _c.apply(_b, [_d.sent()]);
                        _d.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    return AsyncBatchNode;
}(AsyncNode));
exports.AsyncBatchNode = AsyncBatchNode;
// AsyncParallelBatchNode for parallel batch processing
var AsyncParallelBatchNode = /** @class */ (function (_super) {
    __extends(AsyncParallelBatchNode, _super);
    function AsyncParallelBatchNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AsyncParallelBatchNode.prototype._execAsync = function (items) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all((items || []).map(function (item) { return _super.prototype._execAsync.call(_this, item); }))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return AsyncParallelBatchNode;
}(AsyncNode));
exports.AsyncParallelBatchNode = AsyncParallelBatchNode;
// AsyncFlow for orchestrating async nodes
var AsyncFlow = /** @class */ (function (_super) {
    __extends(AsyncFlow, _super);
    function AsyncFlow(start) {
        var _this = _super.call(this) || this;
        _this.start = start;
        return _this;
    }
    AsyncFlow.prototype.getNextNode = function (current, action) {
        var nextAction = action || "default";
        var next = current.successors.get(nextAction);
        if (!next && current.successors.size > 0) {
            console.warn("Flow ends: '".concat(nextAction, "' not found in [").concat(Array.from(current.successors.keys()), "]"));
        }
        return next;
    };
    AsyncFlow.prototype._orchestrateAsync = function (shared, params) {
        return __awaiter(this, void 0, void 0, function () {
            var current, p, action;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        current = this.cloneNode(this.start);
                        p = params || this.params;
                        _a.label = 1;
                    case 1:
                        if (!current) return [3 /*break*/, 5];
                        current.setParams(p);
                        action = void 0;
                        if (!(current instanceof AsyncNode)) return [3 /*break*/, 3];
                        return [4 /*yield*/, current._runAsync(shared)];
                    case 2:
                        action = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        action = current._run(shared);
                        _a.label = 4;
                    case 4:
                        current = this.getNextNode(current, action);
                        if (current) {
                            current = this.cloneNode(current);
                        }
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    AsyncFlow.prototype._runAsync = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            var p;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prepAsync(shared)];
                    case 1:
                        p = _a.sent();
                        return [4 /*yield*/, this._orchestrateAsync(shared)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.postAsync(shared, p, undefined)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Helper method to clone nodes
    AsyncFlow.prototype.cloneNode = function (node) {
        var clonedNode = Object.create(Object.getPrototypeOf(node));
        Object.assign(clonedNode, node);
        clonedNode.params = __assign({}, node.params);
        clonedNode.successors = new Map(node.successors);
        return clonedNode;
    };
    return AsyncFlow;
}(AsyncNode));
exports.AsyncFlow = AsyncFlow;
// AsyncBatchFlow for running async flows with different parameters
var AsyncBatchFlow = /** @class */ (function (_super) {
    __extends(AsyncBatchFlow, _super);
    function AsyncBatchFlow() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AsyncBatchFlow.prototype._runAsync = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            var batchParams, _i, batchParams_2, bp, mergedParams;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prepAsync(shared)];
                    case 1:
                        batchParams = (_a.sent()) || [];
                        _i = 0, batchParams_2 = batchParams;
                        _a.label = 2;
                    case 2:
                        if (!(_i < batchParams_2.length)) return [3 /*break*/, 5];
                        bp = batchParams_2[_i];
                        mergedParams = __assign(__assign({}, this.params), bp);
                        return [4 /*yield*/, this._orchestrateAsync(shared, mergedParams)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [4 /*yield*/, this.postAsync(shared, batchParams, undefined)];
                    case 6: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return AsyncBatchFlow;
}(AsyncFlow));
exports.AsyncBatchFlow = AsyncBatchFlow;
// AsyncParallelBatchFlow for running async flows in parallel
var AsyncParallelBatchFlow = /** @class */ (function (_super) {
    __extends(AsyncParallelBatchFlow, _super);
    function AsyncParallelBatchFlow() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AsyncParallelBatchFlow.prototype._runAsync = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            var batchParams;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prepAsync(shared)];
                    case 1:
                        batchParams = (_a.sent()) || [];
                        // Run all batch parameters in parallel
                        return [4 /*yield*/, Promise.all(batchParams.map(function (bp) {
                                // Merge flow params with batch params
                                var mergedParams = __assign(__assign({}, _this.params), bp);
                                return _this._orchestrateAsync(shared, mergedParams);
                            }))];
                    case 2:
                        // Run all batch parameters in parallel
                        _a.sent();
                        return [4 /*yield*/, this.postAsync(shared, batchParams, undefined)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return AsyncParallelBatchFlow;
}(AsyncFlow));
exports.AsyncParallelBatchFlow = AsyncParallelBatchFlow;
