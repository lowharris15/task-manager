import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

class CalendarService {
    constructor() {
        this.calendar = google.calendar({
            version: 'v3',
            auth: new google.auth.JWT(
                process.env.GOOGLE_CLIENT_EMAIL,
                null,
                process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                ['https://www.googleapis.com/auth/calendar']
            )
        });
    }

    async addTaskToCalendar(task) {
        try {
            const event = {
                summary: task.title,
                description: task.description || '',
                start: {
                    dateTime: task.startDate || new Date().toISOString(),
                    timeZone: 'America/Chicago',
                },
                end: {
                    dateTime: task.dueDate || new Date(Date.now() + 3600000).toISOString(),
                    timeZone: 'America/Chicago',
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 30 }
                    ]
                },
                colorId: this.getPriorityColor(task.priority)
            };

            const response = await this.calendar.events.insert({
                calendarId: 'primary',
                resource: event
            });

            return response.data;
        } catch (error) {
            console.error('Error adding task to calendar:', error);
            throw error;
        }
    }

    async getFreeTimeSlots(startDate, endDate) {
        try {
            const response = await this.calendar.freebusy.query({
                requestBody: {
                    timeMin: startDate.toISOString(),
                    timeMax: endDate.toISOString(),
                    items: [{ id: 'primary' }]
                }
            });

            const busySlots = response.data.calendars.primary.busy;
            return this.findAvailableSlots(startDate, endDate, busySlots);
        } catch (error) {
            console.error('Error getting free time slots:', error);
            throw error;
        }
    }

    async suggestOptimalTime(task) {
        try {
            const startDate = new Date();
            const endDate = task.dueDate ? new Date(task.dueDate) : new Date(Date.now() + 7 * 24 * 3600000);
            
            const freeSlots = await this.getFreeTimeSlots(startDate, endDate);
            const duration = task.estimatedDuration || 3600000; // default 1 hour

            // Find the best slot based on task priority and user preferences
            const optimalSlot = this.findOptimalSlot(freeSlots, duration, task.priority);
            return optimalSlot;
        } catch (error) {
            console.error('Error suggesting optimal time:', error);
            throw error;
        }
    }

    findOptimalSlot(freeSlots, duration, priority) {
        // Implement logic to find the best time slot based on:
        // 1. Task priority
        // 2. User's productive hours (could be stored in preferences)
        // 3. Slot duration
        // This is a simple implementation that takes the first available slot
        for (const slot of freeSlots) {
            if (slot.end - slot.start >= duration) {
                return {
                    start: new Date(slot.start),
                    end: new Date(slot.start + duration)
                };
            }
        }
        return null;
    }

    findAvailableSlots(startDate, endDate, busySlots) {
        const freeSlots = [];
        let currentTime = startDate.getTime();
        
        // Convert busy slots to timestamps
        const busyTimestamps = busySlots.map(slot => ({
            start: new Date(slot.start).getTime(),
            end: new Date(slot.end).getTime()
        }));

        // Sort busy slots
        busyTimestamps.sort((a, b) => a.start - b.start);

        // Find gaps between busy slots
        for (const busy of busyTimestamps) {
            if (currentTime < busy.start) {
                freeSlots.push({
                    start: currentTime,
                    end: busy.start
                });
            }
            currentTime = busy.end;
        }

        // Add final free slot if there's time left
        if (currentTime < endDate.getTime()) {
            freeSlots.push({
                start: currentTime,
                end: endDate.getTime()
            });
        }

        return freeSlots;
    }

    getPriorityColor(priority) {
        // Google Calendar color IDs
        switch (priority) {
            case 'high':
                return '11'; // Red
            case 'medium':
                return '5';  // Yellow
            case 'low':
                return '2';  // Green
            default:
                return '1';  // Blue
        }
    }

    async getUpcomingTasks(days = 7) {
        try {
            const response = await this.calendar.events.list({
                calendarId: 'primary',
                timeMin: new Date().toISOString(),
                timeMax: new Date(Date.now() + days * 24 * 3600000).toISOString(),
                singleEvents: true,
                orderBy: 'startTime'
            });

            return response.data.items;
        } catch (error) {
            console.error('Error getting upcoming tasks:', error);
            throw error;
        }
    }
}

export default CalendarService;
