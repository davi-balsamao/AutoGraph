const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  // Mantém defaults do Jest aqui — quem decide o que rodar são os scripts
  // em package.json (npm test ignora fluxos via CLI; npm run test:fluxos roda só fluxos).
};