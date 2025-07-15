require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const {
    findUser,
    createUser,
    updateUserLogin,
    getAllUsers,
    createMessage,
    getMessagesForUser,
    markMessageAsRead,
    getUnreadCount,
    clearAllData
} = require('./lib/mongodb');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// MongoDB connection will be handled by the utility functions

// Routes

// Get all users (for debugging - remove in production)
app.get('/api/users', async (req, res) => {
    try {
        const users = await getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register user
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    try {
        const lowerUsername = username.toLowerCase().trim();
        
        // Check if user already exists
        const existingUser = await findUser(lowerUsername);
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists! Please choose another one.' });
        }
        
        // Create new user
        await createUser({
            username: lowerUsername,
            password: password
        });
        
        res.json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login user
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    try {
        const lowerUsername = username.toLowerCase().trim();
        
        // Find user in database
        const user = await findUser(lowerUsername);
        if (!user) {
            return res.status(404).json({ error: 'Username not found! Please register first.' });
        }
        
        if (user.password !== password) {
            return res.status(401).json({ error: 'Incorrect password!' });
        }
        
        // Update last login
        await updateUserLogin(lowerUsername);
        
        res.json({ 
            success: true, 
            username: lowerUsername,
            message: 'Login successful' 
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send message
app.post('/api/messages', async (req, res) => {
    const { fromUser, toUser, subject, message, mood } = req.body;
    
    if (!fromUser || !toUser || !message) {
        return res.status(400).json({ error: 'From user, to user, and message are required' });
    }
    
    try {
        const lowerToUser = toUser.toLowerCase().trim();
        
        // Check if recipient exists
        const recipient = await findUser(lowerToUser);
        if (!recipient) {
            return res.status(404).json({ error: 'Recipient username not found!' });
        }
        
        // Create message
        const result = await createMessage({
            from: fromUser,
            to: lowerToUser,
            subject: subject || `Message from ${fromUser}`,
            message: message,
            mood: mood || 'neutral'
        });
        
        res.json({ 
            success: true, 
            messageId: result.insertedId,
            message: 'Message sent successfully' 
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get messages for user
app.get('/api/messages/:username', async (req, res) => {
    try {
        const username = req.params.username.toLowerCase();
        const userMessages = await getMessagesForUser(username);
        res.json(userMessages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark message as read
app.patch('/api/messages/:messageId/read', async (req, res) => {
    try {
        const messageId = req.params.messageId;
        await markMessageAsRead(messageId);
        res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get unread count for user
app.get('/api/messages/:username/unread-count', async (req, res) => {
    try {
        const username = req.params.username.toLowerCase();
        const unreadCount = await getUnreadCount(username);
        res.json({ unreadCount });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Clear all data (for testing)
app.delete('/api/clear-all', async (req, res) => {
    try {
        await clearAllData();
        res.json({ success: true, message: 'All data cleared' });
    } catch (error) {
        console.error('Error clearing data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Grievance Portal server running at http://localhost:${PORT}`);
    console.log(`📊 Data stored in: MongoDB Atlas`);
    console.log(`🔗 Connect your MongoDB URI in environment variables`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Server shutting down gracefully...');
    process.exit(0);
});