﻿var protocol = require('../protocol.js');
var _ = require('underscore');

var serverGamePackets = {};

//-----------------------------------------------//
// Game Server packets                           //
//-----------------------------------------------//


serverGamePackets.CharTemplates = function (sock, templates) { // NewCharacterSuccess
    var p = new protocol.BasePacket();

    p.writeC(0x17);
    p.writeD(templates.length);

    _.each(templates, (template) => {

        p.writeD(template.RaceId);
        p.writeD(template.ClassId);

        p.writeD(0x46);
        p.writeD(template.BaseSTR);
        p.writeD(0x0a);
        p.writeD(0x46);
        p.writeD(template.BaseDEX);
        p.writeD(0x0a);
        p.writeD(0x46);
        p.writeD(template.BaseCON);
        p.writeD(0x0a);
        p.writeD(0x46);
        p.writeD(template.BaseINT);
        p.writeD(0x0a);
        p.writeD(0x46);
        p.writeD(template.BaseWIT);
        p.writeD(0x0a);
        p.writeD(0x46);
        p.writeD(template.BaseMEN);
        p.writeD(0x0a);

    });

    return p;
}

serverGamePackets.TargetUnselected = function (sock, targetObj) {
    var p = new protocol.BasePacket();

    p.writeC(0x24);

    p.writeD(targetObj.ObjectId);
    p.writeD(targetObj.X);
    p.writeD(targetObj.Y);
    p.writeD(targetObj.Z);
    p.writeD(0x00); // иногда бывает 1

    return p;
};

serverGamePackets.TargetSelected = function (sock, targetObj) {
    var p = new protocol.BasePacket();

    p.writeC(0x29);

    p.writeD(targetObj.ObjectId);
    p.writeD(targetObj.TargetId);
    p.writeD(targetObj.X);
    p.writeD(targetObj.Y);
    p.writeD(targetObj.Z);

    return p;
};

serverGamePackets.MyTargetSelected = function (sock, objectId, color) {
    var p = new protocol.BasePacket();

    p.writeC(0xa6);

    p.writeD(objectId);
    p.writeH(color);

    return p;
};

serverGamePackets.CharCreateFail = function (sock, error) {
    var p = new protocol.BasePacket();

    if (error < 0 || error > 3) error = 0;

    p.writeC(0x1a);

    p.writeD(error);

    return p;

    /*
    REASON_CREATION_FAILED = 0x00;
	REASON_TOO_MANY_CHARACTERS = 0x01;
	REASON_NAME_ALREADY_EXISTS = 0x02;
	REASON_16_ENG_CHARS = 0x03;
    */

};

serverGamePackets.CharCreateSuccess = function (sock) { // CharCreateOk
    var p = new protocol.BasePacket();

    p.writeC(0x19);

    p.writeD(0x01);

    return p;
};

serverGamePackets.ServerClose = function (sock, type, text) { // Kick player, disconnect player
    var p = new protocol.BasePacket();

    p.writeC(0x26);

    return p;
};

serverGamePackets.CreatureSay = function (sock, type, text) {
    var p = new protocol.BasePacket();

    p.writeC(0x4a);

    p.writeD(sock.client.char.ObjectId);
    p.writeD(type);
    p.writeS(sock.client.char.Name);
    p.writeS(text);

    return p;

    /*
	    public static final int ALL = 0;
	    public static final int SHOUT = 1; // !
	    public static final int TELL = 2;
	    public static final int PARTY = 3; // #
	    public static final int CLAN = 4; // @
	    public static final int GM = 5;
	    public static final int PETITION_PLAYER = 6; // used for petition
	    public static final int PETITION_GM = 7; // * used for petition
	    public static final int TRADE = 8; // +
	    public static final int ALLIANCE = 9; // $
	    public static final int ANNOUNCEMENT = 10;
	    public static final int BOAT = 11;
	    public static final int L2FRIEND = 12;
	    public static final int MSNCHAT = 13;
	    public static final int PARTYMATCH_ROOM = 14;
	    public static final int PARTYROOM_COMMANDER = 15; // (Yellow)
	    public static final int PARTYROOM_ALL = 16; // (Red)
	    public static final int HERO_VOICE = 17;
	    public static final int CRITICAL_ANNOUNCE = 18;
	    public static final int SCREEN_ANNOUNCE = 19;
	    public static final int BATTLEFIELD = 20;
	    public static final int MPCC_ROOM = 21;
	    public static final int NPC_ALL = 22;
	    public static final int NPC_SHOUT = 23;
    */
}

serverGamePackets.ValidateLocation = function (char) {
    var p = new protocol.BasePacket();

    p.writeC(0x79);

    p.writeD(char.ObjectId);

    p.writeD(char.X);
    p.writeD(char.Y);
    p.writeD(char.Z);

    p.writeD(char.Heading);

    p.writeC(0xFF);

    return p;
}

