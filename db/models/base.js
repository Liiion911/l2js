var sql = require('sql').create('mysql');

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

sqlModels.map_region = sql.define({
    name: 'map_region',
    columns: ['region', 'sec0', 'sec1', 'sec2', 'sec3', 'sec4', 'sec5', 'sec6', 'sec7', 'sec8', 'sec9']
});

sqlModels.auth_data = sql.define({
    name: 'auth_data',
    columns: ['login', 'session1_1', 'session1_2', 'session2_1', 'session2_2']
});


sqlModels.characters = sql.define({
    name: 'characters',
    columns: ['AccountName', 'ObjectId', 'Name', 'Level', 'MaxHP', 'CurHP', 'MaxCP', 'CurCP',
        'MaxMP', 'CurMP', 'Accuracy', 'CriticalHit', 'EvasionRate', 'MAtk', 'MDef', 'MSpd', 'PAtk', 'PDef',
        'PSpd', 'RunSpd', 'WalkSpd', 'STR', 'CON', 'DEX', 'INT', 'MEN', 'WIT', 'Face', 'HairStyle',
        'HairColor', 'Sex', 'Heading', 'X', 'Y', 'Z', 'MoveMultiplier', 'AttackSpeedMultiplier',
        'CollisionRadius', 'CollisionHeight', 'EXP', 'EXPBeforeDeath', 'SP', 'Karma', 'PVP', 'PK',
        'ClanId', 'MaxLoad', 'RaceId', 'ClassId', 'BaseClassId', 'DeleteTime', 'Title', 'RecomHave',
        'RecomLeft', 'AccessLevel', 'Online', 'OnlineTime', 'CharId', 'Newbie', 'LastAccess',
        'ClanPrivileges', 'InJail', 'JailTimer', 'PowerGrade', 'IsNoble', 'PledgeClass', 'LastRecomDate', 'ClanJoinExpiryTime', 'ClanCreateExpiryTime', 'DeathPenaltyLevel',
        'IsHero']
});

sqlModels.character_templates = sql.define({
    name: 'character_templates',
    columns: ['ClassName', 'ClassId', 'RaceId', 'BaseSTR', 'BaseCON', 'BaseDEX', 'BaseINT', 'BaseWIT',
        'BaseMEN', 'P_ATK', 'P_DEF', 'M_ATK', 'M_DEF', 'P_SPD', 'M_SPD', 'ACC', 'CRITICAL', 'EVASION',
        'MOVE_SPD', 'BaseLOAD', 'X', 'Y', 'Z', 'M_UNK1', 'M_UNK2', 'M_COL_R', 'M_COL_H', 'F_UNK1', 'F_UNK2',
        'F_COL_R', 'F_COL_H', 'items1', 'items2', 'items3', 'items4', 'items5',]
});

sqlModels.character_skills_save = sql.define({
    name: 'character_skills_save',
    columns: ['charId', 'skill_id', 'skill_level', 'remaining_time', 'reuse_delay', 'systime', 'restore_type',
        'class_index', 'buff_index']
});

sqlModels.server_data = sql.define({
    name: 'server_data',
    columns: ['online', 'max_online', 'nextObjectId']
});

module.exports = sqlModels;