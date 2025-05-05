# Setează variabilele de mediu pentru a forța IP-ul corect
$env:EXPO_DEV_SERVER_HOST="192.168.0.103"
$env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.0.103"

# Curăță cache-ul Expo
npx expo start --lan --clear