serverGamePackets.StopMove = function (char) {
    var p = new protocol.BasePacket();

    p.writeC(0x47);

    p.writeD(char.ObjectId);

    p.writeD(char.X);
    p.writeD(char.Y);
    p.writeD(char.Z);

    p.writeD(char.Heading);

    return p;
}

serverGamePackets.MoveToLocation = function (char, coords) {
    var p = new protocol.BasePacket();

    p.writeC(0x2f);

    p.writeD(char.ObjectId);

    p.writeD(coords.X);
    p.writeD(coords.Y);
    p.writeD(coords.Z);

    p.writeD(char.X);
    p.writeD(char.Y);
    p.writeD(char.Z);

    return p;
}

serverGamePackets.ChangeMoveType = function (char, type) {
    var p = new protocol.BasePacket();

    // type
    // 0 - walk, 1 - run

    if (!type) type = 0;
    if ((typeof type == "string" && type.toLowerCase() != "run") || type != 1) type = 0; // WALK

    p.writeC(0x28);
    p.writeD(char.ObjectId);
    p.writeD(type);
    p.writeD(0); // c2

    return p;
}

serverGamePackets.RestartResponse = function (res, text) {
    var p = new protocol.BasePacket();

    p.writeC(0x71);

    p.writeD(res);
    p.writeS(text);

    return p;
}

serverGamePackets.ClientSetTime = function (gameServer) {
    var p = new protocol.BasePacket();

    p.writeC(0xf2);
    p.writeD(gameServer.settings.gameTime); // time in
    // client
    // minutes
    p.writeD(6); // constant to match the server time (this determines the speed of the client clock)

    return p;
}

serverGamePackets.ActionFailed = function () {
    var p = new protocol.BasePacket();

    p.writeC(0x1f);
    p.writeD(0x00);

    return p;
}

serverGamePackets.MacroListPacket = function () {
    var p = new protocol.BasePacket();

    p.writeC(0xe8);
    p.writeC(0); // _type
    p.writeD(0); // _first ? 0x00 : _macroId
    p.writeC(0); // _count
    p.writeC(0); // ?? _macro != null ? 1 : 0

    return p;
}

serverGamePackets.QuestList = function () {
    var p = new protocol.BasePacket();

    p.writeC(0x86);

    p.writeH(0); // remove on real list

    // TODO: quest list

    p.writeB(new Buffer(128));

    return p;
}

serverGamePackets.SkillList = function () {
    var p = new protocol.BasePacket();

    p.writeC(0x58);
    p.writeD(0);

    // TODO: skill list

    return p;
}

serverGamePackets.LeaveWorld = function () {
    var p = new protocol.BasePacket();

    p.writeC(0x7e);

    return p;
}

serverGamePackets.SSQInfo = function (state) {
    var p = new protocol.BasePacket();

    p.writeC(0x73);
    p.writeH(256);

    return p;
}

serverGamePackets.HennaInfo = function (char) {
    var p = new protocol.BasePacket();

    p.writeC(0xE5);
    p.writeC(char.INT); // equip INT
    p.writeC(char.STR); // equip STR
    p.writeC(char.CON); // equip CON
    p.writeC(char.MEN); // equip MEM
    p.writeC(char.DEX); // equip DEX
    p.writeC(char.WIT); // equip WIT
    p.writeC(char.LUC); // equip LUC
    p.writeC(char.CHA); // equip CHA
    p.writeD(3); // interlude, slots?

    var count = 0;
    p.writeD(count); // count
    //for (var i = 0; i < count; i++)
    //{
    //    p.writeD(_hennas[i]._symbolId);
    //    p.writeD(_hennas[i]._valid);
    //}
    p.writeD(0x00);
    p.writeD(0x00);
    p.writeD(0x00);

    return p;
}

serverGamePackets.ItemList = function (char, showWindow) {
    var p = new protocol.BasePacket();

    p.writeC(0x11);
    p.writeH(showWindow);
    p.writeH(0); // items count
    // for =>

    p.writeH(0); // special items count
    // for =>
    // or
    p.writeH(0x00);

    return p;
}

serverGamePackets.SkillList = function (char, lernedSkill) {
    var p = new protocol.BasePacket();

    p.writeC(0x5f);
    p.writeD(0); // skills count
    // for =>

    p.writeD(lernedSkill);

    return p;
}

serverGamePackets.SkillCoolTime = function (char, lernedSkill) {
    var p = new protocol.BasePacket();

    p.writeC(0xc7);
    p.writeD(0); // skillCoolTime count
    // for =>

    return p;
}

serverGamePackets.FriendList = function (char) {
    var p = new protocol.BasePacket();

    p.writeC(0x75);
    p.writeD(0); // _friends count
    // for =>

    return p;
}


