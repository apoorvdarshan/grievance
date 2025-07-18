const { getMessagesForUser, markMessageAsRead } = require('../lib/mongodb-vercel');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    const { username } = req.query;
    
    if (!username) {
        return res.status(400).json({ error: 'Username query parameter is required' });
    }
    
    if (req.method === 'GET') {
        // Get messages for user
        try {
            const userMessages = await getMessagesForUser(username.toLowerCase());
            res.json(userMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    } else if (req.method === 'PATCH') {
        // Mark message as read
        try {
            const messageId = req.body.messageId;
            await markMessageAsRead(messageId);
            res.json({ success: true, message: 'Message marked as read' });
        } catch (error) {
            console.error('Error marking message as read:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}