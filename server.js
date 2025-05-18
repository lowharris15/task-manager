import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { join } from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Middleware
app.use(cors());  // Allow all origins in development
app.use(express.json());

// Static file serving configuration
const publicPath = join(process.cwd(), 'public');
console.log('Public directory path:', publicPath);

// Log all static file requests
app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
        console.log('Static file request:', req.path);
    }
    next();
});

// Serve static files
app.use(express.static(publicPath));

// Serve index.html for all non-API routes
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    
    console.log('Serving index.html for path:', req.path);
    const indexPath = join(publicPath, 'index.html');
    
    res.sendFile(indexPath, err => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Error loading page');
        }
    });
});

// Import models and services
import Task from './models/task.js';
import UserPreferences from './models/user-preferences.js';
import TaskScheduler from './services/task-scheduler.js';
import NotificationService from './services/notification-service.js';
import OpenAIService from './services/openai-service.js';
import auth from './middleware/auth.js';

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// MongoDB Connection and Server Start
async function startServer() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager';
        console.log('Attempting to connect to MongoDB at:', mongoUri);
        
        // Configure Mongoose
        mongoose.set('debug', true); // Enable logging collection methods + arguments
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            family: 4 // Use IPv4
        });
        
        console.log('Successfully connected to MongoDB');

        // Verify database connection
        const adminDb = mongoose.connection.db.admin();
        const dbInfo = await adminDb.listDatabases();
        console.log('Available databases:', dbInfo.databases.map(db => db.name));

        // Create default user preferences if they don't exist
        console.log('Creating default user preferences for:', process.env.TEST_USER_ID);
        const defaultPrefs = await UserPreferences.findOneAndUpdate(
            { userId: process.env.TEST_USER_ID },
            {
                notifications: {
                    sms: { enabled: false },
                    email: { enabled: false }
                },
                calendar: { syncEnabled: false },
                productivity: {
                    taskBatchSize: 3,
                    breakPreferences: {
                        frequency: 90,
                        duration: 15
                    }
                },
                aiPreferences: { enabled: true }
            },
            { upsert: true, new: true }
        );
        console.log('Default user preferences created/updated:', defaultPrefs);

        // Verify Task model is registered
        console.log('Registered Mongoose models:', Object.keys(mongoose.models));

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err.message);
        if (err.name === 'MongoServerSelectionError') {
            console.error('MongoDB Connection Error. Please make sure MongoDB is running.');
        }
        console.error('Full error:', err);
        process.exit(1);
    }
}

startServer();

// OpenAI Configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Helper function to get AI insights
async function getAIInsights(tasks) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a productivity assistant analyzing task patterns and providing time management advice."
                },
                {
                    role: "user",
                    content: `Analyze these tasks and provide time management advice: ${JSON.stringify(tasks)}`
                }
            ],
            max_tokens: 150
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API error:', error);
        return "Unable to generate insights at this time.";
    }
}


// API Routes
app.use('/api', auth);  // Apply auth middleware to all API routes

// Task Management Routes
// Get all tasks with AI insights
app.get('/api/tasks', async (req, res) => {
    try {
        console.log('GET /api/tasks - User ID:', req.user.id);
        
        // Verify Task model
        console.log('Task model:', Task);
        console.log('Registered models:', mongoose.modelNames());
        
        // Find tasks
        const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
        console.log('Found tasks:', tasks);

        // Send response
        res.json({ 
            success: true,
            tasks: tasks || [],
            count: tasks.length
        });
    } catch (error) {
        console.error('Error in GET /api/tasks:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            success: false,
            message: error.message,
            error: process.env.NODE_ENV === 'development' ? {
                name: error.name,
                stack: error.stack
            } : undefined
        });
    }
});