serverGamePackets.ExPeriodicHenna = function () {
    var p = new protocol.BasePacket();

    p.writeC(0xFE);
    p.writeH(0x164);
    p.writeD(0x00);
    p.writeD(0x00);
    p.writeD(0x00);

    return p;
}

serverGamePackets.ExAcquireAPSkillList = function () {
    var p = new protocol.BasePacket();

    p.writeC(0xFE);
    p.writeH(0x15F);
    p.writeD(1);
    p.writeQ(10000000);
    p.writeQ(250000000);
    p.writeD(16);
    p.writeD(0);
    p.writeD(0);
    p.writeD(0);

    return p;
}

serverGamePackets.ShortCutInit = function (char) {
    var p = new protocol.BasePacket();

    p.writeC(0x45);
    p.writeD(0); // ShortCuts count
    // for =>

    return p;
}

serverGamePackets.ExSendManorList = function () {
    var p = new protocol.BasePacket();

    p.writeC(0xFE);
    p.writeH(0x22);

    p.writeD(0);

    // TODO: we have manor ?

    return p;
}

serverGamePackets.ExBR_NewIConCashBtnWnd = function () {
    var p = new protocol.BasePacket();

    p.writeC(0xFE);
    p.writeH(0x13A);

    p.writeH(0);

    return p;
}

serverGamePackets.ExShowFortressInfo = function () {
    var p = new protocol.BasePacket();

    p.writeC(0xFE);
    p.writeH(0x15);

    p.writeD(0);

    return p;
}

serverGamePackets.ExBR_PremiumState = function (char, state) {
    var p = new protocol.BasePacket();

    p.writeC(0xFE);
    p.writeH(0xDA);

    p.writeD(char.ObjectId);
    p.writeC(state);

    return p;
}

serverGamePackets.ExUISetting = function () {
    var p = new protocol.BasePacket();

    p.writeC(0xFE);
    p.writeH(0x71);

    p.writeD(16); // buffsize
    p.writeD(0); // categories
    p.writeD(0); // _keyCount

    // TODO: for (=>)

    p.writeD(17);
    p.writeD(16);

    return p;
}

serverGamePackets.ExLoginVitalityEffectInfo = function (char) {
    var p = new protocol.BasePacket();

    p.writeC(0xFE);
    p.writeH(0x119);

    p.writeD(100); // TODO: charInfo.getVitalityPoints() == 0 ? 0 : Config.ALT_VITALITY_RATE * 100
    // bonus
    p.writeD(5); // TODO: Remaining items count
    p.writeD(0x00); // TODO: Max vitality items
    p.writeD(0x00); // TODO: Max vitality items allowed

    return p;
}

