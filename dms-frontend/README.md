
---

### 🏗️ Build Notes: MyDMS Frontend (V1.0)

**Core Architecture:**
A standalone, highly responsive React component (`GitWorkspace.jsx`) that acts as the frontend interface for a Spring Boot/PostgreSQL backend. It uses a "Git-inspired" staging workflow combined with a modern cloud-storage aesthetic.

**Key Features Implemented:**
1. **The Staging Engine:** * Global drag-and-drop overlay with visual feedback.
   * "Front Door Shield" that automatically rejects broken/extension-less files.
   * Dedicated "Unsaved Files" staging area for bulk review before committing to the database.
2. **File Explorer Dashboard:**
   * Interactive grid view with Smart Icons (`react-icons`) mapped to file extensions.
   * Multi-level sorting (A-Z, Z-A, File Type).
   * Double-click navigation for nested folders.
3. **Rich Document Previews:**
   * Native rendering for Images, PDFs, and Plain Text.
   * Integrated `mammoth.js` for rendering Microsoft Word (`.docx`) files.
   * Integrated `xlsx.js` for rendering Excel spreadsheets (`.xlsx`).
   * Smart fallback UI with download links for unsupported binary files (ZIP, RAR, etc.).
4. **Git-Style Version Control:**
   * Visual timeline mapping the history of every document.
   * Author tracking and commit numbers.
   * One-click "Preview" to instantly load older versions of a file.
5. **Contextual Interactions:**
   * Custom Right-Click menus for both files and folders.
   * Recursive folder deletion (wiping a folder and all contents).
   * Sequential "Download All" feature for folders.
   * Detailed Properties Modals calculating exact paths, sizes, and file types.

---

### 🚀 How to Push Your Project to GitHub

Open a terminal inside your `dms-frontend` folder (where your `package.json` is located) and run these commands one by one.

**Step 1: Initialize Git and save your code**
```bash
git init
git add .
git commit -m "Initial commit: MyDMS React Frontend with Explorer Dashboard"
```

**Step 2: Link to your GitHub**
*(Note: Go to GitHub.com first, click "New Repository", name it `MyDMS-Frontend`, and copy the repository URL it gives you).*
```bash
git branch -M main
git remote add origin <PASTE_YOUR_GITHUB_REPO_URL_HERE>
```

**Step 3: Push the code to the cloud**
```bash
git push -u origin main
```

---

### 📄 Your Polished README.md

Copy the markdown text below and save it as `README.md` in the root of your `dms-frontend` folder. When you push to GitHub, this will be the beautiful homepage for your code!

```markdown
# 🗂️ MyDMS: Enterprise Document Management System

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot)

MyDMS is a modern, responsive Document Management System frontend built with React. It combines the intuitive UX of Google Drive with the robust, version-controlled workflows of Git. 

Designed to interface with a Spring Boot/PostgreSQL backend, MyDMS allows users to stage, preview, version-control, and manage complex directory structures with ease.

## ✨ Key Features

* **☁️ Smart Drag & Drop Staging:** Drop files anywhere on the screen to stage them. A built-in security shield filters out corrupted or extension-less files before they reach the database.
* **📊 Explorer Dashboard:** A full-screen grid interface with dynamic SVG icons, folder navigation, and advanced sorting (A-Z, File Type).
* **👁️ Rich Document Previews:** Native browser rendering for **PDFs, Images, and Text**, plus integrated rendering for **Word Documents (.docx)** and **Excel Spreadsheets (.xlsx)**.
* **🕒 Git-Style Version Control:** Every file maintains a visual timeline of edits and updates. Users can check out, preview, and restore older versions of documents with a single click.
* **🖱️ Contextual Menus:** Right-click anywhere in the dashboard or sidebar to access advanced features like Bulk Downloads, Recursive Folder Deletion, Check-ins, and detailed File Properties.

## 🛠️ Technology Stack

* **Frontend Framework:** React.js (Hooks, Functional Components)
* **Build Tool:** Vite
* **Styling:** CSS-in-JS (Flexbox, Grid, 100vh Responsive Layouts)
* **Icons:** `react-icons` (Material/FontAwesome)
* **Document Parsing:** `mammoth` (Word), `xlsx` (Excel)

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed. You will also need the companion Spring Boot Backend running on `localhost:8080` to handle database operations and file serving.

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/yourusername/MyDMS-Frontend.git](https://github.com/yourusername/MyDMS-Frontend.git)
   ```
