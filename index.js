// init
const express = require('express');
const cors = require('cors');
const path = require('path');
const parser = require('body-parser');
const app = express();
const router = express.Router();
const routes = require('./routes');
const config = require('./common/config').config;

if (config.debug) process.on('unhandledRejection', r => console.log(r));

// we're gonna be behind a reverse proxy
app.set('trust proxy', true);


// survive CORS
app.use(cors());


// set up parser
app.use(parser.urlencoded({ extended: false }));
app.use(parser.json());


// display web pages
app.use(express.static(path.join(__dirname, 'client')));


// set up api router
app.use('/api', router);
routes(router);


// listen on given port
app.listen(config.port, () => {
	console.log(`K33N RP Applications application (aha!) started on port ${config.port}`)
});