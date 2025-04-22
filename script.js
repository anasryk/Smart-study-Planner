
// DOM Elements
const taskForm = document.getElementById('taskForm');
const subjectInput = document.getElementById('subject');
const dueDateInput = document.getElementById('dueDate');
const descriptionInput = document.getElementById('description');
const tasksContainer = document.getElementById('tasksContainer');
const clockElement = document.getElementById('clock');
const themeToggle = document.getElementById('themeToggle');
const filterButtons = document.querySelectorAll('.filter-btn');
const progressFill = document.getElementById('progressFill');
const completedCountElement = document.getElementById('completedCount');
const totalCountElement = document.getElementById('totalCount');

// App State
let tasks = [];
let currentFilter = 'all';
let darkMode = false;

// Initialize app
function init() {
    loadTasks();
    updateClock();
    setInterval(updateClock, 1000);
    setInterval(checkExpiredTasks, 60000); // Check for expired tasks every minute
    renderTasks();

    // Load theme preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
        toggleTheme();
    }
}

// Toggle dark/light theme
function toggleTheme() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode', darkMode);
    themeToggle.textContent = darkMode ? '☀️' : '🌙';
    localStorage.setItem('darkMode', darkMode.toString());
}

// Update clock display
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockElement.textContent = `${hours}:${minutes}:${seconds}`;
}

// Load tasks from localStorage
function loadTasks() {
    const savedTasks = localStorage.getItem('studyTasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('studyTasks', JSON.stringify(tasks));
    updateProgress();
}

// Update progress bar and stats
function updateProgress() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;

    const progressPercentage = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;
    progressFill.style.width = `${progressPercentage}%`;

    completedCountElement.textContent = `${completedTasks} completed`;
    totalCountElement.textContent = `${totalTasks} total`;
}

// Add a new task
function addTask(subject, description, dueDate) {
    const newTask = {
        id: Date.now(),
        subject,
        description,
        dueDate,
        createdAt: new Date().toISOString(),
        completed: false
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
}

// Delete a task
function deleteTask(id) {
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
        taskElement.classList.add('fade-out');
        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
        }, 1000);
    }
}

// Toggle completion status of a task
function toggleTaskCompletion(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

// Check if a task is expired
function isExpired(task) {
    if (!task.dueDate) return false;

    const dueDate = new Date(task.dueDate);
    const now = new Date();
    return dueDate < now;
}

// Check expired tasks and highlight/remove them
function checkExpiredTasks() {
    let hasExpiredTasks = false;

    tasks.forEach(task => {
        if (isExpired(task) && !task.completed) {
            hasExpiredTasks = true;
        }
    });

    if (hasExpiredTasks) {
        renderTasks();
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.setHours(0, 0, 0, 0) === now.setHours(0, 0, 0, 0);
    const isTomorrow = date.setHours(0, 0, 0, 0) === tomorrow.setHours(0, 0, 0, 0);

    if (isToday) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
        return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Filter tasks based on current filter
function filterTasks() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (currentFilter) {
        case 'today':
            return tasks.filter(task => {
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate);
                return dueDate >= today && dueDate < tomorrow;
            });
        case 'upcoming':
            return tasks.filter(task => {
                if (!task.dueDate) return true;
                const dueDate = new Date(task.dueDate);
                return dueDate >= tomorrow;
            });
        case 'completed':
            return tasks.filter(task => task.completed);
        default:
            return tasks;
    }
}

// Render tasks to the DOM
function renderTasks() {
    const filteredTasks = filterTasks();

    // Clear container
    tasksContainer.innerHTML = '';

    if (filteredTasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
     <div class="empty-icon">📚</div>
     <p>No tasks found</p>
     <p>Add a new study task to get started</p>
 `;
        tasksContainer.appendChild(emptyState);
        return;
    }

    filteredTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-card fade-in ${task.completed ? 'completed' : ''} ${!task.completed && isExpired(task) ? 'expired' : ''}`;
        taskElement.dataset.id = task.id;

        const taskHTML = `
     <div class="task-header">
         <div>
             <div class="task-subject">${task.subject}</div>
             ${task.dueDate ? `<div class="task-date">${formatDate(task.dueDate)}</div>` : ''}
         </div>
         <div class="task-actions">
             <button class="task-btn complete" title="Mark as ${task.completed ? 'incomplete' : 'complete'}">
                 ${task.completed ? '↩️' : '✓'}
             </button>
             <button class="task-btn delete" title="Delete task">🗑️</button>
         </div>
     </div>
     <div class="task-description">${task.description}</div>
     <div class="task-footer">
         <div>Added ${new Date(task.createdAt).toLocaleDateString()}</div>
         ${task.completed ? '<div class="completed-badge">Completed</div>' : ''}
         ${!task.completed && isExpired(task) ? '<div class="expired-badge">Expired</div>' : ''}
     </div>
 `;

        taskElement.innerHTML = taskHTML;

        // Add event listeners
        const deleteBtn = taskElement.querySelector('.delete');
        const completeBtn = taskElement.querySelector('.complete');

        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        completeBtn.addEventListener('click', () => toggleTaskCompletion(task.id));

        tasksContainer.appendChild(taskElement);

        // Fade out expired tasks after showing them briefly
        if (!task.completed && isExpired(task)) {
            setTimeout(() => {
                taskElement.classList.add('fade-out');
            }, 5000);
        }
    });
}

// Event Listeners
taskForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const subject = subjectInput.value.trim();
    const description = descriptionInput.value.trim();
    const dueDate = dueDateInput.value;

    if (subject) {
        addTask(subject, description, dueDate);
        taskForm.reset();
    }
});

themeToggle.addEventListener('click', toggleTheme);

filterButtons.forEach(button => {
    button.addEventListener('click', function () {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        renderTasks();
    });
});

// Initialize the app
init();
