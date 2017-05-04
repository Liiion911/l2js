var sql = require('sql').create('mysql');

var sqlModels = require('./models/base.js');

var db = {};
db.skills = require('./skills.js');

db.getAccountByLoginPassword = function (login, pass) {
    return sqlModels.accounts
        .where(sqlModels.accounts.login.equals(login))
        .and(sqlModels.accounts.password.equals(pass))
        .toQuery();
};

db.updateAuthData = function (login, session1_1, session1_2, session2_1, session2_2) {
    return sqlModels.auth_data
        .update({
            session1_1: session1_1,
            session1_2: session1_2,
            session2_1: session2_1,
            session2_2: session2_2
        })
        .where(sqlModels.auth_data.login.equals(login))
        .toQuery();
};

db.insertAuthData = function (login, session1_1, session1_2, session2_1, session2_2) {
    return sqlModels.auth_data
        .insert({
            login: login,
            session1_1: session1_1,
            session1_2: session1_2,
            session2_1: session2_1,
            session2_2: session2_2
        }).toQuery();
};

db.getServers = function () {
    return sqlModels.gameservers
        .select(sqlModels.gameservers.star())
        .toQuery();
};

db.getAuthDataByLogin = function (login) {
    return sqlModels.auth_data
        .where(sqlModels.auth_data.login.equals(login))
        .toQuery();
};

db.updateServerData = function (online) {
    return sqlModels.server_data
        .update({
            online: online,
        })
        .toQuery();
};

db.getServerData = function () {
    return sqlModels.server_data
        .select(sqlModels.server_data.star())
        .toQuery();
};

db.createAccount = function (login, password, accessLevel) {
    return sqlModels.accounts
        .insert({
            login: login,
            password: password,
            accessLevel: 0
        }).toQuery();
};

module.exports = db;