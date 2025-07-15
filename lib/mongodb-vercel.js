const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable');
    }

    try {
        const client = new MongoClient(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });

        await client.connect();
        const db = client.db('grievance_portal');
        
        cachedClient = client;
        cachedDb = db;
        
        return { client, db };
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

// User operations
async function findUser(username) {
    const { db } = await connectToDatabase();
    return await db.collection('users').findOne({ username: username.toLowerCase() });
}

async function createUser(userData) {
    const { db } = await connectToDatabase();
    return await db.collection('users').insertOne({
        ...userData,
        username: userData.username.toLowerCase(),
        createdAt: new Date(),
        lastLogin: null
    });
}

async function updateUserLogin(username) {
    const { db } = await connectToDatabase();
    return await db.collection('users').updateOne(
        { username: username.toLowerCase() },
        { $set: { lastLogin: new Date() } }
    );
}

// Message operations
async function createMessage(messageData) {
    const { db } = await connectToDatabase();
    return await db.collection('messages').insertOne({
        ...messageData,
        to: messageData.to.toLowerCase(),
        timestamp: new Date(),
        isRead: false
    });
}

async function getMessagesForUser(username) {
    const { db } = await connectToDatabase();
    return await db.collection('messages').find({ to: username.toLowerCase() })
                     .sort({ timestamp: -1 })
                     .toArray();
}

async function markMessageAsRead(messageId) {
    const { db } = await connectToDatabase();
    const { ObjectId } = require('mongodb');
    return await db.collection('messages').updateOne(
        { _id: new ObjectId(messageId) },
        { $set: { isRead: true } }
    );
}

async function getUnreadCount(username) {
    const { db } = await connectToDatabase();
    return await db.collection('messages').countDocuments({ 
        to: username.toLowerCase(), 
        isRead: false 
    });
}

module.exports = {
    findUser,
    createUser,
    updateUserLogin,
    createMessage,
    getMessagesForUser,
    markMessageAsRead,
    getUnreadCount
};