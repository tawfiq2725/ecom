const express = require('express');
const session = require('express-session');
const {engine} = require('express-handlebars')
const path = require('path')
const morgan = require('morgan')
const nocache = require('nocache')
const flash = require('connect-flash')

// Configurations
require('dotenv').config();
require('./config/dbconnection')
const PORT = process.env.APP_PORT || 3000;

// Routes Path
const authRoutes = require('./routes/authRoutes')
const adminRoutes = require('./routes/adminRoutes')

// app
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(morgan('dev'));
app.use(nocache())

// Sessions
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 72 * 60 * 60 * 1000,
        httpOnly: true
    }
}))

// Flash
app.use(flash())

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.session.user || null;
    res.locals.admin = req.session.admin || null;
    next();
});

// Express handlebars
app.engine('hbs',engine(
    {
        extname:'hbs',
        defaultLayout:'layout',
        layoutsDir:__dirname+'/views/layout/',
        partialsDir:__dirname+'/views/partials/',
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true,
        }
    }
))
app.set('views',path.join(__dirname,'views'));
app.set('view engine','hbs');


// Routes
app.use('/',authRoutes)
app.use('/admin',adminRoutes)
app.use(express.static('public'))
app.get('*', function (req, res) {
    res.redirect("/pageNotFound");
});



// Listen
app.listen(PORT,()=>{
    console.log(`Your server is running on http://localhost:${PORT}`);
})