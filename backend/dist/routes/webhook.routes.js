"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhook_controller_1 = require("../controllers/webhook.controller");
const router = (0, express_1.Router)();
// Rota GET para validação do webhook (handshake Meta) — Card 5
router.get('/webhook', webhook_controller_1.WebhookController.validate);
// Rota POST para recepção de mensagens — Card 6
router.post('/webhook', webhook_controller_1.WebhookController.receive);
exports.default = router;
