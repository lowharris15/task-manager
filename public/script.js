let tasks = [];
let userPreferences = null;
const API_URL = 'http://localhost:5000/api';

// Load user preferences
async function loadUserPreferences() {
    try {
        const response = await fetch(`${API_URL}/preferences`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        userPreferences = await response.json();
    } catch (error) {
        console.error('Error loading user preferences:', error);
        showError('Failed to load user preferences');
    }
}

// Debug mode
const DEBUG = true;

// Debug logging function
function debugLog(...args) {
    if (DEBUG) {
        console.log('[DEBUG]', ...args);
    }
}

// Function to fetch tasks and insights from API
async function fetchTasks() {
    try {
        debugLog('Fetching tasks from API...');
        const response = await fetch(`${API_URL}/tasks`);
        debugLog('Response status:', response.status);
        
        const responseText = await response.text();
        debugLog('Raw response:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            throw new Error('Invalid JSON response');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${data.message || 'Unknown error'}`);
        }
        
        debugLog('Parsed response data:', data);
        
        // Validate response data
        if (!data.success || !Array.isArray(data.tasks)) {
            throw new Error(`Invalid response format: ${JSON.stringify(data)}`);
        }
        
        tasks = data.tasks;
        debugLog('Tasks loaded:', tasks);
        renderTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        showError(`Failed to load tasks: ${error.message}`);
    }
}

// Function to show error message
function showError(message, type = 'error') {
    const errorDiv = document.createElement('div');
    errorDiv.className = `error-message ${type}`;
    errorDiv.textContent = message;
    
    // Remove after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
    
    // Insert at top of container
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
}

// Function to create a task element
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.priority}-priority`;
    
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date';
    const aiSuggestions = task.aiSuggestions?.insights ? 
        `<div class="ai-suggestions">${escapeHtml(task.aiSuggestions.insights)}</div>` : '';
    
    taskElement.innerHTML = `
        <div class="task-content">
            <div class="task-title">${escapeHtml(task.title)}</div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-metadata">
                <span class="due-date">Due: ${dueDate}</span>
                <span class="priority">Priority: ${task.priority}</span>
            </div>
            ${aiSuggestions}
        </div>
        <div class="task-actions">
            <button class="edit-btn" onclick="editTask('${task._id}')">Edit</button>
            <button class="delete-btn" onclick="deleteTask('${task._id}')">Delete</button>
            <button class="schedule-btn" onclick="scheduleTask('${task._id}')">Schedule</button>
        </div>
    `;
    
    return taskElement;
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Function to render tasks
function renderTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) {
        console.error('Task list element not found');
        return;
    }
    
    taskList.innerHTML = '';
    
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filterPriority = document.getElementById('filterPriority')?.value || 'all';
    
    if (!Array.isArray(tasks)) {
        console.error('Tasks is not an array:', tasks);
        return;
    }
    
    tasks.forEach(task => {
        try {
            // Apply filters
            if ((filterPriority === 'all' || task.priority === filterPriority) &&
                (task.title.toLowerCase().includes(searchTerm) || 
                 (task.description && task.description.toLowerCase().includes(searchTerm)))) {
                taskList.appendChild(createTaskElement(task));
            }
        } catch (error) {
            console.error('Error rendering task:', error, task);
        }
    });
}

// Function to add a new task
async function addTask(event) {
    if (event) {
        event.preventDefault();
    }
    
    // If we're in edit mode, redirect to updateTask
    const addButton = document.getElementById('addButton');
    if (addButton && addButton.textContent === 'Update Task') {
        const taskId = addButton.getAttribute('data-task-id');
        if (taskId) {
            return updateTask(taskId);
        }
    }

    console.log('Add Task button clicked');
    debugLog('Adding new task...');
    
    try {
        const elements = {
            title: document.getElementById('taskInput'),
            description: document.getElementById('taskDescription'),
            priority: document.getElementById('taskPriority'),
            startDate: document.getElementById('taskStartDate'),
            dueDate: document.getElementById('taskDueDate'),
            duration: document.getElementById('taskDuration')
        };
        
        debugLog('Form elements:', elements);
        
        // Validate that all required elements exist
        Object.entries(elements).forEach(([key, element]) => {
            if (!element) {
                throw new Error(`Required element not found: ${key}`);
            }
        });
    
        const title = elements.title.value.trim();
        if (!title) {
            showError('Please enter a task title');
            return;
        }
    
        const task = {
            title: title,
            description: elements.description.value.trim(),
            priority: elements.priority.value,
            startDate: elements.startDate.value || null,
            dueDate: elements.dueDate.value || null,
            estimatedDuration: elements.duration.value
        };
        
        debugLog('Task data to send:', task);
    
        debugLog('Sending POST request to create task...');
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(task)
        });

        debugLog('Response status:', response.status);
        const responseText = await response.text();
        debugLog('Raw response:', responseText);

        let result;
        try {
            result = JSON.parse(responseText);
            debugLog('Parsed response:', result);
        } catch (parseError) {
            console.error('Error parsing response:', parseError);
            throw new Error('Invalid JSON response from server');
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${result.message || 'Unknown error'}`);
        }

        if (!result.success) {
            throw new Error(result.message || 'Failed to create task');
        }
        
        // Clear inputs
        elements.title.value = '';
        elements.description.value = '';
        elements.priority.value = 'low';
        elements.startDate.value = '';
        elements.dueDate.value = '';
        elements.duration.value = '3600000';
        
        await fetchTasks(); // Refresh task list
        showError('Task created successfully', 'success');
    } catch (error) {
        console.error('Error adding task:', error);
        showError(`Failed to add task: ${error.message}`);
        throw error; // Re-throw to see error in console
    }
}

