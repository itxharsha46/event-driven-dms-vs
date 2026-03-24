# 🚀 Event-Driven AI Document Management System

![Architecture](https://img.shields.io/badge/Architecture-Event--Driven_Microservices-blue)
![Frontend](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react&logoColor=black)
![Backend](https://img.shields.io/badge/Backend-Java_Spring_Boot-6DB33F?logo=spring&logoColor=white)
![Message Broker](https://img.shields.io/badge/Event_Bus-Apache_Kafka-231F20?logo=apachekafka&logoColor=white)
![AI Engine](https://img.shields.io/badge/AI-Python_&_TinyLlama-3776AB?logo=python&logoColor=white)
![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)

An enterprise-grade, multi-service document workspace featuring Git-style version control and asynchronous AI summarization. 

This project demonstrates a fully distributed architecture where decoupled applications communicate entirely through an event broker, ensuring high scalability and real-time data processing without blocking the main application thread.

## ✨ Key Features

* **Git-Style Version Control:** Documents are never overwritten. Every edit is saved as an immutable event in PostgreSQL, allowing users to track the complete chronological history and total commit count of any document.
* **Asynchronous AI Summarization:** When a human updates a document, a Kafka event triggers a decoupled Python microservice. This service uses LangChain and a localized LLM (TinyLlama via Ollama) to generate a contextual summary and independently commits it back to the event store.
* **Event-Driven Architecture:** The Spring Boot backend acts as a publisher, broadcasting document changes to Apache Kafka. This decouples the heavy AI processing from the user-facing API.
* **Real-Time Collaboration Ready:** Dynamic author tracking allows multiple users to edit and append to the same document ledger.
* **Format Exporting:** Built-in Java Apache POI integration allows users to compile the document history and export it directly as a fully formatted Microsoft Word (`.docx`) file.

## 🏗️ System Architecture

The system is composed of four distinct layers running concurrently:

1. **Client Layer (React):** A responsive UI for editing text and viewing the live event ledger.
2. **Core API (Spring Boot):** The central nervous system. It handles REST requests, interacts with the database, and publishes events to the message broker.
3. **Event Bus & Storage (Docker):** PostgreSQL serves as the persistent event store, while Apache Kafka handles the high-throughput message queuing.
4. **AI Processor (Python):** An isolated consumer service that listens to the Kafka topic, processes text through a local LLM, and sends HTTP callbacks to the Core API.

### The Data Flow:
`React UI` ➡️ `Spring Boot API` ➡️ `PostgreSQL (Saved)` ➡️ `Kafka Topic (Published)` ➡️ `Python Service (Consumed)` ➡️ `Local LLM (Inference)` ➡️ `Spring Boot API (Callback)` ➡️ `React UI (Updated)`

## 🚀 Getting Started (Local Development)

### Prerequisites
* Docker Desktop (for Postgres & Kafka)
* Java 17+ & Maven
* Python 3.10+
* Node.js & npm
* [Ollama](https://ollama.com/) (with the `tinyllama` model pulled locally)

### One-Click Startup
For ease of development, this project includes a Windows Batch script to spin up the entire microservice ecosystem simultaneously.

1. Clone the repository.
2. Ensure Docker Desktop is running.
3. Double-click `start-dms.bat` in the root directory.

This script will sequentially launch the Docker containers, boot the Ollama AI engine, start the Spring Boot API, activate the Python virtual environment and listener, and finally launch the React development server.

## 👨‍💻 Author

**K Harsha S Havaldar**
*Core Computer Science & Engineering*

If you have any questions about the implementation of the event loop or the LLM integration, feel free to reach out!
