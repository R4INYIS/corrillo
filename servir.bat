@echo off
rem Sirve Corrillo en la red local para abrirlo desde el movil (misma wifi).
cd /d "%~dp0"
echo.
echo  Corrillo se esta sirviendo. En el movil, abre:  http://IP-DE-ESTE-PC:8000
echo  Tus direcciones IP:
ipconfig | findstr /i "IPv4"
echo.
echo  Cierra esta ventana para parar el servidor.
python -m http.server 8000
pause
