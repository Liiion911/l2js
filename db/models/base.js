var sql = require('sql').create('mysql');

var sqlModels = {};


sqlModels.accounts = sql.define({
    name: 'accounts',
    columns: ['login', 'password', 'email', 'create_time', 'lastactive', 'accessLevel', 'lastIP', 'lastServer']
});


module.exports = sqlModels;