serverGamePackets.CharInfo = (char) => {
    var p = new protocol.BasePacket();

    p.writeC(0x31);

    p.writeD(char.X);
    p.writeD(char.Y);
    p.writeD(char.Z);
    p.writeD(0); // _clanBoatObjectId // _vehicleId
    p.writeD(char.ObjectId); // ?
    p.writeS(char.Name);
    p.writeH(char.RaceId);
    p.writeC(char.Sex);

    p.writeD(char.BaseClassId); // visible class

    // 12 D
    for (var i = 0; i < 12; i++) {
        p.writeD(0x00);
    }

    p.writeQ(0x00);
    p.writeQ(0x00);
    p.writeQ(0x00);

    p.writeC(0); // talismans count // getArmorEnchant()

    // 9 D
    for (var i = 0; i < 9; i++) {
        p.writeD(0x00);
    }

    p.writeC(char.PvpFlag); // 0-non-pvp 1-pvp = violett name
    p.writeD(char.Karma); // TODO: var karma = 0 - char.Karma;

    p.writeD(char.MSpd);
    p.writeD(char.PSpd);

    p.writeH(char.RunSpd);
    p.writeH(char.WalkSpd);
    p.writeH(char.SwimRunSpd); // swimspeed 50
    p.writeH(char.SwimWalkSpd); // swimspeed 50
    p.writeH(char.FlRunSpd);
    p.writeH(char.FlWalkSpd);
    p.writeH(char.FlyRunSpd);
    p.writeH(char.FlyWalkSpd);

    p.writeF(char.MoveMultiplier); // 1
    p.writeF(char.AttackSpeedMultiplier); // 1

    p.writeF(char.CollisionRadius);
    p.writeF(char.CollisionHeight);

    p.writeD(char.HairStyle);
    p.writeD(char.HairColor);
    p.writeD(char.Face);

    var title = char.Title;
    //if (char.Appearance().getInvisible() && _activeChar.isGM()) {
    //    title = "Invisible";
    //}
    //if (char.Poly().isMorphed()) {
    //    L2NpcTemplate polyObj = NpcTable.getInstance().getTemplate(char.Poly().getPolyId());
    //    if (polyObj != null) {
    //        title += " - " + polyObj.name;
    //    }
    //}
    p.writeS(title);

    p.writeD(char.ClanId);
    p.writeD(char.ClanCrestId);
    p.writeD(char.AllyId);
    p.writeD(char.AllyCrestId); // ally crest id

    // p.writeD(0); // builder level

    p.writeC(!char.IsSiting); // standing - 1; sitting - 0 !!!
    p.writeC(char.IsRunning);
    p.writeC(char.IsInCombat);
    p.writeC(char.IsAlikeDead); // isInOlympiadMode() ? 1 : 0
    p.writeC(!char.Visible); // invis - 1, visible - 0 !!

    p.writeC(char.MountType); // 1-on Strider, 2-on Wyvern, 3-on Great Wolf, 0-no mount
    p.writeC(char.PrivateStoreType);

    p.writeH(char.Cubics.length);
    for (var i = 0; i < char.Cubics.length; i++) {
        p.writeH(char.Cubics[i].KeySetId);
    }

    p.writeC(0x00); // 1-find party members

    p.writeC(char.AbnormalEffect);  // isFlying = 2 | isInZone WATER = 1 | 0

    p.writeH(char.RecomHave); // recommendations received
    p.writeD(0); // mount id => getMountNpcId() + 1000000
    p.writeD(char.ClassId);

    p.writeD(0x00);

    p.writeC(0); // isMounted() ? 0 : char.EnchantEffect()

    if (char.Team == 1) {
        p.writeC(0x01); // team circle around feet 1= Blue, 2 = red
    }
    else if (char.Team == 2) {
        p.writeC(0x02); // team circle around feet 1= Blue, 2 = red
    }
    else {
        p.writeC(0x00); // team circle around feet 1= Blue, 2 = red
    }

    p.writeD(char.ClanCrestLargeId);

    p.writeC(char.IsNoble); // 0x01: symbol on char menu ctrl+I
    p.writeC(char.IsHero); // 0x01: Hero Aura

    p.writeC(char.IsFishing); // Fishing Mode
    p.writeD(char.FishX); // fishing x
    p.writeD(char.FishY); // fishing y
    p.writeD(char.FishZ); // fishing z
    p.writeD(char.NameColor);

    p.writeD(char.Heading);

    p.writeC(char.PledgeClass); // changes the text above CP on Status Window
    p.writeH(char.PledgeType);

    p.writeD(char.TitleColor);

    //if (_activeChar.isCursedWeaponEquiped()) {
    //    p.writeD(CursedWeaponsManager.getInstance().getLevel(char.CursedWeaponEquipedId()));
    //}
    //else {
    p.writeC(0x00);
    //}

    p.writeD(0); // getClanId() > 0 ? getClan().getReputationScore() : 

    // T1
    p.writeH(0); // getTransformation()
    p.writeH(0);
    p.writeH(0); //getAgathionId()
    p.writeH(0);

    // T2
    p.writeC(0x01);

    p.writeD(0);
    p.writeD(char.CurHP);
    p.writeD(char.MaxHP);
    p.writeD(char.CurMP);
    p.writeD(char.MaxMP);

    p.writeC(0); // _showHairAccessory - isShowingHat

    // for H -> getAveList
    p.writeD(0);

    p.writeC(0); // hasCoCAura() ? 100 : 0
    p.writeC(0); // getCloakStatus
    p.writeC(0); //_abilityPoints // showWings ? getSpentAbilityPoints : 0

    return p;
};


