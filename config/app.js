// config/app.js
const express = require('express');
const morgan = require("morgan");
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");
const app = express();
require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(methodOverride("_method"));
app.use(expressLayouts);

app.use(cors());

app.use(express.static(path.join(__dirname, '../public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'layouts/application');

app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
}); 
let routes;
if(process.NODE_ENV == 'production') {
    routes = require('../routes/appRoutes');  
}else{
    routes = require('../routes/applicationRoutes');
}
routes(app);

module.exports = app;