import { spawn } from 'child_process';
import { join } from 'path';
import Task from '../models/task.js';
import UserPreferences from '../models/user-preferences.js';
import OpenAIService from './openai-service.js';
import TaskScheduler from './task-scheduler.js';

class NotificationService {
    constructor() {
        this.openAIService = OpenAIService;
        this.taskScheduler = TaskScheduler;
    }

    async sendTaskReminder(userId, taskId) {
        try {
            const task = await Task.findById(taskId);
            const userPrefs = await UserPreferences.findOne({ userId });
            
            if (!task || !userPrefs) {
                throw new Error('Task or user preferences not found');
            }

            // Check if we should send notifications
            if (!this.shouldSendNotification(userPrefs)) {
                console.log('Notification skipped due to quiet hours or preferences');
                return;
            }

            // Get AI-generated reminder message
            const reminderContext = {
                task: {
                    title: task.title,
                    description: task.description,
                    priority: task.priority,
                    dueDate: task.dueDate
                },
                userPreferences: userPrefs.aiPreferences
            };

            const aiMessage = await this.openAIService.getChatResponse(
                "Generate a task reminder message",
                reminderContext
            );

            // Send SMS if enabled
            if (userPrefs.notifications.sms.enabled && 
                userPrefs.notifications.sms.preferences.taskReminders) {
                await this.sendSMS(
                    userPrefs.notifications.sms.phoneNumber,
                    aiMessage
                );
            }

            // Send email if enabled
            if (userPrefs.notifications.email.enabled && 
                userPrefs.notifications.email.preferences.taskReminders) {
                // Email implementation would go here
                console.log('Email notifications not implemented yet');
            }

        } catch (error) {
            console.error('Error sending task reminder:', error);
            throw error;
        }
    }

    async sendDailySummary(userId) {
        try {
            const userPrefs = await UserPreferences.findOne({ userId });
            if (!userPrefs) throw new Error('User preferences not found');

            // Generate daily schedule
            const schedule = await this.taskScheduler.generateDailySchedule(userId);
            
            // Get AI insights
            const insights = await this.openAIService.getProductivityInsights(schedule);

            const summaryMessage = this.formatDailySummary(schedule, insights);

            // Send SMS if enabled
            if (userPrefs.notifications.sms.enabled && 
                userPrefs.notifications.sms.preferences.dailySummary) {
                await this.sendSMS(
                    userPrefs.notifications.sms.phoneNumber,
                    summaryMessage
                );
            }

            // Send email if enabled
            if (userPrefs.notifications.email.enabled && 
                userPrefs.notifications.email.preferences.dailySummary) {
                // Email implementation would go here
                console.log('Email notifications not implemented yet');
            }

        } catch (error) {
            console.error('Error sending daily summary:', error);
            throw error;
        }
    }

    async sendAIInsights(userId) {
        try {
            const userPrefs = await UserPreferences.findOne({ userId });
            if (!userPrefs) throw new Error('User preferences not found');

            // Get tasks and generate insights
            const tasks = await Task.find({ userId });
            const insights = await this.openAIService.getProductivityInsights(tasks);

            // Send SMS if enabled
            if (userPrefs.notifications.sms.enabled && 
                userPrefs.notifications.sms.preferences.aiInsights) {
                await this.sendSMS(
                    userPrefs.notifications.sms.phoneNumber,
                    insights
                );
            }

            // Send email if enabled
            if (userPrefs.notifications.email.enabled && 
                userPrefs.notifications.email.preferences.aiInsights) {
                // Email implementation would go here
                console.log('Email notifications not implemented yet');
            }

        } catch (error) {
            console.error('Error sending AI insights:', error);
            throw error;
        }
    }

    async sendSMS(phoneNumber, message) {
        return new Promise((resolve, reject) => {
            // Spawn Python process to send SMS
            const pythonProcess = spawn('python', [
                join(process.cwd(), 'services', 'sms_service.py')
            ]);

            // Send phone number and message to Python script
            pythonProcess.stdin.write(phoneNumber + '\n');
            pythonProcess.stdin.write(message + '\n');
            pythonProcess.stdin.end();

            let output = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`SMS service error: ${error}`));
                }
            });
        });
    }

    shouldSendNotification(userPrefs) {
        // Check quiet hours
        if (userPrefs.notifications.sms.enabled) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();
            const currentTime = `${currentHour}:${currentMinutes}`;

            const quietStart = userPrefs.notifications.sms.quietHours.start;
            const quietEnd = userPrefs.notifications.sms.quietHours.end;

            // If current time is within quiet hours, don't send notification
            if (quietStart < quietEnd) {
                if (currentTime >= quietStart && currentTime < quietEnd) {
                    return false;
                }
            } else {
                // Handle case where quiet hours span midnight
                if (currentTime >= quietStart || currentTime < quietEnd) {
                    return false;
                }
            }
        }

        return true;
    }

    formatDailySummary(schedule, insights) {
        let summary = "Daily Schedule Summary\n\n";

        // Add scheduled tasks
        schedule.forEach((slot, index) => {
            const startTime = slot.startTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit'
            });
            const endTime = slot.endTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit'
            });

            summary += `${index + 1}. ${startTime} - ${endTime}\n`;
            summary += `   ${slot.task.title}\n`;
            if (slot.task.description) {
                summary += `   ${slot.task.description}\n`;
            }
            summary += `   Priority: ${slot.task.priority}\n\n`;
        });

        // Add AI insights
        if (insights) {
            summary += "\nAI Insights:\n";
            summary += insights;
        }

        return summary;
    }
}

export default new NotificationService();
