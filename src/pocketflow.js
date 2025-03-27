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
exports.ParallelBatchFlow = exports.BatchFlow = exports.Flow = exports.AsyncParallelBatchNode = exports.AsyncBatchNode = exports.AsyncNode = exports.BaseNode = void 0;
// Base Node class with generic types - all methods are async by default
var BaseNode = /** @class */ (function () {
    function BaseNode() {
        this.params = {};
        this.successors = new Map();
    }
    BaseNode.prototype.setParams = function (params) {
        this.params = params;
        return this;
    };
    /**
     * Add a successor node with an optional action
     * @param node The next node in the flow
     * @param action Optional action name (defaults to "default")
     */
    BaseNode.prototype.next = function (node, action) {
        if (action === void 0) { action = "default"; }
        if (this.successors.has(action)) {
            console.warn("Overwriting successor for action '".concat(action, "'"));
        }
        this.successors.set(action, node);
        return node; // Return the next node to allow chaining
    };
    BaseNode.prototype.prep = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, undefined];
            });
        });
    };
    BaseNode.prototype.exec = function (prepRes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, undefined];
            });
        });
    };
    BaseNode.prototype.post = function (shared, prepRes, execRes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, undefined];
            });
        });
    };
    BaseNode.prototype._exec = function (prepRes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.exec(prepRes)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BaseNode.prototype._run = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            var p, e;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prep(shared)];
                    case 1:
                        p = _a.sent();
                        return [4 /*yield*/, this._exec(p)];
                    case 2:
                        e = _a.sent();
                        return [4 /*yield*/, this.post(shared, p, e)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BaseNode.prototype.run = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.successors.size > 0) {
                            console.warn("Node won't run successors. Use Flow.");
                        }
                        return [4 /*yield*/, this._run(shared)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return BaseNode;
}());
exports.BaseNode = BaseNode;
// AsyncNode with retry capability (renamed from Node to avoid conflicts)
var AsyncNode = /** @class */ (function (_super) {
    __extends(AsyncNode, _super);
    function AsyncNode(maxRetries, wait) {
        if (maxRetries === void 0) { maxRetries = 1; }
        if (wait === void 0) { wait = 0; }
        var _this = _super.call(this) || this;
        _this.currentRetry = 0;
        _this.maxRetries = maxRetries;
        _this.wait = wait;
        return _this;
    }
    AsyncNode.prototype.execFallback = function (prepRes, error) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw error;
            });
        });
    };
    AsyncNode.prototype._exec = function (prepRes) {
        return __awaiter(this, void 0, void 0, function () {
            var e_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.currentRetry = 0;
                        _a.label = 1;
                    case 1:
                        if (!(this.currentRetry < this.maxRetries)) return [3 /*break*/, 10];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 9]);
                        return [4 /*yield*/, this.exec(prepRes)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        e_1 = _a.sent();
                        if (!(this.currentRetry === this.maxRetries - 1)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.execFallback(prepRes, e_1)];
                    case 5: return [2 /*return*/, _a.sent()];
                    case 6:
                        if (!(this.wait > 0)) return [3 /*break*/, 8];
                        // Proper asynchronous sleep
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, _this.wait * 1000); })];
                    case 7:
                        // Proper asynchronous sleep
                        _a.sent();
                        _a.label = 8;
                    case 8: return [3 /*break*/, 9];
                    case 9:
                        this.currentRetry++;
                        return [3 /*break*/, 1];
                    case 10: return [2 /*return*/, undefined]; // Should never reach here, but needed for TypeScript
                }
            });
        });
    };
    return AsyncNode;
}(BaseNode));
exports.AsyncNode = AsyncNode;
// AsyncBatchNode for handling iterable inputs sequentially
var AsyncBatchNode = /** @class */ (function (_super) {
    __extends(AsyncBatchNode, _super);
    function AsyncBatchNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AsyncBatchNode.prototype._exec = function (items) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, items_1, item, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!items || !Array.isArray(items))
                            return [2 /*return*/, []];
                        results = [];
                        _i = 0, items_1 = items;
                        _c.label = 1;
                    case 1:
                        if (!(_i < items_1.length)) return [3 /*break*/, 4];
                        item = items_1[_i];
                        _b = (_a = results).push;
                        return [4 /*yield*/, _super.prototype._exec.call(this, item)];
                    case 2:
                        _b.apply(_a, [_c.sent()]);
                        _c.label = 3;
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
// AsyncParallelBatchNode for handling iterable inputs in parallel
var AsyncParallelBatchNode = /** @class */ (function (_super) {
    __extends(AsyncParallelBatchNode, _super);
    function AsyncParallelBatchNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AsyncParallelBatchNode.prototype._exec = function (items) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!items || !Array.isArray(items))
                    return [2 /*return*/, []];
                return [2 /*return*/, Promise.all(items.map(function (item) { return _super.prototype._exec.call(_this, item); }))];
            });
        });
    };
    return AsyncParallelBatchNode;
}(AsyncNode));
exports.AsyncParallelBatchNode = AsyncParallelBatchNode;
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
        return __awaiter(this, void 0, void 0, function () {
            var current, p, action;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        current = this.cloneNode(this.start);
                        p = params || this.params;
                        _a.label = 1;
                    case 1:
                        if (!current) return [3 /*break*/, 3];
                        current.setParams(p);
                        return [4 /*yield*/, current._run(shared)];
                    case 2:
                        action = _a.sent();
                        current = this.getNextNode(current, action);
                        if (current) {
                            current = this.cloneNode(current);
                        }
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Flow.prototype._run = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            var pr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prep(shared)];
                    case 1:
                        pr = _a.sent();
                        return [4 /*yield*/, this._orchestrate(shared)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.post(shared, pr, undefined)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Flow.prototype.exec = function (prepRes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Flow can't exec.");
            });
        });
    };
    // Helper method to clone nodes
    Flow.prototype.cloneNode = function (node) {
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
var BatchFlow = /** @class */ (function (_super) {
    __extends(BatchFlow, _super);
    function BatchFlow() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BatchFlow.prototype._run = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            var batchParams, _i, batchParams_1, bp, mergedParams;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prep(shared)];
                    case 1:
                        batchParams = (_a.sent()) || [];
                        _i = 0, batchParams_1 = batchParams;
                        _a.label = 2;
                    case 2:
                        if (!(_i < batchParams_1.length)) return [3 /*break*/, 5];
                        bp = batchParams_1[_i];
                        mergedParams = __assign(__assign({}, this.params), bp);
                        return [4 /*yield*/, this._orchestrate(shared, mergedParams)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [4 /*yield*/, this.post(shared, batchParams, undefined)];
                    case 6: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return BatchFlow;
}(Flow));
exports.BatchFlow = BatchFlow;
// ParallelBatchFlow for running flows with different parameters in parallel
var ParallelBatchFlow = /** @class */ (function (_super) {
    __extends(ParallelBatchFlow, _super);
    function ParallelBatchFlow() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ParallelBatchFlow.prototype._run = function (shared) {
        return __awaiter(this, void 0, void 0, function () {
            var batchParams;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prep(shared)];
                    case 1:
                        batchParams = (_a.sent()) || [];
                        // Run all orchestrations in parallel
                        return [4 /*yield*/, Promise.all(batchParams.map(function (bp) {
                                // Merge flow params with batch params
                                var mergedParams = __assign(__assign({}, _this.params), bp);
                                return _this._orchestrate(shared, mergedParams);
                            }))];
                    case 2:
                        // Run all orchestrations in parallel
                        _a.sent();
                        return [4 /*yield*/, this.post(shared, batchParams, undefined)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return ParallelBatchFlow;
}(Flow));
exports.ParallelBatchFlow = ParallelBatchFlow;