serverGamePackets.UserInfo = function (char) {

    var title = char.Title;
    //if (char.Appearance().getInvisible() && _activeChar.isGM()) {
    //    title = "Invisible";
    //}
    //if (char.Poly().isMorphed()) {
    //    L2NpcTemplate polyObj = NpcTable.getInstance().getTemplate(char.Poly().getPolyId());
    //    if (polyObj != null) {
    //        title += " - " + polyObj.name;
    //    }
    //}

    var _fullBlockSize = 2 + 1 + 1 + 1; // + 4
    var _blockSize = 2;

    _appearanceBlockSize = (char.Name.length * 2) + 14 + _blockSize;
    _fullBlockSize += _appearanceBlockSize;// - 2;

    _baseStatsBlockSize = 16 + _blockSize;
    _fullBlockSize += _baseStatsBlockSize;

    _maxStatsBlockSize = 12 + _blockSize;
    _fullBlockSize += _maxStatsBlockSize;

    _currStatsBlockSize = 36 + _blockSize;
    _fullBlockSize += _currStatsBlockSize;

    _weaponGlowBlockSize = 2 + _blockSize;
    _fullBlockSize += _weaponGlowBlockSize;

    _facialFeaturesBlockSize = 13 + _blockSize;
    _fullBlockSize += _facialFeaturesBlockSize;

    _personalStoreBlockSize = 4 + _blockSize;
    _fullBlockSize += _personalStoreBlockSize;

    _baseStatsv2BlockSize = 54 + _blockSize;
    _fullBlockSize += _baseStatsv2BlockSize;

    _elemDefBlockSize = 12 + _blockSize;
    _fullBlockSize += _elemDefBlockSize;

    _locationBlockSize = 16 + _blockSize;
    _fullBlockSize += _locationBlockSize;

    _moveSpeedBlockSize = 16 + _blockSize;
    _fullBlockSize += _moveSpeedBlockSize;

    _animSpeedBlockSize = 16 + _blockSize;
    _fullBlockSize += _animSpeedBlockSize;

    _objBounBlockSize = 16 + _blockSize;
    _fullBlockSize += _objBounBlockSize;

    _elemOffBlockSize = 3 + _blockSize;
    _fullBlockSize += _elemOffBlockSize;

    _pledgeInfoBlockSize = (title.length * 2) + 30 + _blockSize;
    _fullBlockSize += _pledgeInfoBlockSize;// - 2;

    _statsv3BlockSize = 20 + _blockSize;
    _fullBlockSize += _statsv3BlockSize;

    _vitalityBlockSize = 13 + _blockSize;
    _fullBlockSize += _vitalityBlockSize;

    _talismansBlockSize = 7 + _blockSize;
    _fullBlockSize += _talismansBlockSize;

    _moveTypeBlockSize = 2 + _blockSize;
    _fullBlockSize += _moveTypeBlockSize;

    _nameBlockSize = 8 + _blockSize;
    _fullBlockSize += _nameBlockSize;

    _invBlockSize = 7 + _blockSize;
    _fullBlockSize += _invBlockSize;

    _unk1BlockSize = 7 + _blockSize;
    _fullBlockSize += _unk1BlockSize;

    console.log('[GS] -- FullBlockSize: ' + _fullBlockSize);
    console.log('[GS] -- NodeBlockSize: ' + (373 + char.Name.length * 2 + title.length * 2));

    var p = new protocol.BasePacket();

    p.writeH(23); // structType const

    p.writeC(255); // 255
    p.writeC(255); // 255
    p.writeC(254); // 254

    // 0x40 leader rights
    // siege flags: attacker - 0x180 sword over name, defender - 0x80 shield, 0xC0 crown (|leader), 0x1C0 flag (|leader)
    //int relation = 0x00;
    //if (player.getClan() != null) {
    //    relation |= 0x20;
    //    if (player.isClanLeader()) {
    //        relation |= 0x40;
    //    }
    //}
    //if (player.getSiegeState() == 1) {
    //    relation |= 0x1000;
    //}

    p.writeD(0); // relation


    p.writeH(_appearanceBlockSize);
    p.writeH(char.Name.length);
    p.writeS2(char.Name);
    p.writeC(0); // TODO: isGM - fix for use //admin
    p.writeC(char.RaceId);
    p.writeC(char.Sex);
    p.writeD(char.BaseClassId); // 
    p.writeD(char.ClassId); //     ^
    p.writeC(char.Level);

    p.writeH(_baseStatsBlockSize);
    p.writeH(char.STR);
    p.writeH(char.DEX);
    p.writeH(char.CON);
    p.writeH(char.INT);
    p.writeH(char.WIT);
    p.writeH(char.MEN);
    p.writeH(char.LUC);
    p.writeH(char.CHA);

    p.writeH(_maxStatsBlockSize);
    p.writeD(char.MaxHP);
    p.writeD(char.MaxMP);
    p.writeD(char.MaxCP);

    p.writeH(_currStatsBlockSize);
    p.writeD(char.CurHP);
    p.writeD(char.CurMP);
    p.writeD(char.CurCP);
    p.writeQ(char.SP);
    p.writeQ(char.EXP);
    p.writeF(0); // TODO: percent EXP to next level

    p.writeH(_weaponGlowBlockSize);
    p.writeC(0); // enchant weapon glow // weapon ecnahnt, but hard rules on airship
    p.writeC(0); // enchant armor glow // getArmorEnchant

    p.writeH(_facialFeaturesBlockSize);
    p.writeD(char.HairStyle);
    p.writeD(char.HairColor);
    p.writeD(char.Face);
    p.writeC(0); // show hair accessory // isShowingHat

    p.writeH(_personalStoreBlockSize);
    p.writeC(char.MountType); // mounte type
    p.writeC(0); // private store // (player.getPrivateStoreType() != L2PcInstance.STORE_PRIVATE_CUSTOM_SELL ? player.getPrivateStoreType() : L2PcInstance.STORE_PRIVATE_SELL)
    p.writeC(0); // can crystalize // (player.canCrystallize() ? 1 : 0)
    p.writeC(0x00); // can Use Alchemy // getSpentAbilityPoints

    p.writeH(_baseStatsv2BlockSize);
    p.writeH(40); // weaponFLag 0x2B || 0x14 || 0
    p.writeD(char.PAtk); // Physic --
    p.writeD(char.PSpd);
    p.writeD(char.PDef);
    p.writeD(char.PEvasionRate);
    p.writeD(char.PAccuracy);
    p.writeD(char.PCriticalHit);
    p.writeD(char.MAtk); // Magic --
    p.writeD(char.MSpd);
    p.writeD(char.PSpd);
    p.writeD(char.MEvasionRate);
    p.writeD(char.MDef);
    p.writeD(char.MAccuracy);
    p.writeD(char.MCriticalHit);

    p.writeH(_elemDefBlockSize); // Resists --
    p.writeH(char.DefenceFire);
    p.writeH(char.DefenceWater);
    p.writeH(char.DefenceWind);
    p.writeH(char.DefenceEarth);
    p.writeH(char.DefenceHoly);
    p.writeH(char.DefenceUnholy);

    p.writeH(_locationBlockSize);
    p.writeD(char.X);
    p.writeD(char.Y);
    p.writeD(char.Z);
    p.writeD(char.BoatId);

    p.writeH(_moveSpeedBlockSize);
    p.writeH(char.RunSpd);
    p.writeH(char.WalkSpd);
    p.writeH(char.SwimRunSpd); // swimspeed // runSpd
    p.writeH(char.SwimWalkSpd); // swimspeed // walkSpd
    p.writeH(char.FlRunSpd); // mount // 0
    p.writeH(char.FlWalkSpd); // mount // 0
    p.writeH(char.FlyRunSpd); // isFly ? runSpd : 0
    p.writeH(char.FlyWalkSpd); // isFly ? walkSpd : 0


    p.writeH(_animSpeedBlockSize);
    p.writeF(char.MoveMultiplier);
    p.writeF(char.AttackSpeedMultiplier);

    p.writeH(_objBounBlockSize);
    // L2Summon pet = char.Pet();
    //if ((char.MountType() != 0) && (pet != null)) {
    //    writeF(pet.getTemplate().collisionRadius);
    //    writeF(pet.getTemplate().collisionHeight);
    //}
    //else {
    p.writeF(char.CollisionRadius);
    p.writeF(char.CollisionHeight);
    //}

    p.writeH(_elemOffBlockSize);
    p.writeC(char.AttackElement.Id);
    p.writeH(char.AttackElement.Value);

    p.writeH(_pledgeInfoBlockSize);
    p.writeH(title.length);
    p.writeS2(title);
    p.writeH(char.PledgeType);
    p.writeD(char.ClanId);
    p.writeD(char.ClanCrestLargeId);
    p.writeD(char.ClanCrestId);
    p.writeD(char.ClanPrivileges);
    p.writeH(char.IsClanLeader);
    p.writeH(char.AllyId);
    p.writeD(char.AllyCrestId); // ally crest id
    p.writeC(0x00); // TODO: looking for party

    p.writeH(_statsv3BlockSize);
    p.writeC(char.PvpFlag); // 0-non-pvp 1-pvp = violett name
    p.writeD(char.Karma);
    p.writeC(char.IsNoble); // 0x01: symbol on char menu ctrl+I
    p.writeC(char.IsHero); // 0x01: Hero Aura
    p.writeC(char.PledgeClass); // changes the text above CP on Status Window
    p.writeD(char.PK);
    p.writeD(char.PVP);
    p.writeH(char.RecomLeft); // c2 recommendations remaining
    p.writeH(char.RecomHave); // c2 recommendations received


    p.writeH(_vitalityBlockSize);
    p.writeD(char.Vitality);
    p.writeC(0x00);
    p.writeD(char.Fame);
    p.writeD(char.RaidPoints); // Рейдовые Очки

    p.writeH(_talismansBlockSize);
    p.writeC(0); // max talismans
    p.writeC(0); // max cloac|jewels
    if (char.Team == 1) {
        p.writeC(0x01); // team circle around feet 1= Blue, 3 = red, 2 = white
        p.writeC(1); // Светится вокруг персонажа красный пунтктирный круг.
    }
    else if (char.Team == 2) {
        p.writeC(0x03); // team circle around feet 1= Blue, 3 = red, 2 = white
        p.writeC(1); // Светится вокруг персонажа красный пунтктирный круг.
    }
    else {
        p.writeC(0x00); // team circle around feet 1= Blue, 3 = red, 2 = white
        p.writeC(0); // Светится вокруг персонажа красный пунтктирный круг.
    }

    p.writeC(0);
    p.writeC(0);
    p.writeC(0);

    p.writeH(_moveTypeBlockSize);
    p.writeC(0); // isFlying ? 0x01 : 0x00
    p.writeC(char.IsRunning);

    p.writeH(_nameBlockSize);
    p.writeD(char.NameColor);
    p.writeD(char.TitleColor);

    p.writeH(_invBlockSize);
    p.writeD(0); // mount id
    p.writeH(char.InventoryLimit);
    p.writeC(0); // hideTitle - при 1 не показывает титул - TODO: cursedWeaponEquiped

    p.writeH(_unk1BlockSize);
    p.writeD(1);
    p.writeH(0);
    p.writeC(0); // player.hasCoCAura() ? 100 : 0




    // --
    var pd = new protocol.BasePacket();
    pd.writeC(0x32);
    pd.writeD(char.ObjectId);
    pd.writeD(p._virtualBuffer.length);
    pd.writeB(new Buffer(p._virtualBuffer));
    // --

    console.log('[GS] -- CalcBufferSize: ' + p._virtualBuffer.length);

    return pd;
}

