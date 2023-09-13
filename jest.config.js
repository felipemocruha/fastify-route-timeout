module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleDirectories: ["node_modules"],
  watchPathIgnorePatterns: ["dist", "node_modules"],
  coveragePathIgnorePatterns: ["<rootDir>/node_modules"],
};
