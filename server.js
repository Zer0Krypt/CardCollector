const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./config');

// Import routes
const inventoryRouter = require('./routes/inventory');

const app = express();

// Database setup
const db = new sqlite3.Database(config.dbPath);

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.environment === 'production',
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// Routes
app.get('/', (req, res) => {
    if (!req.session.userId) {
        res.render('login');
        return;
    }
    res.render('home');
});

app.use('/inventory', inventoryRouter(db));

// Initialize database tables
function initDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            gems INTEGER DEFAULT 1000,
            arena_rank INTEGER DEFAULT 1000,
            campaign_progress INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Cards table
        db.run(`CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            faction TEXT,
            type TEXT,
            base_power INTEGER,
            attack_type TEXT,
            attack_pattern TEXT,
            element_type TEXT,
            rarity TEXT,
            is_hero BOOLEAN DEFAULT 0,
            image_url TEXT
        )`);

        // Skills table
        db.run(`CREATE TABLE IF NOT EXISTS skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            card_id INTEGER,
            name TEXT,
            description TEXT,
            effect_type TEXT,
            effect_value INTEGER,
            FOREIGN KEY(card_id) REFERENCES cards(id)
        )`);

        // Player_cards table (inventory)
        db.run(`CREATE TABLE IF NOT EXISTS player_cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            card_id INTEGER,
            level INTEGER DEFAULT 1,
            evolution INTEGER DEFAULT 1,
            experience INTEGER DEFAULT 0,
            skill_levels TEXT DEFAULT '{}',
            skill_points INTEGER DEFAULT 0,
            fusion_count INTEGER DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(card_id) REFERENCES cards(id)
        )`);

        // Card materials table
        db.run(`CREATE TABLE IF NOT EXISTS player_materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            material_type TEXT,
            rarity TEXT,
            amount INTEGER DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Card skills table with levels
        db.run(`CREATE TABLE IF NOT EXISTS card_skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            card_id INTEGER,
            name TEXT,
            description TEXT,
            effect_type TEXT,
            base_value INTEGER,
            scaling_type TEXT,
            scaling_stat TEXT,
            max_level INTEGER DEFAULT 10,
            FOREIGN KEY(card_id) REFERENCES cards(id)
        )`);

        // Gear table
        db.run(`CREATE TABLE IF NOT EXISTS gear (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            type TEXT,
            slot TEXT,
            rarity TEXT,
            faction TEXT,
            stars INTEGER DEFAULT 1,
            stat_multiplier FLOAT,
            set_name TEXT
        )`);

        // Player_gear table
        db.run(`CREATE TABLE IF NOT EXISTS player_gear (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            gear_id INTEGER,
            level INTEGER DEFAULT 1,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(gear_id) REFERENCES gear(id)
        )`);

        // Decks table
        db.run(`CREATE TABLE IF NOT EXISTS decks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT,
            hero_card_id INTEGER,
            unit_cards TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);
    });
}

initDatabase();

app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
});






