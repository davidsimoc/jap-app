# Setează variabilele de mediu pentru a forța IP-ul corect
$env:EXPO_DEV_SERVER_HOST="192.168.0.126"
$env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.0.126"

# $env:EXPO_DEV_SERVER_HOST="172.20.10.2"
# $env:REACT_NATIVE_PACKAGER_HOSTNAME="172.20.10.2"

# Curăță cache-ul Expo
npx expo start --clear