serverGamePackets.MagicAndSkillList = function (char) {
    var p = new protocol.BasePacket();

    p.writeC(0x40);
    p.writeD(char.ObjectId);
    p.writeD(0x00);
    p.writeC(0x86);
    p.writeC(0x25);
    p.writeC(0x0B);
    p.writeC(0x00);

    return p;
}

serverGamePackets.ExVitalityEffectInfo = function (char) {
    var p = new protocol.BasePacket();

    p.writeC(0xfe);
    p.writeH(0x118);
    p.writeD(char.Vitality);
    p.writeD(100); // TODO: vitality bonus - Config.ALT_VITALITY_RATE * 100
    p.writeH(5); // TODO: Remaining items count  // Vitality items allowed???
    p.writeH(5); // TODO: Remaining items count  // Total vitality items allowed???

    return p;
}

serverGamePackets.ExUserInfoInvenWeight = function (char) {
    var p = new protocol.BasePacket();

    p.writeC(0xFE);
    p.writeH(0x166);
    p.writeD(char.ObjectId);
    p.writeD(char.Load);
    p.writeD(char.InventoryLimit);

    return p;
}

serverGamePackets.ExStorageMaxCount = function (char) {
    var p = new protocol.BasePacket();

    p.writeC(0xfe);
    p.writeH(0x2f);

    p.writeD(char.Inventory);
    p.writeD(char.Warehouse);
    p.writeD(char.Freight);
    p.writeD(char.PrivateSell);
    p.writeD(char.PrivateBuy);
    p.writeD(char.ReceipeDwarf);
    p.writeD(char.Recipe);
    p.writeD(char.InventoryExtraSlots); // belt inventory slots increase count
    p.writeD(char.QuestItemsLimit); // quests list by off 100 maximum
    p.writeD(40); // Unknown (40 - offlike)
    p.writeD(40); // Unknown (40 - offlike)

    return p;
}

