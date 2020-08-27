"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var morgan_1 = __importDefault(require("morgan"));
var routes_1 = __importDefault(require("./routes/routes"));
/**
 * Constants
 */
var PORT = 8080;
var API_ROOT = '/api';
var app = express_1.default();
/**
 * Middleware
 */
app.use(express_1.default.json({ limit: '50mb' }));
app.use(morgan_1.default('tiny'));
app.use(API_ROOT, routes_1.default);
app.listen(PORT, function () {
    console.log('Server listening on port ' + PORT + ' using HTTPS on ' + API_ROOT);
});
//# sourceMappingURL=server.js.map