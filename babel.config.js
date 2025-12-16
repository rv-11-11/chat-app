module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo", "nativewind/babel"],
    plugins: [
      // Enables Expo Router transforms, including typed routes
      "expo-router/babel",
    ],
  };
};
