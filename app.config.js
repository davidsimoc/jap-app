export default {
  expo: {
    name: "Nihongo Master",
    slug: "frontend",
    version: "1.0.0",
    owner: "davidsimoc",
    orientation: "portrait",
    icon: "./assets/images/icon_light.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    ios: {
      bundleIdentifier: "com.davidsimoc.nihongomaster",
      googleServicesFile: "./GoogleService-Info.plist",
      supportsTablet: true,
      userInterfaceStyle: "dark",
      icon: "./assets/images/icon_light.png",
      darkIcon: "./assets/images/icon_dark.png",
      tintedIcon: "./assets/images/icon_tinted.png",
      infoPlist: {
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              "com.googleusercontent.apps.1006721640718-on3hqtjo85i403ddeuk7g2fvdd7vpl5v"
            ]
          }
        ]
      }
    },
    android: {
      "package": "com.davidsimoc.nihongomaster",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
        // userInterfaceStyle: "dark",
      },
      softwareKeyboardLayoutMode: "pan",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-av",
      [
        "react-native-vision-camera",
        {
          "cameraPermissionText": "Allow Nihongo Master to access your camera for Live AR translation of Japanese text.",
          "enableMicrophonePermission": false
        }
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.1006721640718-on3hqtjo85i403ddeuk7g2fvdd7vpl5v"
        }
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,

      eas: {
        projectId: "f3b6bc3d-f9e4-46ca-b9c2-15d4dd34d558"
      }
    },
  },
};
