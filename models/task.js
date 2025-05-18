import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    description: String,
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high'], 
        default: 'low' 
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'postponed'],
        default: 'pending'
    },
    startDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    estimatedDuration: {
        type: Number,  // in milliseconds
        default: 3600000 // 1 hour
    },
    completedAt: {
        type: Date
    },
    tags: [{
        type: String
    }],
    category: {
        type: String
    },
    recurring: {
        type: Boolean,
        default: false
    },
    recurringPattern: {
        type: String,  // daily, weekly, monthly, etc.
    },
    reminderTime: {
        type: Date
    },
    calendarEventId: {
        type: String  // Google Calendar event ID
    },
    aiSuggestions: {
        priority: String,
        scheduledTime: Date,
        insights: String
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date 
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

// Add indexes for common queries
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, priority: 1 });

// Pre-save middleware
taskSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Instance methods
taskSchema.methods.postpone = function(newDueDate) {
    this.dueDate = newDueDate;
    this.status = 'postponed';
    return this.save();
};

taskSchema.methods.complete = function() {
    this.status = 'completed';
    this.completedAt = new Date();
    return this.save();
};

taskSchema.methods.reschedule = async function(newStartDate, newDueDate) {
    this.startDate = newStartDate;
    this.dueDate = newDueDate;
    return this.save();
};

// Static methods
taskSchema.statics.findOverdueTasks = function(userId) {
    return this.find({
        userId,
        status: { $ne: 'completed' },
        dueDate: { $lt: new Date() }
    });
};

taskSchema.statics.findUpcomingTasks = function(userId, days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.find({
        userId,
        status: { $ne: 'completed' },
        dueDate: {
            $gte: new Date(),
            $lte: futureDate
        }
    }).sort('dueDate');
};

taskSchema.statics.getProductivityStats = function(userId, startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                userId: mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                averageCompletionTime: {
                    $avg: {
                        $cond: [
                            { $eq: ['$status', 'completed'] },
                            { $subtract: ['$completedAt', '$createdAt'] },
                            0
                        ]
                    }
                }
            }
        }
    ]);
};

const Task = mongoose.model('Task', taskSchema);

export default Task;
