const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    // Return cached connection if available
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    // Get connection string from environment variable
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable');
    }

    try {
        // Connect to MongoDB
        const client = new MongoClient(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        await client.connect();
        
        // Get database (extract database name from URI or use default)
        const db = client.db('grievance_portal');
        
        // Cache the connection
        cachedClient = client;
        cachedDb = db;
        
        console.log('✅ Connected to MongoDB');
        return { client, db };
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

// Database collections
async function getUsersCollection() {
    const { db } = await connectToDatabase();
    return db.collection('users');
}

async function getMessagesCollection() {
    const { db } = await connectToDatabase();
    return db.collection('messages');
}

// User operations
async function findUser(username) {
    const users = await getUsersCollection();
    return await users.findOne({ username: username.toLowerCase() });
}

async function createUser(userData) {
    const users = await getUsersCollection();
    return await users.insertOne({
        ...userData,
        username: userData.username.toLowerCase(),
        createdAt: new Date(),
        lastLogin: null
    });
}

async function updateUserLogin(username) {
    const users = await getUsersCollection();
    return await users.updateOne(
        { username: username.toLowerCase() },
        { $set: { lastLogin: new Date() } }
    );
}

async function getAllUsers() {
    const users = await getUsersCollection();
    return await users.find({}).toArray();
}

// Message operations
async function createMessage(messageData) {
    const messages = await getMessagesCollection();
    return await messages.insertOne({
        ...messageData,
        to: messageData.to.toLowerCase(),
        timestamp: new Date(),
        isRead: false
    });
}

async function getMessagesForUser(username) {
    const messages = await getMessagesCollection();
    return await messages.find({ to: username.toLowerCase() })
                         .sort({ timestamp: -1 })
                         .toArray();
}

async function markMessageAsRead(messageId) {
    const messages = await getMessagesCollection();
    const { ObjectId } = require('mongodb');
    return await messages.updateOne(
        { _id: new ObjectId(messageId) },
        { $set: { isRead: true } }
    );
}

async function getUnreadCount(username) {
    const messages = await getMessagesCollection();
    return await messages.countDocuments({ 
        to: username.toLowerCase(), 
        isRead: false 
    });
}

// Cleanup operations
async function clearAllData() {
    const users = await getUsersCollection();
    const messages = await getMessagesCollection();
    
    await users.deleteMany({});
    await messages.deleteMany({});
    
    return { success: true };
}

module.exports = {
    connectToDatabase,
    findUser,
    createUser,
    updateUserLogin,
    getAllUsers,
    createMessage,
    getMessagesForUser,
    markMessageAsRead,
    getUnreadCount,
    clearAllData
};