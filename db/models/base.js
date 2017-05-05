﻿var sql = require('sql').create('mysql');

var sqlModels = {};


// LOGINSERVER DB

sqlModels.accounts = sql.define({
    name: 'accounts',
    columns: ['login', 'password', 'email', 'create_time', 'lastactive', 'accessLevel', 'lastIP', 'lastServer']
});

sqlModels.gameservers = sql.define({
    name: 'gameservers',
    columns: ['server_id', 'ip', 'port']
});




// GAMESERVER DB

sqlModels.mapregion = sql.define({
    name: 'mapregion',
    columns: ['region', 'sec0', 'sec1', 'sec2', 'sec3', 'sec4', 'sec5', 'sec6', 'sec7', 'sec8', 'sec9']
});

sqlModels.auth_data = sql.define({
    name: 'auth_data',
    columns: ['login', 'session1_1', 'session1_2', 'session2_1', 'session2_2']
});

sqlModels.character_skills_save = sql.define({
    name: 'character_skills_save',
    columns: ['charId', 'skill_id', 'skill_level', 'remaining_time', 'reuse_delay', 'systime', 'restore_type', 'class_index', 'buff_index']
});

sqlModels.server_data = sql.define({
    name: 'server_data',
    columns: ['online', 'max_online']
});

module.exports = sqlModels;