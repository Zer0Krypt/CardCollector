module.exports = {
    port: process.env.PORT || 3000,
    dbPath: process.env.DB_PATH || '/home/cc/CardCollector/data/database.sqlite',
    sessionSecret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    environment: process.env.NODE_ENV || 'production'
};