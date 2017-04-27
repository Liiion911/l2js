var sql = require('sql').create('mysql');

var sqlModels = require('./models/base.js');

var db = {};

db.getAccountByLoginPassword = function (login, pass) {
    return sqlModels.accounts
        .where(sqlModels.accounts.login.equals(login))
        .and(sqlModels.accounts.password.equals(pass))
        .toQuery();
}

db.createAccount = function (login, password, accessLevel) {
    return sqlModels.accounts
        .insert({
            login: login,
            password: password,
            accessLevel: 0
        }).toQuery();
}

module.exports = db;