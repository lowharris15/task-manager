from googlevoice import Voice
from googlevoice.util import input
import json
import os
from datetime import datetime

class SMSService:
    def __init__(self):
        self.voice = Voice()
        # Load credentials from environment variables
        self.voice.login(email=os.getenv('GOOGLE_VOICE_EMAIL'), 
                        passwd=os.getenv('GOOGLE_VOICE_PASSWORD'))

    def send_task_reminder(self, phone_number, task):
        """
        Send a task reminder via SMS
        """
        try:
            # Format the message
            message = f"Task Reminder: {task['title']}\n"
            if task.get('description'):
                message += f"Description: {task['description']}\n"
            if task.get('dueDate'):
                due_date = datetime.fromisoformat(task['dueDate'])
                message += f"Due: {due_date.strftime('%B %d, %Y at %I:%M %p')}\n"
            message += f"Priority: {task['priority']}"

            # Send the SMS
            self.voice.send_sms(phone_number, message)
            return True
        except Exception as e:
            print(f"Error sending SMS: {str(e)}")
            return False

    def send_daily_summary(self, phone_number, tasks):
        """
        Send a daily summary of tasks via SMS
        """
        try:
            message = "Daily Task Summary:\n\n"
            
            # Group tasks by priority
            priority_tasks = {
                'high': [],
                'medium': [],
                'low': []
            }
            
            for task in tasks:
                priority_tasks[task['priority']].append(task['title'])
            
            # Format message
            if priority_tasks['high']:
                message += "High Priority:\n- "
                message += "\n- ".join(priority_tasks['high']) + "\n\n"
            
            if priority_tasks['medium']:
                message += "Medium Priority:\n- "
                message += "\n- ".join(priority_tasks['medium']) + "\n\n"
            
            if priority_tasks['low']:
                message += "Low Priority:\n- "
                message += "\n- ".join(priority_tasks['low'])

            # Send the SMS
            self.voice.send_sms(phone_number, message)
            return True
        except Exception as e:
            print(f"Error sending daily summary: {str(e)}")
            return False

    def send_ai_insights(self, phone_number, insights):
        """
        Send AI-generated insights via SMS
        """
        try:
            message = "AI Task Insights:\n\n"
            message += insights[:1000]  # Limit message length
            
            self.voice.send_sms(phone_number, message)
            return True
        except Exception as e:
            print(f"Error sending AI insights: {str(e)}")
            return False

# Example usage:
# sms_service = SMSService()
# sms_service.send_task_reminder("+1234567890", {
#     "title": "Complete project report",
#     "description": "Finish Q4 analysis",
#     "dueDate": "2024-02-22T15:00:00",
#     "priority": "high"
# })
