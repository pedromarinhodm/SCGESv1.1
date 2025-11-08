@echo off
title Controle de Estoque - Inicialização
echo ===============================================
echo      INICIANDO SISTEMA DE CONTROLE DE ESTOQUE
echo ===============================================

:: -------------------- Caminhos --------------------
set MONGO_PATH=%cd%\mongodb\bin
set DB_PATH=%cd%\mongodb\data\db
set NODE_PATH=%cd%\backend
set FRONT_PATH=%cd%\frontend

:: -------------------- MongoDB ---------------------
echo.
echo [1/3] Iniciando MongoDB...
start "MongoDB" "%MONGO_PATH%\mongod.exe" --dbpath "%DB_PATH%" --port 27017

:: Aguarda MongoDB iniciar
echo Aguardando MongoDB inicializar...
timeout /t 10 >nul

:: -------------------- Servidor Node ----------------
echo.
echo [2/3] Iniciando servidor Node.js...
cd /d "%NODE_PATH%"
start "Servidor Node" cmd /k "node server.js"

:: Aguarda Node iniciar
timeout /t 5 >nul

:: -------------------- Frontend --------------------
echo.
echo [3/3] Abrindo o sistema no navegador...
cd /d "%FRONT_PATH%"
start "" "index.html"

echo.
echo Sistema iniciado com sucesso!
echo ===============================================
pause
