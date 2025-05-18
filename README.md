# AI-Powered Task Manager

A comprehensive task management application with AI insights, smart scheduling, and automated notifications.

## Features

- **Task Management**
  - Create, read, update, and delete tasks
  - Set priorities, due dates, and estimated durations
  - Add detailed descriptions and tags
  - Filter and search tasks

- **AI Integration**
  - Smart task prioritization using OpenAI
  - Automated scheduling suggestions
  - Productivity insights and patterns analysis
  - Personalized time management advice

- **Calendar Integration**
  - Google Calendar synchronization
  - Optimal time slot suggestions
  - Conflict detection and resolution
  - Working hours management

- **Smart Notifications**
  - SMS notifications via Google Voice
  - Customizable quiet hours
  - Daily task summaries
  - AI-generated reminders
  - Priority-based notification frequency

- **Adaptive Learning**
  - Learns from user behavior and preferences
  - Adjusts scheduling based on completion patterns
  - Provides personalized productivity insights
  - Suggests task batching and breaks

## Prerequisites

- Node.js >= 14.0.0
- Python >= 3.8.0
- MongoDB
- Google Calendar API credentials
- Google Voice account
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/task-manager.git
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

## Configuration

### Google Calendar Setup

1. Create a Google Cloud project
2. Enable the Google Calendar API
3. Create a service account and download credentials
4. Share your calendar with the service account email
5. Add the credentials to `.env`

### Google Voice Setup

1. Create a Google Voice account
2. Enable less secure app access or create an app-specific password
3. Add credentials to `.env`

### OpenAI Setup

1. Get an API key from OpenAI
2. Create an Assistant for task management
3. Add the API key and Assistant ID to `.env`

## Usage

1. Start the development server:
```bash
npm run dev
```

2. Access the application:
```
http://localhost:5000
```

## Features Usage

### AI Insights
- Click "Get AI Insights" to receive personalized task management advice
- The AI analyzes your task patterns and provides suggestions for optimization

### Task Scheduling
- Add tasks with estimated durations and priorities
- The system will suggest optimal time slots based on your calendar
- Tasks can be manually scheduled or auto-scheduled

### Notifications
- Enable SMS notifications in user preferences
- Set quiet hours to prevent off-hours notifications
- Configure notification preferences for different types of alerts

### Daily Summaries
- Request daily summaries via the "Get Daily Summary" button
- Summaries include task lists, priorities, and AI insights
- Receive summaries via SMS or view them in the app

## API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks with AI insights
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### AI and Scheduling
- `GET /api/insights` - Get AI insights
- `GET /api/schedule` - Get daily schedule
- `POST /api/tasks/reprioritize` - Reprioritize tasks using AI

### Notifications
- `POST /api/notifications/summary` - Send daily summary
- `POST /api/notifications/insights` - Send AI insights

### User Preferences
- `GET /api/preferences` - Get user preferences
- `PUT /api/preferences` - Update user preferences

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.
