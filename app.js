const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const router = require('./routes/index');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const cors = require('cors');
const app = express();
const result = require('dotenv').config();
//serve static files like js, css
app.use('/static', express.static(__dirname + '/build/static'));
mongoose.connect('mongodb://' + process.env.MONGOURI, function (err, result) {
    if (err) {
        console.log(err);
    } else {
        console.log('connected to the remote db');
    }
});
app.use(cors({
    origin: ['https://my-post-app.herokuapp.com','http://localhost:3000'],
    methods: ['GET', 'HEAD', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    credentials: true
}));
app.use(session({
    secret: 'qwertyuiop1234567890',
	resave:true,
    saveUninitialized: true,
    cookie: {
        maxAge: (60000 * 60),
        secure: false,
        httpOnly: false,
    },
    store: new MongoStore({mongooseConnection: mongoose.connection})
}));
app.use(bodyParser.json());
// All Routes
app.use('/', router);
// Error Handling
process.on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
}).on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
    process.exit(1);
});
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
})
app.listen(process.env.PORT || 8080);