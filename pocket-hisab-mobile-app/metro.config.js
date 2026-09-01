// ============================================================================
// metro.config.js
//
// Expo's default Metro config resolves packages via their "exports" field
// (unstable_enablePackageExports). The `firebase` JS SDK ships a
// React-Native-specific build behind that field, but Metro's exports
// resolution has a well-known conflict with it that causes
// "Component auth has not been registered yet" at runtime. Firebase's own
// docs recommend disabling package-exports resolution for Expo/Metro
// projects as the fix — this makes Metro fall back to the plain
// "react-native"/"main" fields instead, which resolve firebase/auth
// correctly.
// ============================================================================

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

module.exports = config;
