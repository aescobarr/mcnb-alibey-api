import mochaPlugin from 'eslint-plugin-mocha';
import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {
    files: ["**/*.js"], languageOptions: {sourceType: "commonjs"}
  },
  {
    languageOptions: { globals: globals.node }
  },
  pluginJs.configs.recommended,
  mochaPlugin.configs.flat.recommended,
];