// Function to request and display AI insights
async function getAIInsights() {
    try {
        debugLog('Requesting AI insights...');
        const insightsResponse = await fetch(`${API_URL}/insights`);
        
        const responseText = await insightsResponse.text();
        debugLog('Raw insights response:', responseText);
        
        let insightsData;
        try {
            insightsData = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Error parsing insights response:', parseError);
            throw new Error('Invalid response format from server');
        }

        if (!insightsResponse.ok) {
            throw new Error(insightsData.message || 'Failed to fetch insights');
        }

        if (!insightsData.success) {
            throw new Error(insightsData.message || 'Failed to generate insights');
        }

        debugLog('Insights data:', insightsData);
        
        // Get schedule data
        debugLog('Requesting schedule data...');
        const scheduleResponse = await fetch(`${API_URL}/schedule`);
        const scheduleData = await scheduleResponse.json();
        debugLog('Schedule data:', scheduleData);

        displayAIInsights(insightsData.insights, scheduleData.schedule);

        // Send notifications if enabled
        if (userPreferences?.notifications?.enabled) {
            const notifyResponse = await fetch(`${API_URL}/notifications/insights`, { 
                method: 'POST'
            });
            if (!notifyResponse.ok) {
                console.error('Failed to send notification');
            }
        }
    } catch (error) {
        console.error('Error getting AI insights:', error);
        showError(error.message || 'Failed to get AI insights');
    }
}

// Function to display AI insights in a modal
function displayAIInsights(insights, schedule = null) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    let content = `
        <div class="modal-content">
            <h2>AI Task Insights</h2>
            <p>${insights || 'No insights available'}</p>
    `;

    if (schedule && Array.isArray(schedule)) {
        content += `
            <h3>Suggested Schedule</h3>
            <div class="schedule-container">
        `;

        schedule.forEach((slot, index) => {
            if (slot.task && slot.startTime && slot.endTime) {
                content += `
                    <div class="schedule-item ${slot.task.priority || 'low'}-priority">
                        <div class="schedule-time">
                            ${new Date(slot.startTime).toLocaleTimeString()} - 
                            ${new Date(slot.endTime).toLocaleTimeString()}
                        </div>
                        <div class="schedule-task">
                            <strong>${escapeHtml(slot.task.title)}</strong>
                            ${slot.task.description ? `<br>${escapeHtml(slot.task.description)}` : ''}
                        </div>
                    </div>
                `;
            }
        });

        content += `</div>`;
    }

    content += `
            <div class="modal-actions">
                <button onclick="reprioritizeTasks()">Apply AI Suggestions</button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()">Close</button>
            </div>
        </div>
    `;

    modal.innerHTML = content;
    document.body.appendChild(modal);
}

