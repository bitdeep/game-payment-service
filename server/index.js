'use strict';
const dotenv = require('dotenv');
dotenv.config();
const app = require('./app')
const express = require('express')
const http = express()
const cors = require('cors');const helmet = require('helmet');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
http.use(cors())
http.use(helmet()); // first
http.use(bodyParser.json());
http.use(cookieParser());
http.set('trust proxy', 1); // trust first proxy
http.set('json spaces', 40);

http.listen(8787, () => {
    app.init();
})
