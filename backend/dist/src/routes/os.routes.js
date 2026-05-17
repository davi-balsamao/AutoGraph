"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const os_controller_1 = require("../controllers/os.controller");
const upload_middleware_1 = require("../middleware/upload.middleware");
const osRoutes = (0, express_1.Router)();
// Criar nova OS com upload de arte opcional
osRoutes.post('/', upload_middleware_1.uploadMiddleware.single('arte'), os_controller_1.osController.create);
// Listar todas as OS
osRoutes.get('/', os_controller_1.osController.list);
// Histórico de mensagens de uma OS específica
osRoutes.get('/:id/mensagens', os_controller_1.osController.getMensagensDaOs);
// Atualizar status de uma OS
osRoutes.patch('/:id/status', os_controller_1.osController.updateStatus);
// Atualizar dados variados (observacoes, especificacoes)
osRoutes.patch('/:id', os_controller_1.osController.updateData);
// Timer de produção
osRoutes.patch('/:id/timer/start', os_controller_1.osController.startTimer);
osRoutes.patch('/:id/timer/stop', os_controller_1.osController.stopTimer);
exports.default = osRoutes;
