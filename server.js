const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const db = require('./db/init');

const app = express();

// Session middleware configuration with SQLite store
app.use(session({
    store: new SQLiteStore({
        dir: './db',
        db: 'sessions.sqlite',
        table: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to false for development/HTTP
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware to log session data
app.use((req, res, next) => {
    console.log('Session data:', req.session);
    next();
});

// Routes
app.use('/arena', require('./routes/arena')(db));
app.use('/auth', require('./routes/auth')(db));
app.use('/cards', require('./routes/cards')(db));
app.use('/campaign', require('./routes/campaign')(db));
app.use('/inventory', require('./routes/inventory')(db));
app.use('/gacha', require('./routes/gacha')(db));

// Root route
app.get('/', (req, res) => {
    console.log('Root route accessed. Session:', req.session);
    
    if (!req.session.userId) {
        console.log('No session, redirecting to login');
        return res.render('login');
    }

    // Get user data for the dashboard
    db.get(
        `SELECT 
            (SELECT COUNT(*) FROM player_cards WHERE user_id = ?) as cardCount,
            (SELECT arena_rank FROM users WHERE id = ?) as arenaRank,
            (SELECT COALESCE(ROUND(completed_stages * 100.0 / total_stages, 1), 0)
             FROM (
                 SELECT COUNT(*) as completed_stages,
                        (SELECT COUNT(*) FROM campaign_stages) as total_stages
                 FROM player_progress 
                 WHERE user_id = ? AND stars > 0
             )) as campaignProgress`,
        [req.session.userId, req.session.userId, req.session.userId],
        (err, stats) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).render('error', {
                    message: 'Database error',
                    error: { status: 500, stack: err.stack }
                });
            }

            console.log('Rendering home page for user:', req.session.username);
            res.render('home', {
                username: req.session.username,
                cardCount: stats.cardCount || 0,
                arenaRank: stats.arenaRank || 1000,
                campaignProgress: stats.campaignProgress || 0
            });
        }
    );
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        message: 'Something went wrong!',
        error: { status: 500, stack: process.env.NODE_ENV === 'development' ? err.stack : '' }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});