serverGamePackets.ExBasicActionList = function (basicActions, transformActions, type) {
    var p = new protocol.BasePacket();

    p.writeC(0xfe);
    p.writeH(0x60);

    var actions = type ? transformActions : basicActions;

    for (var i = 0; i < actions.length; i++) {
        p.writeD(actions[i]);
    }

    return p;
};

serverGamePackets.EtcStatusUpdate = function (char) {
    var p = new protocol.BasePacket();

    p.writeC(0xf9);

    p.writeD(char.IncreaseForce);  // 1-7 increase force, lvl //getFirstEffect(L2Effect.EffectType.CHARGE)  // skill id 4271
    p.writeD(char.WeightPenalty); // 1-4 weight penalty, lvl (1=50%, 2=66.6%, 3=80%, 4=100%) // skill id 4270
    p.writeC(char.WeaponExpertisePenalty); // weapon grade penalty, skill 6209 in epilogue // Weapon Grade Penalty [1-4]
    p.writeC(char.ArmorExpertisePenalty); // armor grade penalty, skill 6213 in epilogue // Armor Grade Penalty [1-4]
    p.writeD(char.DeathPenaltyBuffLevel); // 1-15 death penalty, lvl (combat ability decreased due to death)
    p.writeC(char.ConsumedSouls);
    p.writeD(char.DangerArea); // 1 = danger area



    return p;
}

