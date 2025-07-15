const { markMessageAsRead } = require('../../lib/mongodb-vercel');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { messageId } = req.body;
    
    if (!messageId) {
        return res.status(400).json({ error: 'Message ID is required' });
    }
    
    try {
        await markMessageAsRead(messageId);
        res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}