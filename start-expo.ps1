# Setează variabilele de mediu pentru a forța IP-ul corect
$env:EXPO_DEV_SERVER_HOST="192.168.0.100"
$env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.0.100"

#$env:EXPO_DEV_SERVER_HOST="172.20.10.4"
#$env:REACT_NATIVE_PACKAGER_HOSTNAME="172.20.10.4"

# Curăță cache-ul Expo
npx expo start --clear
