"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var express_1 = __importDefault(require("express"));
/**
 * Routes
 */
var ping_1 = __importDefault(require("./ping"));
var router = express_1.default.Router();
router.get('/', function (req, res) {
    res.send('Successful GET on /');
});
// Install routes as middleware here
router.use('/ping', ping_1.default);
module.exports = router;
//# sourceMappingURL=routes.js.map