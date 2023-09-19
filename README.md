
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
   git clone https://github.com/hermy1/scheduler-server.git
   cd scheduler-server
   ```

2. **Install Dependencies:**

   ```bash
   yarn install
   ```

3. **Configure Environment Variables:**

   Create a `.env` file in the root directory by running a bash command:

   ```
   cp .env.example .env
   ```

   Then fill the appropriate variables in newly created .env file. for example
   SECRET="joweijwejwljoeijweo"
   NODE_ENV=development
   MONGO_DATABASE= add the database
   etc 

5. **Start the Server:**

   ```bash
   yarn start:dev
   ```

## 🐳 Docker Support (Optional)

To run the app with Docker, follow these additional steps:

1. **Build the Docker Container:**

   ```bash
   make build
   ```

2. **Run the Docker Container:**

   ```bash
   make up
   ```

## 📄 API Documentation

API instructions 

## 🤝 Contributing

Before you commit, make sure pull changes from master and create a new branch
for example. while on master run the following command
 ```bash
git checkout -b feature/authentication
 ```
 "feature/authentication" <<-- this would be your new branch to work on. after push it and add someone to review your code before it is merged to master branch.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](/LICENSE.md) file for details.

Happy scheduling! 📚📆🎉
```
