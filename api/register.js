const { findUser, createUser } = require('../lib/mongodb-vercel');

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
}