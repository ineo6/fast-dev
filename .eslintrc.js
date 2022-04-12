module.exports = {
  extends: ["magic", "magic/react"],
  globals: {},
  rules: {
    "max-params": 0
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      extends: ["magic/typescript"],
      rules: {}
    }
  ]
};
