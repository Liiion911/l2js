﻿var sql = require('sql').create('mysql');

var sqlModels = require('./models/base.js');

var skills = {};

skills.restorCharacterSkill = function (charId, class_index) {
    return sqlModels.character_skills_save
        .where(sqlModels.character_skills_save.charId.equals(charId))
        .and(sqlModels.character_skills_save.class_index.equals(class_index))
        .order(sqlModels.character_skills_save.buff_index.asc)
        .toQuery();
}

module.exports = skills;