@echo off
echo =========================================
echo    Starting DMS Microservices Pipeline
echo =========================================

:: 1. Start Docker Infrastructure (PostgreSQL & Kafka)
echo [1/3] Waking up PostgreSQL and Kafka...
start "DMS Infrastructure" cmd /c "cd /d "C:\DMS with VC" && docker-compose up -d && echo Docker containers are running! && pause"

:: Wait 5 seconds to give Kafka and Postgres time to fully boot up
timeout /t 5 /nobreak > nul

:: 2. Start Java Spring Boot Backend (WITH DEVOPS OVERRIDE)
echo [2/3] Starting Spring Boot API...
start "Spring Boot API" cmd /k "set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot" && cd /d "C:\DMS with VC\dms-core-service" && .\mvnw spring-boot:run"

:: Wait 3 seconds to let Java claim port 8080
timeout /t 3 /nobreak > nul

:: 3. Start React Frontend
echo [3/3] Starting React UI...
start "React UI" cmd /k "cd /d "C:\DMS with VC\dms-frontend" && npm run dev"

echo =========================================
echo  All core services launched! Happy Coding!
echo =========================================
pause