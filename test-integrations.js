import OpenAIService from './services/openai-service.js';
import CalendarService from './services/calendar-service.js';
import NotificationService from './services/notification-service.js';
import TaskScheduler from './services/task-scheduler.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testIntegrations() {
    try {
        console.log('Testing integrations...\n');

        // Test MongoDB Connection
        console.log('Testing MongoDB connection...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ MongoDB connected successfully\n');

        // Test OpenAI Integration
        console.log('Testing OpenAI integration...');
        const aiResponse = await OpenAIService.getChatResponse(
            'Test message',
            { context: 'Integration test' }
        );
        console.log('✓ OpenAI integration working\n');

        // Test Google Calendar Integration
        console.log('Testing Google Calendar integration...');
        const calendarService = new CalendarService();
        const now = new Date();
        const later = new Date(now.getTime() + 3600000);
        const slots = await calendarService.getFreeTimeSlots(now, later);
        console.log('✓ Google Calendar integration working\n');

        // Test Task Scheduler
        console.log('Testing Task Scheduler...');
        const schedule = await TaskScheduler.generateDailySchedule(
            'test-user',
            new Date()
        );
        console.log('✓ Task Scheduler working\n');

        // Test SMS Integration (dry run)
        console.log('Testing SMS integration setup...');
        const smsConfigured = process.env.GOOGLE_VOICE_EMAIL && 
                            process.env.GOOGLE_VOICE_PASSWORD;
        if (smsConfigured) {
            console.log('✓ SMS credentials configured\n');
        } else {
            console.log('⚠ SMS credentials not configured\n');
        }

        console.log('Integration tests completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Integration test failed:', error);
        process.exit(1);
    }
}

testIntegrations();
