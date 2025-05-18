import OpenAIService from './openai-service.js';
import CalendarService from './calendar-service.js';
import Task from '../models/task.js';
import UserPreferences from '../models/user-preferences.js';

class TaskScheduler {
    constructor() {
        this.calendarService = new CalendarService();
        this.openAIService = OpenAIService;
    }

    async scheduleTask(task, userId) {
        try {
            // Get user preferences
            const userPrefs = await UserPreferences.findOne({ userId });
            if (!userPrefs) throw new Error('User preferences not found');

            // Get existing tasks and calendar events
            const existingTasks = await Task.find({
                userId,
                status: { $ne: 'completed' },
                dueDate: { $gte: new Date() }
            });

            // Get AI suggestions for task priority and timing
            const aiSuggestions = await this.getAISuggestions(task, existingTasks, userPrefs);

            // Find optimal time slot
            const suggestedSlot = await this.calendarService.suggestOptimalTime({
                ...task,
                priority: aiSuggestions.priority || task.priority
            });

            if (!suggestedSlot) {
                throw new Error('No suitable time slot found');
            }

            // Update task with AI suggestions and scheduled time
            task.aiSuggestions = aiSuggestions;
            task.startDate = suggestedSlot.start;
            task.dueDate = suggestedSlot.end;

            // Add to calendar if enabled
            if (userPrefs.calendar.syncEnabled) {
                const calendarEvent = await this.calendarService.addTaskToCalendar(task);
                task.calendarEventId = calendarEvent.id;
            }

            return task;
        } catch (error) {
            console.error('Error scheduling task:', error);
            throw error;
        }
    }

    async getAISuggestions(task, existingTasks, userPrefs) {
        try {
            const context = {
                newTask: task,
                existingTasks: existingTasks.map(t => ({
                    title: t.title,
                    priority: t.priority,
                    dueDate: t.dueDate,
                    status: t.status
                })),
                userPreferences: {
                    workingHours: userPrefs.calendar.workingHours,
                    peakHours: userPrefs.productivity.peakHours,
                    priorityWeights: userPrefs.aiPreferences.priorityWeights
                }
            };

            const suggestions = await this.openAIService.getTaskSuggestions(
                context,
                userPrefs.aiPreferences
            );

            return {
                priority: suggestions.priority,
                scheduledTime: new Date(suggestions.scheduledTime),
                insights: suggestions.insights
            };
        } catch (error) {
            console.error('Error getting AI suggestions:', error);
            return {
                priority: task.priority,
                scheduledTime: task.startDate || new Date(),
                insights: 'Unable to generate AI insights at this time.'
            };
        }
    }

    async reprioritizeTasks(userId) {
        try {
            // Get all active tasks
            const tasks = await Task.find({
                userId,
                status: { $ne: 'completed' }
            });

            const userPrefs = await UserPreferences.findOne({ userId });
            if (!userPrefs) throw new Error('User preferences not found');

            // Get AI insights for task prioritization
            const insights = await this.openAIService.getProductivityInsights(
                tasks.map(t => ({
                    title: t.title,
                    priority: t.priority,
                    dueDate: t.dueDate,
                    status: t.status,
                    completedAt: t.completedAt
                }))
            );

            // Update task priorities based on AI suggestions
            const updatePromises = tasks.map(async (task) => {
                const suggestion = insights.taskSuggestions.find(s => s.taskId === task._id.toString());
                if (suggestion) {
                    task.aiSuggestions = {
                        ...task.aiSuggestions,
                        priority: suggestion.suggestedPriority,
                        insights: suggestion.reasoning
                    };
                    await task.save();
                }
            });

            await Promise.all(updatePromises);

            return {
                updatedTasks: tasks,
                generalInsights: insights.generalInsights
            };
        } catch (error) {
            console.error('Error reprioritizing tasks:', error);
            throw error;
        }
    }

    async generateDailySchedule(userId, date = new Date()) {
        try {
            console.log('Generating daily schedule for user:', userId);
            
            // Get tasks for the day
            const tasks = await Task.find({
                userId,
                status: { $ne: 'completed' }
            }).sort({ priority: -1, dueDate: 1 });

            console.log('Found tasks:', tasks);

            if (!tasks || tasks.length === 0) {
                return {
                    schedule: [],
                    message: 'No tasks scheduled for today'
                };
            }

            // Create a basic schedule without calendar integration
            const schedule = tasks.map(task => ({
                task: {
                    title: task.title,
                    description: task.description,
                    priority: task.priority
                },
                startTime: task.startDate || new Date(),
                endTime: task.dueDate || new Date(Date.now() + task.estimatedDuration)
            }));

            console.log('Generated schedule:', schedule);

            return {
                schedule,
                message: 'Basic schedule generated successfully'
            };
        } catch (error) {
            console.error('Error generating daily schedule:', error);
            return {
                schedule: [],
                message: 'Unable to generate schedule at this time',
                error: error.message
            };
        }
    }

    async optimizeSchedule(tasks, calendarEvents, userPrefs) {
        // Get working hours for the day
        const today = new Date().toLocaleLowerCase();
        const workingHours = userPrefs.calendar.workingHours[today];
        
        // Sort tasks by priority and deadline
        const sortedTasks = [...tasks].sort((a, b) => {
            const priorityWeight = userPrefs.aiPreferences.priorityWeights.importance;
            const deadlineWeight = userPrefs.aiPreferences.priorityWeights.deadline;
            
            const priorityScore = this.getPriorityScore(a.priority) * priorityWeight -
                                this.getPriorityScore(b.priority) * priorityWeight;
            
            const deadlineScore = (a.dueDate - b.dueDate) * deadlineWeight;
            
            return priorityScore + deadlineScore;
        });

        // Create time slots
        const schedule = [];
        let currentTime = new Date();
        currentTime.setHours(parseInt(workingHours.start.split(':')[0]));
        currentTime.setMinutes(parseInt(workingHours.start.split(':')[1]));

        const endTime = new Date();
        endTime.setHours(parseInt(workingHours.end.split(':')[0]));
        endTime.setMinutes(parseInt(workingHours.end.split(':')[1]));

        while (currentTime < endTime && sortedTasks.length > 0) {
            const task = sortedTasks[0];
            const duration = task.estimatedDuration || userPrefs.calendar.defaultEventDuration;

            // Check if there's a calendar event conflict
            const hasConflict = calendarEvents.some(event => {
                const eventStart = new Date(event.start.dateTime);
                const eventEnd = new Date(event.end.dateTime);
                return (currentTime >= eventStart && currentTime < eventEnd) ||
                       (new Date(currentTime.getTime() + duration) > eventStart &&
                        new Date(currentTime.getTime() + duration) <= eventEnd);
            });

            if (!hasConflict) {
                schedule.push({
                    task: task,
                    startTime: new Date(currentTime),
                    endTime: new Date(currentTime.getTime() + duration)
                });
                sortedTasks.shift();
            }

            // Add break if needed
            if (schedule.length % userPrefs.productivity.taskBatchSize === 0) {
                currentTime = new Date(currentTime.getTime() + 
                    userPrefs.productivity.breakPreferences.duration * 60000);
            }

            currentTime = new Date(currentTime.getTime() + duration);
        }

        return schedule;
    }

    getPriorityScore(priority) {
        switch (priority) {
            case 'high': return 3;
            case 'medium': return 2;
            case 'low': return 1;
            default: return 0;
        }
    }
}

export default new TaskScheduler();
