'use strict';
const config = require('./config').config;
const discord = require('./discord');

// === user cache - poor man's object schema ===
// {
//	token: string,
//	timestamp: datetime,
//	expires: int,
//	discordToken: string,
//  id: snowflake,
//  name: string,
//  roles: [string]
// }

var userCache = [];

exports.serverAuth = (header) => {
	let authHeader = header.split(' ')[1]

	if (!authHeader) {
		return false
	}

	let buffer = Buffer.from(authHeader, 'base64')
	let serverKey = buffer.toString('ascii')

	if (config.servers[serverKey]) {
		return config.servers[serverKey]
	}

	return false
}

exports.discordAuth = (code) => {
	return new Promise((resolve, reject) => {
		if (!code) {
			reject("No auth code")
			return
		}

		discord.getDiscordToken(code)
		.then((authData) => {
			discord.getDiscordUser(authData.access_token)
			.then((userData) => {
				// see if the user is in the guild. if not, add them.
				discord.getDiscordRoles(userData.id)
				.then((rolesData) => {
					// already in guild
					let user = discord.createUser(authData, userData, rolesData.roles)
					resolve(user)
				})
				.catch((error) => {
					// need to add to guild
					discord.addUserToGuild(userData.id, authData.access_token)
					.then((addData) => {
						discord.getDiscordRoles(userData.id)
						.then((rolesData) => {
							let user = discord.createUser(authData, userData, rolesData.roles)
							resolve(user)
						})
						.catch((error) => {
							reject(error)
						})
					})
					.catch((error) => {
						reject(error)
					})
				})
			})
			.catch((error) => {
				reject(error)
			})
		})
		.catch((error) => {
			reject(error)
		})
	})
}

exports.validateToken = (token) => {
	return new Promise((resolve, reject) => {
		if (!token) {
			reject("No token")
			return
		}

		var cacheItem = discord.getFromCache(token)

		if (cacheItem) {
			resolve(cacheItem)
		} else {
			reject("Invalid token")
		}
	})
}

exports.checkRoles = (userRoles, desiredRoles) => {
	return new Promise((resolve, reject) => {
		if (!userRoles || !desiredRoles) {
			reject("Must provide both the current and desired roles")
			return
		}

		desiredRoles.forEach((roleId) => {
			if (userRoles.indexOf(roleId) >= 0) {
				resolve(true)
				return;
			}
		});

		reject("Reqired role not assigned to user")
	})
}