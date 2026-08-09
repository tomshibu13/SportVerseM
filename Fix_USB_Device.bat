@echo off
:: Batch script to fix "USB Device Not Recognized" (Code 43)
echo ================================================
echo           USB DEVICE RECOVERY TOOL             
echo ================================================
echo.
echo [1/3] Removing malfunctioning USB device instances...
pnputil /remove-device "USB\VID_0000&PID_0002\5&2DC4D53B&0&1" /force
pnputil /remove-device "USB\VID_0000&PID_0002\5&2DC4D53B&0&2" /force
pnputil /remove-device "USB\VID_0000&PID_0002\5&2DC4D53B&0&3" /force

echo.
echo [2/3] Resetting USB 3.0 Root Hub controller...
pnputil /restart-device "USB\ROOT_HUB30\4&30F4CC59&0&0"

echo.
echo [3/3] Rescanning hardware for re-enumeration...
pnputil /scan-devices

echo.
echo ================================================
echo USB Reset Process Complete!
echo Please unplug and re-plug your USB device now.
echo ================================================
echo.
pause
