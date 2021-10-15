'use strict';
const auth = require('../common/auth');
const db = require('../common/db');

exports.identifier = (req, res) => {
    let serverConfig = auth.serverAuth(req.get('Authorization'))

    if (!serverConfig) {
        res.status(401).json()
        return
    }

    let pairingToken = req.query.token
    let identifier = req.query.identifier

    db.query('select userId, identifier from pairing where pairingToken = ' + db.escape(pairingToken)).then((pairingResult) => {
        if (pairingResult.length > 0 && !pairingResult[0].identifier) {
            db.query('update pairing set identifier = ' + db.escape(identifier) + ' where userId = ' + pairingResult[0].userId).then(() => {
                res.json({ status: "success" })
            })
            .catch((reason) => {
                res.status(400).json(reason)
            })
        } else {
            res.status(400).json()
        }
    })
    .catch((reason) => {
        res.status(401).json(reason)
    })
}