serverGamePackets.CharSelected = function (gameServer, session2_1, char) {
    var p = new protocol.BasePacket();

    p.writeC(0x0B);

    p.writeS(char.Name);
    p.writeD(char.CharId); // ??
    p.writeS(char.Title);
    p.writeD(session2_1);
    p.writeD(char.ClanId);
    p.writeD(0x00); // ??
    p.writeD(char.Sex);
    p.writeD(char.RaceId);
    p.writeD(char.ClassId);
    p.writeD(0x01); // active ??
    p.writeD(char.X);
    p.writeD(char.Y);
    p.writeD(char.Z);

    p.writeF(char.CurHP);
    p.writeF(char.CurMP);
    p.writeQ(char.SP);
    p.writeQ(char.EXP);
    p.writeD(char.Level);
    p.writeD(char.Karma); // thx evill33t
    p.writeD(char.PK);

    p.writeD(0); // Game Time
    p.writeD(0);
    p.writeD(char.BaseClassId);

    p.writeD(0); // gg1
    p.writeD(0); // gg2
    p.writeD(0); // gg3
    p.writeD(0); // gg4

    p.writeB(new Buffer(64));  // gg5

    p.writeD(0);  // CM opcode shuffling seed

    return p;
}

serverGamePackets.CharSelectInfo = function (gameServer, login, session2_1, chars) {
    var p = new protocol.BasePacket();

    p.writeC(0x09);
    p.writeD(chars.length);
    p.writeD(7); //(gameServer.settings.maxCharacters);
    p.writeC(0); // _unk
    p.writeD(1); // PLAY_FREE
    p.writeC(1); // isKorean
    p.writeC(0); // gift

    console.log(login);
    console.log(chars.length);

    _.each(chars, (char) => {

        p.writeS(char.Name);
        p.writeD(char.CharId);

        p.writeS(login);
        p.writeD(session2_1);

        p.writeD(char.ClanId);
        p.writeD(0x00); // Builder level - ?

        p.writeD(char.Sex);
        p.writeD(char.RaceId);
        p.writeD(char.BaseClassId); // it's BaseClassId

        p.writeD(1); //(gameServer.server_id); // serverId    // active - ?? // 1

        p.writeD(char.X);
        p.writeD(char.Y);
        p.writeD(char.Z);

        p.writeF(char.CurHP); // char.CurHP
        p.writeF(char.CurMP); //char.CurMP

        p.writeQ(char.SP);
        p.writeQ(char.EXP);

        p.writeF(Math.min(char.EXP/100, 100)); // TODO: percent EXPT to next level
        p.writeD(char.Level); // TODO: check for current SP >= nextLevelSP = increaseLevel()

        p.writeD(char.Karma);
        p.writeD(char.PK);
        p.writeD(char.PVP);

        // D - 6
        for (var i = 0; i < 7; i++) { // trash
            p.writeD(0x00);
        }
        // D - 2
        p.writeD(0x00);
        p.writeD(0x00);


        for (var i = 0; i < 27; i++) { // paperdollOrder
            p.writeD(0);
        }

        for (var i = 0; i < 16; i++) { //paperdollOrder 2
            p.writeD(0);
        }

        p.writeH(0);
        p.writeH(0);
        p.writeH(0);

        p.writeD(char.HairStyle);
        p.writeD(char.HairColor);
        p.writeD(char.Face);

        p.writeF(char.MaxHP); // 
        p.writeF(char.MaxMP); // 

        p.writeD(char.DeleteDays);

        p.writeD(char.ClassId); // it's current ClassId

        p.writeD(char.Active);

        p.writeC(Math.min(char.EnchantEffect, 127));

        p.writeQ(char.AugmentationId); // RIGHT_HANF

        p.writeD(0); // getTransform: weaponId == 8190 => 301; weaponId == 8689 => 302;

        p.writeD(0); // _petObjectId
        p.writeD(0); // _petLvl
        p.writeD(0); // _petFood
        p.writeD(0); // _petFoodLvl
        p.writeF(0); // _petHP
        p.writeF(0); // _petMP

        p.writeD(2); // Vitality Level // Points
        p.writeD(200); // Vitality percent
        p.writeD(5); // Vitality items count // 5

        p.writeD(1); // Available - active = not banned / suspended

        //p.writeC(char.IsNoble); // 0x01: symbol on char menu ctrl+I
        //p.writeC(char.IsHero);
        p.writeH(0);
        p.writeC(0); //_unk2 - Show Hair Accessory

    });

    return p;
}

serverGamePackets.LoginResultPacket = function () {
    var p = new protocol.BasePacket();

    p.writeC(0x0a);
    p.writeD(0xFFFFFFFF);
    p.writeD(0);

    return p;
}

serverGamePackets.CryptInit = function (newXorKey) {
    var p = new protocol.BasePacket();

    p.writeC(0x2e);
    p.writeC(0x01);
    p.writeB(new Buffer(newXorKey));

    // L2 Classic block
    p.writeD(0x01);
    p.writeD(0x00); 	// Server ID
    p.writeC(0x00);
    p.writeD(0x00);
    p.writeC(0x01);
    p.writeC(0x01);

    return p;
}

module.exports = serverGamePackets;