const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Adăugăm extensia .cjs pentru a fi recunoscută de Metro
config.resolver.sourceExts.push('cjs');

// Dezactivăm expunerea exporturilor pachetelor (dacă este necesar pentru proiectul tău)
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
