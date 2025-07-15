// Custom Dialog and Notification System
function showNotification(message, duration = 4000) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    const notificationClose = document.getElementById('notificationClose');
    
    notificationText.textContent = message;
    notification.classList.remove('hidden');
    
    const hideNotification = () => {
        notification.classList.add('hidden');
    };
    
    notificationClose.onclick = hideNotification;
    
    setTimeout(hideNotification, duration);
}

function showDialog(title, message, confirmCallback = null, showCancel = false) {
    const dialogOverlay = document.getElementById('dialog');
    const dialogTitle = document.getElementById('dialogTitle');
    const dialogMessage = document.getElementById('dialogMessage');
    const dialogConfirm = document.getElementById('dialogConfirm');
    const dialogCancel = document.getElementById('dialogCancel');
    
    dialogTitle.textContent = title;
    dialogMessage.textContent = message;
    
    if (showCancel) {
        dialogCancel.classList.remove('hidden');
    } else {
        dialogCancel.classList.add('hidden');
    }
    
    dialogOverlay.classList.remove('hidden');
    
    const hideDialog = () => {
        dialogOverlay.classList.add('hidden');
    };
    
    dialogConfirm.onclick = () => {
        hideDialog();
        if (confirmCallback) confirmCallback();
    };
    
    dialogCancel.onclick = hideDialog;
    
    // Close on overlay click
    dialogOverlay.onclick = (e) => {
        if (e.target === dialogOverlay) hideDialog();
    };
}

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function showLoginPage() {
    showPage('loginPage');
}

function showRegisterPage() {
    showPage('registerPage');
}

function showInboxPage() {
    showPage('inboxPage');
    loadInbox();
}

function logout() {
    db.logout();
    showLoginPage();
    showNotification('Logged out successfully! 👋');
}

function showComplaintPage() {
    showPage('complaintPage');
}

function showThankYouPage() {
    showPage('thankYouPage');
    generateReferenceNumber();
}

function generateReferenceNumber() {
    const prefix = 'LOVE';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const referenceNumber = `${prefix}-${year}-${random}`;
    document.getElementById('referenceNumber').textContent = referenceNumber;
}

function fileAnotherComplaint() {
    document.getElementById('complaintForm').reset();
    showComplaintPage();
}

function goBackToInbox() {
    showInboxPage();
}

function showDemo() {
    showDialog('Welcome to the Grievance Portal! 💔', 'Step 1: Register or login with your account\nStep 2: Send grievances to other users\nStep 3: Check your inbox for messages\n\nRemember: This is all in good fun! 😄');
}

