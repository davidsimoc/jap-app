$localIp = (ipconfig getifaddr en0)

if (-not $localIp) { $localIp = (ipconfig getifaddr en1) }

$env:EXPO_DEV_SERVER_HOST = $localIp
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $localIp

Write-Host "Pornire Expo pe IP WELL: $localIp" -ForegroundColor Cyan

npx expo start --clear