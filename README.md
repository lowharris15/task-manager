# AI-Powered Task Manager

## Overview
A comprehensive task management application that leverages artificial intelligence to provide smart insights, intelligent scheduling, and automated notifications. This application is designed to maximize productivity by learning from your work patterns and helping you optimize your time management.

## Features

### Task Management
- **Create, read, update, and delete tasks**: Full CRUD functionality for managing all your tasks in one place
- **Set priorities, due dates, and estimated durations**: Granular control over task parameters to help with planning
- **Add detailed descriptions and tags**: Organize tasks with rich text descriptions and customizable tags for easy filtering
- **Filter and search tasks**: Quickly find what you're looking for with powerful search and filtering capabilities

### AI Integration
- **Smart task prioritization using OpenAI**: The system analyzes your tasks and suggests optimal priority levels based on deadlines, importance, and your previous patterns
- **Automated scheduling suggestions**: Receive AI-generated suggestions for when to work on specific tasks based on your availability and task requirements
- **Productivity insights and patterns analysis**: Get detailed analytics on your work habits, including peak productivity times and task completion patterns
- **Personalized time management advice**: Receive customized recommendations to improve your workflow and productivity

### Calendar Integration
- **Google Calendar synchronization**: Two-way sync ensures your tasks and calendar stay updated across platforms
- **Optimal time slot suggestions**: AI identifies the best times to schedule tasks based on your calendar availability and task requirements
- **Conflict detection and resolution**: Automatic identification of scheduling conflicts with suggestions for resolution
- **Working hours management**: Define your working hours to ensure tasks are only scheduled when you're available

### Smart Notifications
- **SMS notifications via Google Voice**: Receive timely reminders without needing a separate app
- **Customizable quiet hours**: Define periods when you don't want to be disturbed by notifications
- **Daily task summaries**: Get a comprehensive overview of your day's tasks each morning
- **AI-generated reminders**: Smart reminders that adapt based on task urgency and your response patterns
- **Priority-based notification frequency**: More important tasks trigger more frequent reminders

### Adaptive Learning
- **Learns from user behavior and preferences**: The system improves over time by analyzing how you work
- **Adjusts scheduling based on completion patterns**: Suggests better scheduling based on when you actually complete similar tasks
- **Provides personalized productivity insights**: Identifies your unique productivity patterns and bottlenecks
- **Suggests task batching and breaks**: Recommends grouping similar tasks and scheduling strategic breaks

## System Architecture
The application uses a modern stack with:
- Frontend: React.js with Material-UI
- Backend: Node.js Express server for the API
- AI Processing: Python microservices for OpenAI integration and data analysis
- Database: MongoDB for flexible document storage
- External integrations: Google Calendar API and Google Voice for notifications

## Prerequisites
- Node.js >= 14.0.0
- Python >= 3.8.0
- MongoDB (or Docker for local development)
- Google Calendar API credentials
- Google Voice account
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/lowharris15/task-manager.git
cd task-manager
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
- Copy `.env.example` to `.env`
- Fill in your API keys and credentials:
  - MongoDB connection string
  - OpenAI API key
  - Google Calendar API credentials
  - Google Voice credentials
  - Default settings

## Local Development

### Running MongoDB with Docker
For local development, you can run MongoDB in a Docker container:

```bash
docker run -d -p 27017:27017 --name mongodb-container mongo:latest
```

This command:
- `-d`: Runs the container in detached mode (in the background)
- `-p 27017:27017`: Maps port 27017 from the container to port 27017 on your host
- `--name mongodb-container`: Names the container for easy reference
- `mongo:latest`: Uses the latest MongoDB image from Docker Hub

After running this command, update your `.env` file with:
```
MONGODB_URI=mongodb://localhost:27017/taskmanager
```

### Stopping and Starting the MongoDB Container
- To stop the container: `docker stop mongodb-container`
- To start it again: `docker start mongodb-container`
- To remove it: `docker rm mongodb-container`

## Configuration

### Google Calendar Setup
1. Create a Google Cloud project through the Google Cloud Console
2. Enable the Google Calendar API in the API Library
3. Create a service account and download the JSON credentials file
4. Share your calendar with the service account email address to grant access
5. Add the path to your credentials file in the `.env` file

### Google Voice Setup
1. Create a Google Voice account if you don't have one
2. Enable less secure app access in your Google account or create an app-specific password
3. Add your Google Voice credentials to the `.env` file
4. Test the SMS functionality with a test message

### OpenAI Setup
1. Register for an OpenAI account and get an API key
2. Create an Assistant for task management using the OpenAI platform
3. Add the API key and Assistant ID to your `.env` file
4. Configure the model parameters in the application settings

## Usage

1. Start the development server:
```bash
npm run dev
```

2. Access the application:
```
http://localhost:5000
```

The development command starts both the frontend and backend servers concurrently.

## Features Usage

### AI Insights
- Click the "Get AI Insights" button on the dashboard to receive personalized task management advice
- The AI analyzes your task history, completion patterns, and current workload
- Insights include suggestions for task batching, optimal work times, and productivity improvements
- Insights are stored and accessible from the insights tab for future reference

### Task Scheduling
- Add tasks with estimated durations and priorities using the "Add Task" form
- The system will suggest optimal time slots based on your calendar availability
- Tasks can be manually scheduled by dragging them to your calendar
- Enable auto-scheduling to let the AI place tasks in optimal slots automatically
- Use the "Reschedule" button to optimize your existing schedule

### Notifications
- Enable SMS notifications in user preferences to receive alerts on your phone
- Set quiet hours to prevent notifications during specific time periods
- Configure notification preferences for different types of alerts (reminders, summaries, insights)
- Adjust notification frequency based on task priority in the settings panel

### Daily Summaries
- Request daily summaries via the "Get Daily Summary" button on the dashboard
- Summaries include your task list for the day, prioritized by importance and deadline
- AI insights about your day's workload and suggestions for optimization
- Receive summaries via SMS at your configured time or view them in the app

## API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks with AI insights
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### AI and Scheduling
- `GET /api/insights` - Get AI insights about productivity and task management
- `GET /api/schedule` - Get daily schedule with optimal task placement
- `POST /api/tasks/reprioritize` - Reprioritize tasks using AI algorithms

### Notifications
- `POST /api/notifications/summary` - Send daily summary to configured devices
- `POST /api/notifications/insights` - Send AI insights via SMS or email

### User Preferences
- `GET /api/preferences` - Get user preferences for notifications and scheduling
- `PUT /api/preferences` - Update user preferences

## Troubleshooting

### Common Issues
- **MongoDB Connection Errors**: Ensure your Docker container is running and the connection string is correct
- **Google Calendar Integration Issues**: Verify your credentials and ensure the calendar is shared with the service account
- **OpenAI API Errors**: Check your API key and usage limits in the OpenAI dashboard
- **SMS Notification Failures**: Verify your Google Voice credentials and test connection

### Logs
- Application logs are stored in the `logs/` directory
- Check `app.log` for general application errors
- Check `ai-service.log` for AI processing errors

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## License
This project is licensed under the ISC License.
