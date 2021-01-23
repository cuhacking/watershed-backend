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
exports.Invites21606847060271 = void 0;
var Invites21606847060271 = /** @class */ (function () {
    function Invites21606847060271() {
        this.name = 'Invites21606847060271';
    }
    Invites21606847060271.prototype.up = function (queryRunner) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.query("CREATE TABLE \"team_invite\" (\"id\" SERIAL NOT NULL, \"uuid\" character varying NOT NULL, \"teamId\" integer, \"userId\" integer, CONSTRAINT \"PK_deb3080b1edfad7d043d6db876e\" PRIMARY KEY (\"id\"))")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("CREATE TABLE \"team\" (\"id\" SERIAL NOT NULL, \"uuid\" character varying NOT NULL, \"name\" character varying NOT NULL, CONSTRAINT \"PK_f57d8293406df4af348402e4b74\" PRIMARY KEY (\"id\"))")];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"user\" ADD \"teamId\" integer")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"team_invite\" ADD CONSTRAINT \"FK_dec64033827ee287d0863a1b180\" FOREIGN KEY (\"teamId\") REFERENCES \"team\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION")];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"team_invite\" ADD CONSTRAINT \"FK_e937588d930a6b5fd66958b75f5\" FOREIGN KEY (\"userId\") REFERENCES \"user\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION")];
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
    Invites21606847060271.prototype.down = function (queryRunner) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.query("ALTER TABLE \"user\" DROP CONSTRAINT \"FK_1e89f1fd137dc7fea7242377e25\"")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"team_invite\" DROP CONSTRAINT \"FK_e937588d930a6b5fd66958b75f5\"")];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"team_invite\" DROP CONSTRAINT \"FK_dec64033827ee287d0863a1b180\"")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("ALTER TABLE \"user\" DROP COLUMN \"teamId\"")];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"team\"")];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("DROP TABLE \"team_invite\"")];
                    case 6:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Invites21606847060271;
}());
exports.Invites21606847060271 = Invites21606847060271;
