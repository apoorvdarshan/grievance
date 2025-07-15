const { findUser, createMessage } = require('../lib/mongodb-vercel');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
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
}