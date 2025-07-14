const tsJest = require("ts-jest");

const tsJestTransformCfg = tsJest.createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
};