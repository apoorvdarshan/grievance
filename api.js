// API functions for server communication
const API_BASE = '/api';

class ServerDatabase {
    constructor() {
        this.currentUser = sessionStorage.getItem('grievance_current_user') || null;
    }

    async registerUser(username, password) {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error);
        }
        
        return true;
    }

    async loginUser(username, password) {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error);
        }
        
        this.currentUser = data.username;
        sessionStorage.setItem('grievance_current_user', this.currentUser);
        return true;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    async getAllUsers() {
        try {
            const response = await fetch(`${API_BASE}/users`);
            const users = await response.json();
            return Object.keys(users).filter(user => user !== this.currentUser);
        } catch (error) {
            return [];
        }
    }

    async sendMessage(fromUser, toUser, subject, message, mood, isUrgent = false) {
        const response = await fetch(`${API_BASE}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fromUser,
                toUser,
                subject,
                message,
                mood
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error);
        }
        
        return data.messageId;
    }

    async getMessagesForUser(username) {
        try {
            const response = await fetch(`${API_BASE}/messages/${username}`);
            const messages = await response.json();
            return messages;
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    }

    async markMessageAsRead(messageId) {
        try {
            await fetch(`${API_BASE}/messages/${messageId}/read`, {
                method: 'PATCH'
            });
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    }

    async getUnreadCount(username) {
        try {
            const response = await fetch(`${API_BASE}/messages/${username}/unread-count`);
            const data = await response.json();
            return data.unreadCount;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('grievance_current_user');
    }

    async clearAllData() {
        try {
            await fetch(`${API_BASE}/clear-all`, {
                method: 'DELETE'
            });
            this.logout();
        } catch (error) {
            console.error('Error clearing data:', error);
        }
    }
}

// Replace the old database with server-based one
const db = new ServerDatabase();