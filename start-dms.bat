@echo off
echo =========================================
echo    Starting DMS Microservices Pipeline
echo =========================================

:: 1. Start Docker Infrastructure (Database & Kafka)
echo [1/5] Waking up PostgreSQL and Kafka...
start "DMS Infrastructure" cmd /c "cd /d "C:\DMS with VC" && docker-compose up -d && echo Docker containers are running! && pause"

:: Wait 5 seconds to give Kafka time to boot up before the APIs try to connect
timeout /t 5 /nobreak > nul

:: 2. Start AI Engine (Ollama)
echo [2/5] Waking up TinyLlama AI...
start "Ollama AI Brain" cmd /k "ollama run tinyllama"

:: 3. Start Java Spring Boot Backend
echo [3/5] Starting Spring Boot API...
start "Spring Boot API" cmd /k "cd /d "C:\DMS with VC\dms-core-service" && .\mvnw spring-boot:run"

:: 4. Start Python LLM Service
echo [4/5] Starting Python AI Service...
start "Python AI Service" cmd /k "cd /d "C:\DMS with VC\dms-llm-service" && call .\venv\Scripts\activate.bat && python main.py"

:: 5. Start React Frontend
echo [5/5] Starting React UI...
start "React UI" cmd /k "cd /d "C:\DMS with VC\dms-frontend" && npm run dev"

echo =========================================
echo  All services launched! Happy Coding!
echo =========================================
pause