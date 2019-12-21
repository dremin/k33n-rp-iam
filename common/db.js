'use strict';
const mysql = require('mysql');
const config = require('./config').config;

var dbPool = mysql.createPool({
	connectionLimit: 10,
	host: config.database.host,
	port: config.database.port,
	user: config.database.user,
	password: config.database.password,
	database: config.database.database,
	debug: false
});

var numRetries = 0;
const maxRetries = 10;
const retryDelay = 1000;

function runQuery(req) {
	return new Promise((resolve, reject) => {
		execute(req, resolve, reject);
	});
}

function execute(req, resolve, reject) {
	dbPool.getConnection((err, connection) => {
		if (err) {
			console.log('Error connecting to the database: ' + err.message);
			
			if (numRetries < maxRetries) {
				var retry = new Promise((resolve) => setTimeout(resolve, retryDelay)).then(() => {
					numRetries++;
					execute(req, resolve, reject);
				});
			} else {
				console.log('Max retries exceeded, returning empty result.');
				resolve([]);
			}
		} else {
			numRetries = 0;
			if (config.debug) console.log(`Performing database query: '${req}'`);
			
			connection.query(req, (err, rows) => {
				connection.release();
				
				if(!err) {
					resolve(rows);
				}
				else {
					console.log('Error performing query: ' + err.message);
					return reject(err);
				}
			});
		}
	});
}

exports.query = (req) => {
	return runQuery(req);
};

exports.getDbDateTime = () => {
	var d = new Date();
	return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}

exports.escape = (str) => {
	return mysql.escape(str);
}