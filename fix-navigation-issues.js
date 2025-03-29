// 1. Delete node_modules folder and clear cache
// Run these commands in your terminal:
// rm -rf node_modules
// yarn cache clean
// npm cache clean --force

// 2. Update your package.json to ensure consistent React Navigation versions
// All @react-navigation/* packages should use the same major version (either all v6 or all v7)

// 3. For React Navigation v6 (recommended for stability):
// "dependencies": {
//   "@react-navigation/bottom-tabs": "^6.5.8",
//   "@react-navigation/native": "^6.1.7",
//   "@react-navigation/native-stack": "^6.9.13",
//   "@react-navigation/stack": "^6.3.17",
//   ... other dependencies
// }

// 4. Re-install dependencies
// yarn install
// or
// npm install
