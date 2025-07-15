const { getMessagesForUser, markMessageAsRead, getUnreadCount } = require('../../lib/mongodb-vercel');

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    const { username } = req.query;
    
    if (req.method === 'GET') {
        // Check if requesting unread count
        if (req.url.includes('/unread-count')) {
            try {
                const unreadCount = await getUnreadCount(username.toLowerCase());
                res.json({ unreadCount });
            } catch (error) {
                console.error('Error fetching unread count:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
            return;
        }
        
        // Get messages for user
        try {
            const userMessages = await getMessagesForUser(username.toLowerCase());
            res.json(userMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    } else if (req.method === 'PATCH') {
        // Mark message as read (when messageId is in the path)
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