2. Navigate into the directory:
   ```bash
   cd MyDMS-Frontend
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔌 Backend API Integration
This frontend expects a REST API running on `http://localhost:8080` with the following endpoints:
* `GET /api/documents/all` - Fetch repository tree
* `GET /api/documents/raw/{id}` - Stream file binaries
* `GET /api/documents/{id}/history` - Fetch Git-style version timelines
* `POST /api/documents/upload` - Multipart binary file uploads
* `POST /api/documents/event` - Text document commits and updates
* `DELETE /api/documents/delete` - Remove files/folders
* `DELETE /api/documents/wipe` - Nuke workspace

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
```

# 🚀 MyDMS: Event-Driven AI Document Management System

![Frontend](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react&logoColor=black)
![Build Tool](https://img.shields.io/badge/Build-Vite-B73BFE?logo=vite&logoColor=FFD62E)
![Backend](https://img.shields.io/badge/Backend-Java_Spring_Boot-6DB33F?logo=spring&logoColor=white)
![Message Broker](https://img.shields.io/badge/Event_Bus-Apache_Kafka-231F20?logo=apachekafka&logoColor=white)
![AI Engine](https://img.shields.io/badge/AI-Python_&_TinyLlama-3776AB?logo=python&logoColor=white)
![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Infra-Docker-2496ED?logo=docker&logoColor=white)

An enterprise-grade, multi-service document workspace featuring a Google Drive-style UI, Git-style version control, and asynchronous AI summarization. 

This project demonstrates a fully distributed full-stack architecture where decoupled applications communicate entirely through an event broker, ensuring high scalability and real-time data processing without blocking the main application thread.

## ✨ Key Features

### 💻 Frontend & User Experience
* **☁️ Smart Drag & Drop Staging:** Drop files anywhere on the screen to stage them. A built-in security shield filters out corrupted or extension-less files before they reach the database.
* **📊 Explorer Dashboard:** A full-screen grid interface with dynamic SVG icons, folder navigation, and advanced sorting (A-Z, Z-A, File Type).
* **👁️ Rich Document Previews:** Native browser rendering for **PDFs, Images, and Text**, plus integrated rendering for **Word Documents (.docx)** and **Excel Spreadsheets (.xlsx)**.
* **🖱️ Contextual Menus:** Right-click anywhere in the dashboard or sidebar to access advanced features like Bulk Downloads, Recursive Folder Deletion, Check-ins, and detailed File Properties.

### ⚙️ Backend & Architecture
* **🕒 Git-Style Version Control:** Documents are never overwritten. Every edit is saved as an immutable event in PostgreSQL, allowing users to track the complete chronological history and restore older versions with a single click.
* **🧠 Asynchronous AI Summarization:** When a human updates a document, a Kafka event triggers a decoupled Python microservice. This service uses LangChain and a localized LLM (TinyLlama via Ollama) to generate a contextual summary and independently commits it back to the event store.
* **📨 Event-Driven Architecture:** The Spring Boot backend acts as a publisher, broadcasting document changes to Apache Kafka. This completely decouples heavy AI processing from the user-facing REST API.
* **📝 Format Exporting:** Built-in Java Apache POI integration allows users to compile the document history and export it directly as a fully formatted Microsoft Word (`.docx`) file.

## 🏗️ System Architecture

The system is composed of four distinct layers running concurrently:

1. **Client Layer (React/Vite):** A highly responsive, 100vh locked UI for managing the workspace and viewing the live event ledger.
2. **Core API (Spring Boot):** The central nervous system. It handles REST requests, interacts with the database, and publishes events to the message broker.
3. **Event Bus & Storage (Docker):** PostgreSQL serves as the persistent event store, while Apache Kafka handles the high-throughput message queuing.
4. **AI Processor (Python):** An isolated consumer service that listens to the Kafka topic, processes text through a local LLM, and sends HTTP callbacks to the Core API.

### 🌊 The Data Flow
`React UI` ➡️ `Spring Boot API` ➡️ `PostgreSQL (Saved)` ➡️ `Kafka Topic (Published)` ➡️ `Python Service (Consumed)` ➡️ `Local LLM (Inference)` ➡️ `Spring Boot API (Callback)` ➡️ `React UI (Updated)`

## 🚀 Getting Started (Local Development)

### Prerequisites
* **Docker Desktop** (for Postgres & Kafka containers)
* **Java 17+** & Maven
* **Python 3.10+**
* **Node.js** & npm
* **[Ollama](https://ollama.com/)** (with the `tinyllama` model pulled locally)

### One-Click Startup
For ease of development, this project includes a Windows Batch script to spin up the entire microservice ecosystem simultaneously.

1. Clone the repository:
   ```bash
   git clone [https://github.com/yourusername/MyDMS-Frontend.git](https://github.com/yourusername/MyDMS-Frontend.git)
   cd MyDMS-Frontend