'use strict';
const config = require('./config').config;
const url = config.discord.baseUrl;
const apiKey = config.discord.apiKey;
const request = require('./jsonRequest');

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

var userCache = []

exports.createUser = (authData, userData, roles) => {
    var user = {
        token: uuidv4(),
        id: userData.id,
        name: userData.username + '#' + userData.discriminator,
        roles: roles,
        discordToken: authData.access_token,
        expires: authData.expires_in,
        timestamp: Date.now()
    };

    userCache.push(user)

    return user
}

exports.getDiscordToken = (code) => {
    return new Promise((resolve, reject) => {
        let body = {
            client_id: config.discord.clientId,
            client_secret: config.discord.clientSecret,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: config.discord.redirectUri
        }

        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        request.postUrlEncoded(url + 'oauth2/token', body, headers).then((data) => {
            resolve(data);
        },
        (reason) => {
            reject(reason);
        });
    });
}

exports.getDiscordUser = (token) => {
    return new Promise((resolve, reject) => {
        request.get(url + 'users/@me', { 'Authorization': 'Bearer ' + token }).then((data) => {
            if (config.debug) console.log("Retrieved user information", data);
            resolve(data);
        },
        (reason) => {
            // not authorized
            if (config.debug) console.log("Unable to get current user for token", reason);
            reject(reason);
        });
    })
}

exports.getDiscordRoles = (id) => {
    return new Promise((resolve, reject) => {
        request.get(url + 'guilds/' + config.discord.guildId + '/members/' + id, { 'Authorization': 'Bot ' + apiKey }).then((data) => {
            if (config.debug) console.log("Got roles for user", data);
            resolve(data);
        },
        (reason) => {
            if (config.debug) console.log("Unable to get roles for user", reason);
            reject(reason);
        });
    })
}

exports.addUserToGuild = (id, token) => {
    return new Promise((resolve, reject) => {
        request.put(url + 'guilds/' + config.discord.guildId + '/members/' + id, { 'access_token': token }, { 'Authorization': 'Bot ' + apiKey, 'Content-Type': 'application/json' }).then((data) => {
            if (config.debug) console.log("Added user to guild", data);
            resolve();
        },
        (reason) => {
            if (config.debug) console.log("Unable to add user to guild", reason);
            reject(reason);
        });
    })
}

var uuidv4 = exports.uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

exports.getFromCache = (token) => {
    var cacheItem
    var now = Date.now()

    for (var i = userCache.length-1; i >= 0; i--) {
        // compare the inserted date plus expiration time to see if still valid item
        var newDate = new Date(userCache[i].timestamp + (userCache[i].expires * 1000));
        
        if (now >= newDate) {
            if (config.debug) console.log("Removing expired auth token");
            userCache.splice(i, 1);
        } else if (userCache[i].token == token) {
            // this is ours
            cacheItem = userCache[i];
            break;
        }
    }

    return cacheItem;
}

exports.sendPm = (to, title, body) => {
    return new Promise((resolve, reject) => {
        request.post(url + 'users/@me/channels', { recipient_id: to }, { 'Authorization': 'Bot ' + apiKey, 'Content-Type': 'application/json' }).then((channelData) => {
            if (config.debug) console.log("Created DM channel", channelData);
            request.post(url + 'channels/' + channelData.id + '/messages', {embeds: [{ title: title, description: body }]}, { 'Authorization': 'Bot ' + apiKey, 'Content-Type': 'application/json' }).then((messageData) => {
                resolve();
            },
            (reason) => {
                if (config.debug) console.log("Unable to send message", reason);
                reject(reason);
            })
        },
        (reason) => {
            if (config.debug) console.log("Unable to create channel", reason);
            reject(reason);
        });
    });
}

exports.giveRole = (userId, roleId) => {
    return new Promise((resolve, reject) => {
        request.put(url + 'guilds/' + config.discord.guildId + '/members/' + userId + '/roles/' + roleId, {}, { 'Authorization': 'Bot ' + apiKey }).then((data) => {
            // done!
            resolve();
            return;
        },
        (reason) => {
            // discord api error
            if (config.debug) console.log(reason);
            reject("Unable to assign role", reason);
        });
    });
}