// Function to request daily summary
async function requestDailySummary() {
    try {
        const response = await fetch(`${API_URL}/notifications/summary`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        showError('Daily summary sent successfully', 'success');
    } catch (error) {
        console.error('Error requesting daily summary:', error);
        showError('Failed to send daily summary');
    }
}

// Function to edit a task
async function editTask(id) {
    if (!id) return;
    
    const task = tasks.find(t => t._id === id);
    if (!task) {
        console.error('Task not found:', id);
        return;
    }
    
    const elements = {
        title: document.getElementById('taskInput'),
        description: document.getElementById('taskDescription'),
        priority: document.getElementById('taskPriority'),
        startDate: document.getElementById('taskStartDate'),
        dueDate: document.getElementById('taskDueDate'),
        duration: document.getElementById('taskDuration')
    };
    
    // Update form fields
    if (elements.title) elements.title.value = task.title;
    if (elements.description) elements.description.value = task.description || '';
    if (elements.priority) elements.priority.value = task.priority;
    if (elements.startDate) elements.startDate.value = task.startDate || '';
    if (elements.dueDate) elements.dueDate.value = task.dueDate || '';
    if (elements.duration) elements.duration.value = task.estimatedDuration || 3600000;
    
    // Change add button to update
    const addButton = document.getElementById('addButton');
    if (addButton) {
        addButton.textContent = 'Update Task';
        addButton.setAttribute('data-task-id', id);
    }
}

// Function to update a task
async function updateTask(id) {
    if (!id) {
        console.error('No task ID provided for update');
        return;
    }

    const elements = {
        title: document.getElementById('taskInput'),
        description: document.getElementById('taskDescription'),
        priority: document.getElementById('taskPriority'),
        startDate: document.getElementById('taskStartDate'),
        dueDate: document.getElementById('taskDueDate'),
        duration: document.getElementById('taskDuration')
    };
    
    const title = elements.title?.value.trim();
    if (!title) {
        showError('Please enter a task title');
        return;
    }
    
    const updatedTask = {
        title: title,
        description: elements.description?.value.trim() || '',
        priority: elements.priority?.value || 'low',
        startDate: elements.startDate?.value || null,
        dueDate: elements.dueDate?.value || null,
        estimatedDuration: elements.duration?.value || 3600000
    };
    
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedTask)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Reset form
        if (elements.title) elements.title.value = '';
        if (elements.description) elements.description.value = '';
        if (elements.priority) elements.priority.value = 'low';
        if (elements.startDate) elements.startDate.value = '';
        if (elements.dueDate) elements.dueDate.value = '';
        if (elements.duration) elements.duration.value = '';
        
        // Reset add button
        const addButton = document.getElementById('addButton');
        if (addButton) {
            addButton.textContent = 'Add Task';
            addButton.onclick = addTask;
        }
        
        await fetchTasks(); // Refresh task list
        showError('Task updated successfully', 'success');
    } catch (error) {
        console.error('Error updating task:', error);
        showError('Failed to update task');
    }
}

// Function to delete a task
async function deleteTask(id) {
    if (!id) return;

    if (confirm('Are you sure you want to delete this task?')) {
        try {
            const response = await fetch(`${API_URL}/tasks/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchTasks(); // Refresh task list
            showError('Task deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting task:', error);
            showError('Failed to delete task');
        }
    }
}

// Function to filter tasks
function filterTasks() {
    renderTasks();
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Add AI Insights button
        const container = document.querySelector('.container');
        if (!container) {
            throw new Error('Container element not found');
        }

        const insightsButton = document.createElement('button');
        insightsButton.textContent = 'Get AI Insights';
        insightsButton.onclick = getAIInsights;
        insightsButton.className = 'insights-btn';
        container.insertBefore(insightsButton, container.firstChild.nextSibling);
        
        // Add Daily Summary button
        const summaryButton = document.createElement('button');
        summaryButton.textContent = 'Get Daily Summary';
        summaryButton.onclick = requestDailySummary;
        summaryButton.className = 'summary-btn';
        container.insertBefore(summaryButton, insightsButton.nextSibling);
        
        // Add event listener for Add Task button
        const addButton = document.getElementById('addButton');
        if (addButton) {
            addButton.addEventListener('click', () => {
                console.log('Add Task button clicked (event listener)');
                addTask();
            });
        } else {
            console.error('Add Task button not found');
        }

        // Load user preferences and tasks
        await loadUserPreferences();
        await fetchTasks();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize application');
    }
});