// Create task
app.post('/api/tasks', async (req, res) => {
    try {
        console.log('POST /api/tasks - Received request');
        console.log('Headers:', req.headers);
        console.log('Request body:', req.body);
        console.log('User ID:', req.user.id);

        // Create basic task first
        console.log('Creating new task object...');
        console.log('Request user:', req.user);
        const userId = new mongoose.Types.ObjectId(req.user.id);
        console.log('Converted userId:', userId);

        const taskData = {
            title: req.body.title,
            description: req.body.description || '',
            priority: req.body.priority || 'low',
            startDate: req.body.startDate || null,
            dueDate: req.body.dueDate || null,
            estimatedDuration: req.body.estimatedDuration || 3600000,
            userId: userId,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        console.log('Task data:', taskData);

        const task = new Task(taskData);

        console.log('Created task object:', task);

        // Validate task
        const validationError = task.validateSync();
        if (validationError) {
            console.error('Validation error:', validationError);
            return res.status(400).json({ 
                success: false,
                message: 'Validation error',
                errors: validationError.errors 
            });
        }

        // Save task
        const savedTask = await task.save();
        console.log('Saved task:', savedTask);

        res.status(201).json({
            success: true,
            task: savedTask
        });
    } catch (error) {
        console.error('Error creating task:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            success: false,
            message: 'Error creating task',
            error: process.env.NODE_ENV === 'development' ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : undefined
        });
    }
});

// Update task with rescheduling
app.put('/api/tasks/:id', async (req, res) => {
    try {
        let task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Reschedule if date/time changed
        if (req.body.startDate !== task.startDate || req.body.dueDate !== task.dueDate) {
            task = await TaskScheduler.scheduleTask({
                ...task.toObject(),
                ...req.body
            }, req.user.id);
        } else {
            Object.assign(task, req.body);
            task.updatedAt = new Date();
        }

        const updatedTask = await task.save();
        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        console.log('DELETE /api/tasks/:id - Request params:', req.params);
        console.log('User ID:', req.user.id);

        const task = await Task.findOne({ 
            _id: req.params.id, 
            userId: new mongoose.Types.ObjectId(req.user.id)
        });

        if (!task) {
            console.log('Task not found');
            return res.status(404).json({ 
                success: false,
                message: 'Task not found' 
            });
        }

        console.log('Found task:', task);
        await task.deleteOne();
        console.log('Task deleted successfully');

        res.json({ 
            success: true,
            message: 'Task deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete task',
            error: process.env.NODE_ENV === 'development' ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : undefined
        });
    }
});

// AI and Scheduling Routes

// Get AI insights
app.get('/api/insights', async (req, res) => {
    try {
        console.log('GET /api/insights - User ID:', req.user.id);
        const tasks = await Task.find({ userId: req.user.id });
        console.log('Found tasks:', tasks);

        const insights = await OpenAIService.getProductivityInsights(tasks);
        console.log('Generated insights:', insights);

        res.json({ 
            success: true,
            insights: insights || 'No insights available at this time.'
        });
    } catch (error) {
        console.error('Error getting AI insights:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to get AI insights',
            error: process.env.NODE_ENV === 'development' ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : undefined
        });
    }
});

// Get daily schedule
app.get('/api/schedule', async (req, res) => {
    try {
        const schedule = await TaskScheduler.generateDailySchedule(req.user.id);
        res.json({ schedule });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reprioritize tasks
app.post('/api/tasks/reprioritize', async (req, res) => {
    try {
        const result = await TaskScheduler.reprioritizeTasks(req.user.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Notification Routes

// Send daily summary
app.post('/api/notifications/summary', async (req, res) => {
    try {
        await NotificationService.sendDailySummary(req.user.id);
        res.json({ message: 'Daily summary sent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send AI insights
app.post('/api/notifications/insights', async (req, res) => {
    try {
        await NotificationService.sendAIInsights(req.user.id);
        res.json({ message: 'AI insights sent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// User Preferences Routes

// Get user preferences
app.get('/api/preferences', async (req, res) => {
    try {
        const preferences = await UserPreferences.findOne({ userId: req.user.id });
        res.json(preferences);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update user preferences
app.put('/api/preferences', async (req, res) => {
    try {
        const preferences = await UserPreferences.findOneAndUpdate(
            { userId: req.user.id },
            req.body,
            { new: true, upsert: true }
        );
        res.json(preferences);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
