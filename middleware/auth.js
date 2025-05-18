// Simple authentication middleware for development
// In production, you would want to implement proper authentication

import mongoose from 'mongoose';

const auth = (req, res, next) => {
    try {
        // For development, we'll use a default test user ID
        const userId = process.env.TEST_USER_ID || '65d6a8f25c12345678901234';
        
        // Validate that it's a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('Invalid user ID');
        }

        req.user = {
            id: new mongoose.Types.ObjectId(userId)
        };

        console.log('Auth middleware - User ID:', userId);
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            success: false,
            message: 'Authentication failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export default auth;
