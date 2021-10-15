'use strict';
const auth = require('../common/auth');
const db = require('../common/db');
const discord = require('../common/discord');

exports.account = (req, res) => {
    // get by discord user id
    let serverConfig = auth.serverAuth(req.get('Authorization'))

    if (!serverConfig) {
        res.status(401).json()
        return
    }

    let userId = req.query.aid

    discord.getDiscordRoles(userId).then((userData) => {
        res.json({
            name: userData.user.username + "#" + userData.user.discriminator,
            roles: userData.roles
        })
    })
    .catch((reason) => {
        res.status(401).json(reason)
    })
}

exports.identifier = (req, res) => {
    // get by fivem identifier
    let serverConfig = auth.serverAuth(req.get('Authorization'))

    if (!serverConfig) {
        res.status(401).json()
        return
    }

    let identifier = req.query.identifier

    db.query('select userId from pairing where identifier = ' + db.escape(identifier)).then((pairingData) => {
        if (pairingData.length > 0) {
            let userId = pairingData[0].userId
            discord.getDiscordRoles(userId).then((userData) => {
                res.json({
                    name: userData.user.username + "#" + userData.user.discriminator,
                    roles: userData.roles,
                    priority: 0,
                    id: userId,
                    banned: 0
                })
            })
            .catch((reason) => {
                res.status(401).json(reason)
            })
        } else {
            res.status(401).json()
        }
    })
    .catch((reason) => {
        res.status(401).json(reason)
    })
}