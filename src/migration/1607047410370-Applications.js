"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
exports.Applications1607047410370 = void 0;
var Applications1607047410370 = /** @class */ (function () {
    function Applications1607047410370() {
        this.name = 'Applications1607047410370';
    }
    Applications1607047410370.prototype.up = function (queryRunner) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.query("ALTER TABLE \"user\" DROP CONSTRAINT \"FK_1e89f1fd137dc7fea7242377e25\"")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"user\" RENAME COLUMN \"teamId\" TO \"applicationId\"")];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE TABLE \"application\" (\"id\" SERIAL NOT NULL, \"firstName\" character varying NOT NULL, \"lastName\" character varying NOT NULL, \"pronouns\" character varying NOT NULL, \"email\" character varying NOT NULL, \"levelOfStudy\" character varying NOT NULL, \"program\" character varying NOT NULL, \"shortAnswer1\" character varying NOT NULL, \"shortAnswer2\" character varying NOT NULL, \"shortAnswer3\" character varying NOT NULL, \"numHackathons\" integer NOT NULL, \"siteUrl\" character varying NOT NULL, \"resume\" bytea NOT NULL, CONSTRAINT \"PK_569e0c3e863ebdf5f2408ee1670\" PRIMARY KEY (\"id\"))")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("COMMENT ON COLUMN \"user\".\"applicationId\" IS NULL")];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"user\" ADD CONSTRAINT \"UQ_8eb0871eb31b4f559100a6e01a6\" UNIQUE (\"applicationId\")")];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"user\" ADD CONSTRAINT \"FK_8eb0871eb31b4f559100a6e01a6\" FOREIGN KEY (\"applicationId\") REFERENCES \"application\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION")];
                    case 6:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Applications1607047410370.prototype.down = function (queryRunner) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.query("ALTER TABLE \"user\" DROP CONSTRAINT \"FK_8eb0871eb31b4f559100a6e01a6\"")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"user\" DROP CONSTRAINT \"UQ_8eb0871eb31b4f559100a6e01a6\"")];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("COMMENT ON COLUMN \"user\".\"applicationId\" IS NULL")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"application\"")];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"user\" RENAME COLUMN \"applicationId\" TO \"teamId\"")];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"user\" ADD CONSTRAINT \"FK_1e89f1fd137dc7fea7242377e25\" FOREIGN KEY (\"teamId\") REFERENCES \"team\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION")];
                    case 6:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Applications1607047410370;
}());
exports.Applications1607047410370 = Applications1607047410370;
