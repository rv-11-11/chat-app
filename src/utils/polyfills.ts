// Conditionally load URL polyfill only when running in a browser (window present)
if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
  // Load polyfill to provide URL in React Native web runtime
  // Use require to avoid static bundling into Node contexts
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const poly = require('react-native-url-polyfill/auto');
  // poly is loaded for its side effects
}

export {};