async function loadInbox() {
    const currentUser = db.getCurrentUser();
    if (!currentUser) {
        showLoginPage();
        return;
    }
    
    document.getElementById('currentUsername').textContent = currentUser;
    
    try {
        const messages = await db.getMessagesForUser(currentUser);
        const messagesList = document.getElementById('messagesList');
        
        if (messages.length === 0) {
            messagesList.innerHTML = '<div class="no-messages">No messages yet! 📭<br><small>Your inbox is empty... for now!</small></div>';
            return;
        }
        
        messagesList.innerHTML = messages.map(msg => {
            const date = new Date(msg.timestamp).toLocaleDateString();
            const time = new Date(msg.timestamp).toLocaleTimeString();
            const readClass = msg.isRead ? 'read' : 'unread';
            
            return `
                <div class="message ${readClass}" onclick="markAsRead('${msg._id}')">
                    <div class="message-header">
                        <span class="sender">From: ${msg.from}</span>
                        <span class="timestamp">${date} ${time}</span>
                    </div>
                    <div class="message-mood">Mood: ${getMoodEmoji(msg.mood)} ${msg.mood}</div>
                    <div class="message-content">${msg.message}</div>
                    ${!msg.isRead ? '<div class="new-badge">NEW</div>' : ''}
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading inbox:', error);
        showNotification('Error loading messages');
    }
}

function getMoodEmoji(mood) {
    const moodEmojis = {
        'annoyed': '😤',
        'frustrated': '😠',
        'disappointed': '😞',
        'confused': '🤔',
        'hangry': '😋',
        'petty': '😏',
        'dramatic': '🎭'
    };
    return moodEmojis[mood] || '😐';
}

async function markAsRead(messageId) {
    try {
        await db.markMessageAsRead(messageId);
        loadInbox();
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (db.getCurrentUser()) {
        showInboxPage();
    }
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const complaintForm = document.getElementById('complaintForm');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitButton = loginForm.querySelector('button[type="submit"]');
        
        // Show loading animation
        showButtonLoading(submitButton, 'hearts');
        showFormLoading(loginForm);
        
        try {
            await db.loginUser(username, password);
            
            const unreadCount = await db.getUnreadCount(username);
            let message = `Welcome back, ${username}! 😊`;
            if (unreadCount > 0) {
                message += `\n\nYou have ${unreadCount} new message${unreadCount > 1 ? 's' : ''} waiting! 📬`;
            }
            
            showDialog('Login Successful!', message, () => {
                showInboxPage();
            });
        } catch (error) {
            showDialog('Login Failed', error.message + ' 🚫');
        } finally {
            // Hide loading animation
            hideButtonLoading(submitButton);
            hideFormLoading(loginForm);
        }
    });
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitButton = registerForm.querySelector('button[type="submit"]');
        
        if (password !== confirmPassword) {
            showDialog('Registration Error', 'Passwords do not match! 🔐');
            return;
        }
        
        // Show loading animation
        showButtonLoading(submitButton, 'pulse');
        showFormLoading(registerForm);
        
        try {
            await db.registerUser(username, password);
            showDialog('Registration Successful!', `Account created successfully! Welcome to the grievance family, ${username}! 🎉`, async () => {
                // Auto-login after registration
                await db.loginUser(username, password);
                showInboxPage();
            });
        } catch (error) {
            showDialog('Error', error.message + ' 🚫');
        } finally {
            // Hide loading animation
            hideButtonLoading(submitButton);
            hideFormLoading(registerForm);
        }
    });
    
    complaintForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentUser = db.getCurrentUser();
        if (!currentUser) {
            showDialog('Authentication Required', 'Please login first! 🔐', () => {
                showLoginPage();
            });
            return;
        }
        
        const recipientUsername = document.getElementById('partnerName').value;
        const mood = document.getElementById('mood').value;
        const grievance = document.getElementById('grievance').value;
        const urgent = false;
        const submitButton = complaintForm.querySelector('button[type="submit"]');
        
        if (!recipientUsername.trim() || !mood || !grievance.trim()) {
            showDialog('Missing Information', 'Please fill in all required fields! We need the full story! 📋');
            return;
        }
        
        // Show loading animation
        showButtonLoading(submitButton, 'dots');
        showFormLoading(complaintForm);
        showLoadingOverlay('Sending your grievance...', 'Delivering your message with love 💌');
        
        try {
            const messageId = await db.sendMessage(
                currentUser,
                recipientUsername,
                `Grievance from ${currentUser}`,
                grievance,
                mood,
                urgent
            );
            
            const moodResponses = {
                'annoyed': 'Annoyance sent! They\'ll understand soon... 😤',
                'frustrated': 'Frustration delivered! Relief incoming... 🤗',
                'disappointed': 'Disappointment noted and forwarded! 🍫',
                'confused': 'Confusion shared! Clarity requested... 🤔',
                'hangry': 'HANGRY ALERT SENT! Order food immediately! 🍕',
                'petty': 'Pettiness level documented and transmitted! 😏',
                'dramatic': 'Drama delivered with theatrical flair! 🎭'
            };
            
            const response = moodResponses[mood] || 'Your feelings have been documented!';
            showDialog('Message Sent!', `Message sent to ${recipientUsername}! 📨\n\n${response}`, () => {
                document.getElementById('complaintForm').reset();
                showThankYouPage();
            });
            
        } catch (error) {
            showDialog('Error', error.message + ' 🚫');
        } finally {
            // Hide loading animation
            hideButtonLoading(submitButton);
            hideFormLoading(complaintForm);
            hideLoadingOverlay();
        }
    });
    
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
    
    
});

const easterEggs = [
    'If you type "pizza" in the grievance, you get bonus points! 🍕',
    'Fun fact: 73% of relationship complaints are about leaving dishes in the sink! 🍽️',
    'Pro tip: "Fine" is never actually fine. Document accordingly! 😏',
    'Did you know? This portal was created by someone who clearly understands relationship struggles! 💔'
];

let easterEggCounter = 0;
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        showNotification(easterEggs[easterEggCounter % easterEggs.length], 6000);
        easterEggCounter++;
    }
});

// Loading Animation Functions
function showButtonLoading(button, type = 'spinner') {
    if (!button) return;
    
    // Store original text
    button.setAttribute('data-original-text', button.textContent);
    
    // Add loading class and type
    button.classList.add('loading');
    if (type !== 'spinner') {
        button.classList.add(type);
    }
    
    // Disable button
    button.disabled = true;
}

function hideButtonLoading(button) {
    if (!button) return;
    
    // Remove loading classes
    button.classList.remove('loading', 'hearts', 'dots', 'pulse');
    
    // Restore original text
    const originalText = button.getAttribute('data-original-text');
    if (originalText) {
        button.textContent = originalText;
        button.removeAttribute('data-original-text');
    }
    
    // Enable button
    button.disabled = false;
}

function showFormLoading(form) {
    if (!form) return;
    form.classList.add('form-loading');
}

function hideFormLoading(form) {
    if (!form) return;
    form.classList.remove('form-loading');
}

function showLoadingOverlay(text = 'Processing your request...', subtext = 'Please wait while we work our magic 💕') {
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-hearts">💕💖💗</div>
                <div class="loading-text">${text}</div>
                <div class="loading-subtext">${subtext}</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    overlay.classList.add('active');
}

function hideLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}