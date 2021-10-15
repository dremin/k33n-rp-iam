'use strict';
const auth = require('../common/auth');

exports.startup = (req, res) => {
    let serverConfig = auth.serverAuth(req.get('Authorization'))

    if (!serverConfig) {
        res.status(401).json()
        return
    }

    res.json(serverConfig)
}

exports.postBan = (req, res) => {
    // stub
    res.json({ status: "success" })
}

exports.deleteBan = (req, res) => {
    // stub
    res.json({ status: "success" })
}