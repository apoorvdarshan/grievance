const { findUser, updateUserLogin } = require('../lib/mongodb-vercel');

export default async function handler(req, res) {
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
}