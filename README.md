@ -1,37 +1,37 @@

# 📅 Scheduling Server 

A Student Scheduling App Server! A team project.  This Node.js and TypeScript-powered API allows students to schedule appointments with their professors 🚀

## ✨ Features

✅ **User Authentication**: Students and professors can securely log in and access their accounts. 🔐

🗓️ **Appointment Management**: Create, update, and delete appointments with ease. 📆

👁️‍🗨️ **View Upcoming Appointments**: Keep track of your upcoming appointments effortlessly. 📅

🌐 **Secure MongoDB Integration**: We ensure your data is safe and scalable with MongoDB integration. 📈

🐳 **Docker Support**: Use Docker for easy deployment and containerization. 🐋

## 📋 Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js and npm installed (recommend using Node.js LTS version)
- MongoDB server running locally or accessible
- Additionally this project uses yarn to install a dependency ```bash yarn add [dependency] ``` this is the equivalent of npm install [dependency]
- Docker installed (optional)

## 🚀 Installation

To get started, follow these steps:

1. **Clone this repository to your local machine:**

   ```bash
   git clone https://github.com/your/repository.git
   git clone https://github.com/hermy1/scheduler-server.git
   cd scheduler-server
   ```

@ -49,9 +49,13 @@ To get started, follow these steps:
   cp .env.example .env
   ```

   Then fill the appropriate variables in newly created .env file. NEVER COMMIT .env file to GIT
   Then fill the appropriate variables in newly created .env file. for example
   SECRET="joweijwejwljoeijweo"
   NODE_ENV=development
   MONGO_DATABASE= add the database
   etc 

4. **Start the Server:**
5. **Start the Server:**

   ```bash
   yarn start:dev
