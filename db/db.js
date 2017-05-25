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

db.getCharByName = function (name) {
    return sqlModels.characters
        .select(sqlModels.characters.star())
        .where(sqlModels.characters.Name.equals(name))
        .toQuery();
};

db.getCharacters = function (login) {
    return sqlModels.characters
        .select(sqlModels.characters.star())
        .where(sqlModels.characters.AccountName.equals(login))
        .toQuery();
};

db.updateCharacter = function (char) {
    return sqlModels.characters
        .update({
            AccountName: char.AccountName,
            ObjectId: char.ObjectId,
            Name: char.Name,
            Level: char.Level,
            MaxHP: char.MaxHP,
            CurHP: char.MaxHP,
            MaxCP: char.MaxCP,
            CurCP: char.MaxCP,
            MaxMP: char.MaxMP,
            CurMP: char.MaxMP,
            PAccuracy: char.PAccuracy,
            PCriticalHit: char.PCriticalHit,
            PEvasionRate: char.PEvasionRate,
            MAccuracy: char.MAccuracy,
            MCriticalHit: char.MCriticalHit,
            MEvasionRate: char.MEvasionRate,
            MAtk: char.MAtk,
            MDef: char.MDef,
            MSpd: char.MSpd,
            PAtk: char.PAtk,
            PDef: char.PDef,
            PSpd: char.PSpd,
            RunSpd: char.RunSpd,
            WalkSpd: char.WalkSpd,
            STR: char.STR,
            CON: char.CON,
            DEX: char.DEX,
            INT: char.INT,
            MEN: char.MEN,
            WIT: char.WIT,
            LUC: char.LUC,
            CHA: char.CHA,
            Face: char.Face,
            HairStyle: char.HairStyle,
            HairColor: char.HairColor,
            Sex: char.Sex,
            Heading: char.Heading,
            X: char.X,
            Y: char.Y,
            Z: char.Z,
            MoveMultiplier: char.MoveMultiplier,
            AttackSpeedMultiplier: char.AttackSpeedMultiplier,
            CollisionRadius: char.CollisionRadius,
            CollisionHeight: char.CollisionHeight,
            EXP: char.EXP,
            EXPBeforeDeath: char.EXPBeforeDeath,
            SP: char.SP,
            Karma: char.Karma,
            PVP: char.PVP,
            PK: char.PK,
            ClanId: char.ClanId,
            MaxLoad: char.MaxLoad,
            RaceId: char.RaceId,
            ClassId: char.ClassId,
            BaseClassId: char.BaseClassId,
            Title: char.Title,
            RecomHave: char.RecomHave,
            RecomLeft: char.RecomLeft,
            AccessLevel: char.AccessLevel,
            Online: char.Online,
            OnlineTime: char.OnlineTime,
            CharId: char.CharId,
            Newbie: char.Newbie,
            LastAccess: char.LastAccess,
            ClanPrivileges: char.ClanPrivileges,
            InJail: char.InJail,
            JailTimer: char.JailTimer,
            PowerGrade: char.PowerGrade,
            IsNoble: char.IsNoble,
            PledgeClass: char.PledgeClass,
            LastRecomDate: char.LastRecomDate,
            ClanJoinExpiryTime: char.ClanJoinExpiryTime,
            ClanCreateExpiryTime: char.ClanCreateExpiryTime,
            DeathPenaltyLevel: char.DeathPenaltyLevel,
            IsHero: char.IsHero
        })
        .where(sqlModels.characters.ObjectId.equals(char.ObjectId))
        .toQuery();
};

db.insertCharacter = function (char) {
    return sqlModels.characters
        .insert({
            AccountName: char.AccountName,
            ObjectId: char.ObjectId,
            Name: char.Name,
            Level: 1,
            MaxHP: char.MaxHP,
            CurHP: char.MaxHP,
            MaxCP: char.MaxCP,
            CurCP: char.MaxCP,
            MaxMP: char.MaxMP,
            CurMP: char.MaxMP,
            PAccuracy: char.charTemplate.PACC,
            PCriticalHit: char.charTemplate.PCRITICAL,
            PEvasionRate: char.charTemplate.PEVASION,
            MAccuracy: char.charTemplate.MACC,
            MCriticalHit: char.charTemplate.MCRITICAL,
            MEvasionRate: char.charTemplate.MEVASION,
            MAtk: char.charTemplate.M_ATK,
            MDef: char.charTemplate.M_DEF,
            MSpd: char.charTemplate.M_SPD,
            PAtk: char.charTemplate.P_ATK,
            PDef: char.charTemplate.P_DEF,
            PSpd: char.charTemplate.P_SPD,
            RunSpd: char.charTemplate.MOVE_SPD,
            WalkSpd: char.charTemplate.MOVE_SPD * 0.75,
            STR: char.charTemplate.BaseSTR,
            CON: char.charTemplate.BaseCON,
            DEX: char.charTemplate.BaseDEX,
            INT: char.charTemplate.BaseINT,
            MEN: char.charTemplate.BaseMEN,
            WIT: char.charTemplate.BaseWIT,
            LUC: char.charTemplate.BaseLUC,
            CHA: char.charTemplate.BaseCHA,
            Face: char.Face,
            HairStyle: char.HairStyle,
            HairColor: char.HairColor,
            Sex: char.Sex,
            Heading: 0,
            X: char.charTemplate.X,
            Y: char.charTemplate.Y,
            Z: char.charTemplate.Z,
            MoveMultiplier: 1,
            AttackSpeedMultiplier: 1,
            CollisionRadius: 8,
            CollisionHeight: 23,
            EXP: 0,
            EXPBeforeDeath: 0,
            SP: 0,
            Karma: 0,
            PVP: 0,
            PK: 0,
            ClanId: 0,
            MaxLoad: char.charTemplate.BaseLOAD,
            RaceId: char.charTemplate.RaceId,
            ClassId: char.charTemplate.ClassId,
            BaseClassId: char.charTemplate.ClassId,
            Title: '',
            RecomHave: 0,
            RecomLeft: 10,
            AccessLevel: 0,
            Online: 0,
            OnlineTime: 0,
            CharId: char.CharId,
            Newbie: 1,
            LastAccess: 0,
            ClanPrivileges: 0,
            InJail: 0,
            JailTimer: 0,
            PowerGrade: 0,
            IsNoble: 0,
            PledgeClass: 0,
            LastRecomDate: 0,
            ClanJoinExpiryTime: 0,
            ClanCreateExpiryTime: 0,
            DeathPenaltyLevel: 0,
            IsHero: 0
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

db.updateServerData = function (gameServer) {
    return sqlModels.server_data
        .update({
            online: gameServer.clients.length,
            nextObjectId: gameServer.nextObjectId
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

db.getMapRegions = function () {
    return sqlModels.map_region
        .select(sqlModels.map_region.star())
        .toQuery();
};

db.getCharTemplates = function () {
    return sqlModels.character_templates
        .select(sqlModels.character_templates.star())
        .toQuery();
};

module.exports = db;