const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the db directory exists
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)){
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(path.join(dbDir, 'database.sqlite'));

// Initialize database tables
db.serialize(() => {
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            arena_rank INTEGER DEFAULT 1000,
            arena_wins INTEGER DEFAULT 0,
            arena_losses INTEGER DEFAULT 0,
            gold INTEGER DEFAULT 0,
            gems INTEGER DEFAULT 0,
            exp INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Player cards table
    db.run(`
        CREATE TABLE IF NOT EXISTS player_cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            card_id INTEGER NOT NULL,
            level INTEGER DEFAULT 1,
            evolution INTEGER DEFAULT 1,
            experience INTEGER DEFAULT 0,
            fusion_count INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    // Campaign progress table
    db.run(`
        CREATE TABLE IF NOT EXISTS player_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            stage_id INTEGER NOT NULL,
            stars INTEGER DEFAULT 0,
            completed_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    // Campaign stages table
    db.run(`
        CREATE TABLE IF NOT EXISTS campaign_stages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            difficulty INTEGER NOT NULL,
            required_level INTEGER DEFAULT 1
        )
    `);
});

module.exports = db;