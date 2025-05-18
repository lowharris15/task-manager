import mongoose from 'mongoose';

const userPreferencesSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    
    // Notification Preferences
    notifications: {
        sms: {
            enabled: { type: Boolean, default: false },
            phoneNumber: String,
            preferences: {
                taskReminders: { type: Boolean, default: true },
                dailySummary: { type: Boolean, default: false },
                aiInsights: { type: Boolean, default: false }
            },
            quietHours: {
                start: { type: String, default: '22:00' }, // 24-hour format
                end: { type: String, default: '08:00' }
            }
        },
        email: {
            enabled: { type: Boolean, default: true },
            address: String,
            preferences: {
                taskReminders: { type: Boolean, default: true },
                dailySummary: { type: Boolean, default: true },
                aiInsights: { type: Boolean, default: true }
            }
        }
    },

    // Calendar Integration
    calendar: {
        googleCalendarId: String,
        syncEnabled: { type: Boolean, default: false },
        defaultEventDuration: { 
            type: Number, 
            default: 3600000 // 1 hour in milliseconds
        },
        workingHours: {
            enabled: { type: Boolean, default: true },
            sunday: { start: String, end: String },
            monday: { start: String, end: String },
            tuesday: { start: String, end: String },
            wednesday: { start: String, end: String },
            thursday: { start: String, end: String },
            friday: { start: String, end: String },
            saturday: { start: String, end: String }
        }
    },

    // Productivity Preferences
    productivity: {
        peakHours: [{
            day: { type: String, enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] },
            start: String,
            end: String
        }],
        breakPreferences: {
            frequency: { type: Number, default: 90 }, // minutes
            duration: { type: Number, default: 15 }   // minutes
        },
        taskBatchSize: { type: Number, default: 3 }
    },

    // AI Assistant Preferences
    aiPreferences: {
        enabled: { type: Boolean, default: true },
        adaptiveScheduling: { type: Boolean, default: true },
        learningStyle: {
            type: String,
            enum: ['conservative', 'moderate', 'aggressive'],
            default: 'moderate'
        },
        priorityWeights: {
            deadline: { type: Number, default: 0.4 },
            importance: { type: Number, default: 0.3 },
            effort: { type: Number, default: 0.2 },
            dependencies: { type: Number, default: 0.1 }
        },
        reminderFrequency: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        }
    },

    // Task Management Preferences
    taskPreferences: {
        defaultPriority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        defaultCategory: String,
        defaultTags: [String],
        autoArchiveCompleted: {
            enabled: { type: Boolean, default: true },
            afterDays: { type: Number, default: 30 }
        }
    },

    // UI Preferences
    uiPreferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system'
        },
        defaultView: {
            type: String,
            enum: ['list', 'calendar', 'kanban'],
            default: 'list'
        },
        taskSortOrder: {
            type: String,
            enum: ['priority', 'dueDate', 'createdAt'],
            default: 'dueDate'
        }
    }
}, {
    timestamps: true
});

// Middleware to set default working hours
userPreferencesSchema.pre('save', function(next) {
    const defaultHours = { start: '09:00', end: '17:00' };
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    days.forEach(day => {
        if (!this.calendar.workingHours[day]) {
            this.calendar.workingHours[day] = defaultHours;
        }
    });
    
    next();
});

// Instance methods
userPreferencesSchema.methods.isInQuietHours = function() {
    const now = new Date();
    const currentTime = now.getHours() + ':' + now.getMinutes();
    const start = this.notifications.sms.quietHours.start;
    const end = this.notifications.sms.quietHours.end;
    
    // Handle day wraparound
    if (start > end) {
        return currentTime >= start || currentTime < end;
    }
    return currentTime >= start && currentTime < end;
};

userPreferencesSchema.methods.isWorkingHours = function() {
    const now = new Date();
    const day = now.toLocaleLowerCase();
    const currentTime = now.getHours() + ':' + now.getMinutes();
    const workingHours = this.calendar.workingHours[day];
    
    return currentTime >= workingHours.start && currentTime < workingHours.end;
};

const UserPreferences = mongoose.model('UserPreferences', userPreferencesSchema);

export default UserPreferences;
