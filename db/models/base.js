var sql = require('sql').create('mysql');

var sqlModels = {};


sqlModels.accounts = sql.define({
    name: 'accounts',
    columns: ['login', 'password', 'email', 'create_time', 'lastactive', 'accessLevel', 'lastIP', 'lastServer']
});

sqlModels.character_skills_save = sql.define({
    name: 'character_skills_save',
    columns: ['charId', 'skill_id', 'skill_level', 'remaining_time', 'reuse_delay', 'systime', 'restore_type', 'class_index', 'buff_index']
});

module.exports = sqlModels;