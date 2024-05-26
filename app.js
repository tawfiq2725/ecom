const express = require('express');
const session = require('express-session');
const { engine } = require('express-handlebars');
const path = require('path');
const morgan = require('morgan');
const nocache = require('nocache');
const flash = require('connect-flash');
const passport = require('./config/passport-config');
const Handlebars = require('handlebars'); // Add this line to ensure Handlebars is required

// Configurations
require('dotenv').config();
require('./config/dbconnection');
const PORT = process.env.APP_PORT || 3000;

// Routes Path
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

// app
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(morgan('dev'));
app.use(nocache());

// Sessions
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 72 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

// Google authentication using Passport
app.use(passport.initialize());
app.use(passport.session());

// Flash
app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.session.user || null;
    res.locals.admin = req.session.admin || null;
    next();
});

// Express handlebars
app.engine('hbs', engine({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: path.join(__dirname, 'views/layout/'),
    partialsDir: path.join(__dirname, 'views/partials/'),
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Register Handlebars helpers
const hbs = require('express-handlebars').create({});
hbs.handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});
hbs.handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

// Routes
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use(express.static('public'));
app.get('*', function (req, res) {
    res.redirect("/pageNotFound");
});

// Listen
app.listen(PORT, () => {
    console.log(`Your server is running on http://localhost:${PORT}`);
});
