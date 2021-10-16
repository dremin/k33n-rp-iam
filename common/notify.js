'use strict';
const config = require('./config').config;
const discord = require('./discord');
const fs = require('fs');
const request = require('./jsonRequest');

const discordWebhook = config.discord.webhookUrl;
const notificationsDir = "notifications"

exports.sendDenied = (formData, reason) => {
    return new Promise((resolve, reject) => {
        var pmPre = fs.readFileSync(notificationsDir + "/" + formData.formName + "-denied.md", "utf8")
        var pm = pmPre.replace("{replace}", reason)
        
        discord.sendPm(formData.userId, formData.formLabel + " Status Update", pm).then(() => {
            resolve()
        },
        (reason) => {
            reject(reason)
        })
    })
}

exports.sendTemplate = (template, formData) => {
    return new Promise((resolve, reject) => {
        var pm = fs.readFileSync(notificationsDir + "/" + formData.formName + "-" + template + ".md", "utf8")
        
        discord.sendPm(formData.userId, formData.formLabel + " Status Update", pm).then(() => {
            resolve()
        },
        (reason) => {
            reject(reason)
        })
    })
}

exports.sendCode = (userId, pairingCode) => {
    return new Promise((resolve, reject) => {
        discord.sendPm(userId, "FiveM Link Code", "The first time you join the server, you will need to enter this code:\r\n**" + pairingCode + "**")
        .then(() => {
            resolve()
        },
        (reason) => {
            reject(reason)
        })
    })
}

exports.sendAdminMessage = (username, content) => {
    return new Promise((resolve, reject) => {
        request.post(discordWebhook, { username: username, content: content }, {})
        .then(() => {
            resolve()
        })
        .catch(() => {
            // discord api error, continue anyway
            resolve()
        })
    })
}