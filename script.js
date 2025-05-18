let tasks = [];
const API_URL = 'http://localhost:5000/api';

// Function to fetch tasks from API
async function fetchTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`);
        tasks = await response.json();
        renderTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

// Function to get AI insights
async function getAIInsights() {
    try {
        const response = await fetch(`${API_URL}/insights`);
        const data = await response.json();
        
        // Create a modal to display insights
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>AI Task Insights</h2>
                <p>${data.insights}</p>
                <button onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error getting AI insights:', error);
    }
}

// Function to create a task element
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.priority}-priority`;
    
    taskElement.innerHTML = `
        <div class="task-content">
            <div class="task-title">${task.title}</div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
        </div>
        <div class="task-actions">
            <button class="edit-btn" onclick="editTask('${task._id}')">Edit</button>
            <button class="delete-btn" onclick="deleteTask('${task._id}')">Delete</button>
        </div>
    `;
    
    return taskElement;
}

// Function to render tasks
function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterPriority = document.getElementById('filterPriority').value;
    
    tasks.forEach(task => {
        // Apply filters
        if ((filterPriority === 'all' || task.priority === filterPriority) &&
            (task.title.toLowerCase().includes(searchTerm) || 
             (task.description && task.description.toLowerCase().includes(searchTerm)))) {
            taskList.appendChild(createTaskElement(task));
        }
    });
}

// Function to add a new task
async function addTask() {
    const titleInput = document.getElementById('taskInput');
    const descInput = document.getElementById('taskDescription');
    const prioritySelect = document.getElementById('taskPriority');
    
    const title = titleInput.value.trim();
    if (!title) {
        alert('Please enter a task title');
        return;
    }
    
    const task = {
        title: title,
        description: descInput.value.trim(),
        priority: prioritySelect.value
    };
    
    try {
        await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        });
        
        // Clear inputs
        titleInput.value = '';
        descInput.value = '';
        prioritySelect.value = 'low';
        
        fetchTasks(); // Refresh task list
    } catch (error) {
        console.error('Error adding task:', error);
    }
}

// Function to edit a task
async function editTask(id) {
    const task = tasks.find(t => t._id === id);
    if (!task) return;
    
    document.getElementById('taskInput').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskPriority').value = task.priority;
    
    // Change add button to update
    const addButton = document.getElementById('addButton');
    addButton.textContent = 'Update Task';
    addButton.onclick = () => updateTask(id);
}

// Function to update a task
async function updateTask(id) {
    const titleInput = document.getElementById('taskInput');
    const descInput = document.getElementById('taskDescription');
    const prioritySelect = document.getElementById('taskPriority');
    
    const title = titleInput.value.trim();
    if (!title) {
        alert('Please enter a task title');
        return;
    }
    
    const updatedTask = {
        title: title,
        description: descInput.value.trim(),
        priority: prioritySelect.value
    };
    
    try {
        await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedTask)
        });
        
        // Reset form
        titleInput.value = '';
        descInput.value = '';
        prioritySelect.value = 'low';
        
        // Reset add button
        const addButton = document.getElementById('addButton');
        addButton.textContent = 'Add Task';
        addButton.onclick = addTask;
        
        fetchTasks(); // Refresh task list
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

// Function to delete a task
async function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        try {
            await fetch(`${API_URL}/tasks/${id}`, {
                method: 'DELETE'
            });
            fetchTasks(); // Refresh task list
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }
}

// Function to filter tasks
function filterTasks() {
    renderTasks();
}

// Add AI Insights button to the page
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    const insightsButton = document.createElement('button');
    insightsButton.textContent = 'Get AI Insights';
    insightsButton.onclick = getAIInsights;
    insightsButton.className = 'insights-btn';
    container.insertBefore(insightsButton, container.firstChild.nextSibling);
    
    // Initial fetch
    fetchTasks();
});
