module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2020: true,
  },
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'script',
  },
  ignorePatterns: [
    'node_modules/',
    'public/assets/js/materialize.js',
    'public/assets/js/materialize.min.js',
    '*.min.js',
  ],
  rules: {
    eqeqeq: 'warn',
    curly: 'warn',
  },
};
