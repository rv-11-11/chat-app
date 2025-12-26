export const getEnv = (key: string, defaultValue: string = "") => {
  const val = process.env[key] ?? defaultValue;
  if (!val && process.env.NODE_ENV === "production") {
    throw new Error("Missing env variable: " + key);
  }
  return val;
};
