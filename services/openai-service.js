import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

class OpenAIService {
    static async getTaskSuggestions(tasks, userPreferences) {
        try {
            const response = await client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a task management assistant that helps prioritize and organize tasks."
                    },
                    {
                        role: "user",
                        content: JSON.stringify({
                            tasks: tasks,
                            preferences: userPreferences,
                            request: "Please analyze these tasks and provide prioritization suggestions."
                        })
                    }
                ]
            });
            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error getting task suggestions:', error);
            return "Unable to generate task suggestions at this time.";
        }
    }

    static async getProductivityInsights(taskHistory) {
        try {
            console.log('Getting productivity insights for tasks:', taskHistory);
            
            if (!Array.isArray(taskHistory) || taskHistory.length === 0) {
                console.log('No tasks to analyze');
                return "No tasks available for analysis. Add some tasks to get productivity insights.";
            }

            const taskSummary = taskHistory.map(task => ({
                title: task.title,
                status: task.status,
                priority: task.priority,
                createdAt: task.createdAt,
                completedAt: task.completedAt
            }));

            console.log('Sending request to OpenAI API...');
            const response = await client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a productivity assistant analyzing task patterns and providing insights. Keep your analysis concise and actionable."
                    },
                    {
                        role: "user",
                        content: `Please analyze these tasks and provide productivity insights: ${JSON.stringify(taskSummary)}`
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            });

            console.log('Received response from OpenAI:', response);

            if (!response.choices || !response.choices[0] || !response.choices[0].message) {
                throw new Error('Invalid response format from OpenAI API');
            }

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error getting productivity insights:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            if (error.response) {
                console.error('OpenAI API error response:', error.response.data);
            }
            
            throw new Error('Failed to generate productivity insights. Please try again later.');
        }
    }

    static async getChatResponse(userMessage, taskContext) {
        try {
            const response = await client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a task management assistant helping users with their tasks and schedules."
                    },
                    {
                        role: "user",
                        content: JSON.stringify({
                            message: userMessage,
                            context: taskContext,
                            request: "Please respond to the user's question about their tasks."
                        })
                    }
                ]
            });
            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error getting chat response:', error);
            return "I'm unable to process your request at the moment.";
        }
    }
}

export default OpenAIService;
