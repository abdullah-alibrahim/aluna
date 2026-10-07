const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname, { 
  // Add your project root to the watch folders if needed
  watchFolders: [__dirname], 
});

module.exports = withNativeWind(config, { input: './global.css' });