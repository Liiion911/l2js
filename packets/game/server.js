var protocol = require('../protocol.js');
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

    p.writeC(0x2a);

    p.writeD(targetObj.ObjectId);
    p.writeD(targetObj.X);
    p.writeD(targetObj.Y);
    p.writeD(targetObj.Z);

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

    p.writeC(0x61);

    p.writeD(char.ObjectId);

    p.writeD(char.X);
    p.writeD(char.Y);
    p.writeD(char.Z);

    p.writeD(char.Heading);

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

    p.writeC(0x01);

    p.writeD(char.ObjectId);

    p.writeD(coords.X);
    p.writeD(coords.Y);
    p.writeD(coords.Z);

    p.writeD(char.X);
    p.writeD(char.Y);
    p.writeD(char.Z);

    return p;
}

serverGamePackets.RestartResponse = function (res, text) {
    var p = new protocol.BasePacket();

    p.writeC(0x5F);

    p.writeD(res);
    p.writeS(text);

    return p;
}

serverGamePackets.ActionFailed = function () {
    var p = new protocol.BasePacket();

    p.writeC(0x25);

    return p;
}

serverGamePackets.QuestList = function () {
    var p = new protocol.BasePacket();

    p.writeC(0x80);

    p.writeH(0); // remove on real list
    p.writeH(0); // remove on real list

    // TODO: quest list

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

serverGamePackets.ExSendManorList = function () {
    var p = new protocol.BasePacket();

    p.writeC(0xFE);
    p.writeH(0x22);

    p.writeD(0);

    // TODO: we have manor ?

    return p;
}

serverGamePackets.ExLoginVitalityEffectInfo = function () {
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

    p.writeC(0x03);

    p.writeD(char.X);
    p.writeD(char.Y);
    p.writeD(char.Z);
    p.writeD(char.Heading); // ??
    p.writeD(char.ObjectId); // ?
    p.writeS(char.Name);
    p.writeD(char.RaceId);
    p.writeD(char.Sex);

    p.writeD(char.ClassId);

    // 12 D
    for (var i = 0; i < 12; i++) {
        p.writeD(0x00);
    }

    // c6 new h's
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeD(0); // char.Inventory().getPaperdollAugmentationId(Inventory.PAPERDOLL_RHAND);

    // 12 H
    for (var i = 0; i < 12; i++) {
        p.writeH(0x00);
    }

    p.writeD(0); // char.Inventory().getPaperdollAugmentationId(Inventory.PAPERDOLL_LRHAND);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);

    p.writeD(char.PvpFlag); // 0-non-pvp 1-pvp = violett name
    p.writeD(char.Karma);

    p.writeD(char.MSpd);
    p.writeD(char.PSpd);

    p.writeD(char.PvpFlag); // second ?
    p.writeD(char.Karma); // second ?

    p.writeD(char.RunSpd);
    p.writeD(char.WalkSpd);
    p.writeD(char.SwimRunSpd); // swimspeed 50
    p.writeD(char.SwimWalkSpd); // swimspeed 50
    p.writeD(char.FlRunSpd);
    p.writeD(char.FlWalkSpd);
    p.writeD(char.FlyRunSpd);
    p.writeD(char.FlyWalkSpd);
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

    p.writeD(0); // builder level

    p.writeC(!char.IsSiting); // standing - 1; sitting - 0 !!!
    p.writeC(char.IsRunning);
    p.writeC(char.IsInCombat);
    p.writeC(char.IsAlikeDead);
    p.writeC(!char.Visible); // invis - 1, visible - 0 !!

    p.writeC(char.MountType);
    p.writeC(char.PrivateStoreType);

    p.writeH(char.Cubics.length);
    for (var i = 0; i < char.Cubics.length; i++) {
        p.writeH(char.Cubics[i].KeySetId);
    }

    p.writeC(0x00); // 1-find party members

    p.writeD(char.AbnormalEffect);  // ??

    p.writeC(char.RecomLeft); // c2 recommendations remaining
    p.writeH(char.RecomHave); // c2 recommendations received

    p.writeD(char.ClassId);

    p.writeD(char.MaxCP);
    p.writeD(parseInt(char.CurCP));

    p.writeC(0); // _activeChar.isMounted() ? 0 : char.EnchantEffect()

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

    // new c5
    p.writeD(0); // p.writeC(char.IsRunning); // changes the Speed display on Status Window

    p.writeD(char.PledgeClass); // changes the text above CP on Status Window
    p.writeD(0x00); // ??

    p.writeD(char.TitleColor);

    //if (_activeChar.isCursedWeaponEquiped()) {
    //    p.writeD(CursedWeaponsManager.getInstance().getLevel(char.CursedWeaponEquipedId()));
    //}
    //else {
    p.writeD(0x00);
    //}

    return p;
};

serverGamePackets.UserInfo = function (char) {
    var p = new protocol.BasePacket();

    p.writeC(0x04);

    p.writeD(char.X);
    p.writeD(char.Y);
    p.writeD(char.Z);
    p.writeD(char.Heading); // ??
    p.writeD(char.ObjectId); // ?
    p.writeS(char.Name);
    p.writeD(char.RaceId);
    p.writeD(char.Sex);

    p.writeD(char.ClassId);

    p.writeD(char.Level);
    p.writeQ(char.EXP);

    p.writeD(char.STR);
    p.writeD(char.DEX);
    p.writeD(char.CON);
    p.writeD(char.INT);
    p.writeD(char.WIT);
    p.writeD(char.MEN);

    p.writeD(char.MaxHP);
    p.writeD(parseInt(char.CurHP));
    p.writeD(char.MaxMP);
    p.writeD(parseInt(char.CurMP));
    p.writeD(char.SP);
    p.writeD(char.Load);
    p.writeD(char.MaxLoad);

    p.writeD(0x28); // unknown

    // 17 D
    for (var i = 0; i < 17; i++) {
        p.writeD(0x00);
    }

    // 17 D
    for (var i = 0; i < 17; i++) {
        p.writeD(0x00);
    }

    // c6 new h's
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeD(0); // char.Inventory().getPaperdollAugmentationId(Inventory.PAPERDOLL_RHAND);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeD(0); // char.Inventory().getPaperdollAugmentationId(Inventory.PAPERDOLL_LRHAND);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    p.writeH(0x00);
    // end of c6 new h's

    p.writeD(char.PAtk);
    p.writeD(char.PSpd);
    p.writeD(char.PDef);
    p.writeD(char.EvasionRate);
    p.writeD(char.Accuracy);
    p.writeD(char.CriticalHit);
    p.writeD(char.MAtk);

    p.writeD(char.MSpd);
    p.writeD(char.PSpd);

    p.writeD(char.MDef);

    p.writeD(char.PvpFlag); // 0-non-pvp 1-pvp = violett name
    p.writeD(char.Karma);

    p.writeD(char.RunSpd);
    p.writeD(char.WalkSpd);
    p.writeD(char.SwimRunSpd); // swimspeed
    p.writeD(char.SwimWalkSpd); // swimspeed
    p.writeD(char.FlRunSpd);
    p.writeD(char.FlWalkSpd);
    p.writeD(char.FlyRunSpd);
    p.writeD(char.FlyWalkSpd);
    p.writeF(char.MoveMultiplier);
    p.writeF(char.AttackSpeedMultiplier);

    // L2Summon pet = char.Pet();
    //if ((char.MountType() != 0) && (pet != null)) {
    //    writeF(pet.getTemplate().collisionRadius);
    //    writeF(pet.getTemplate().collisionHeight);
    //}
    //else {
    p.writeF(char.CollisionRadius);
    p.writeF(char.CollisionHeight);
    //}

    p.writeD(char.HairStyle);
    p.writeD(char.HairColor);
    p.writeD(char.Face);
    p.writeD(0); // builder level

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

    // 0x40 leader rights
    // siege flags: attacker - 0x180 sword over name, defender - 0x80 shield, 0xC0 crown (|leader), 0x1C0 flag (|leader)
    //_relation = _activeChar.isClanLeader() ? 0x40 : 0;
    //if (_activeChar.getSiegeState() == 1) {
    //    _relation |= 0x180;
    //}
    //if (_activeChar.getSiegeState() == 2) {
    //    _relation |= 0x80;
    //}
    p.writeD(0);

    p.writeC(char.MountType); // mount type
    p.writeC(char.PrivateStoreType);
    p.writeC(char.HasDwarvenCraft);
    p.writeD(char.PK);
    p.writeD(char.PVP);

    p.writeH(char.Cubics.length);
    for (var i = 0; i < char.Cubics.length; i++)
    {
        p.writeH(char.Cubics[i].KeySetId);
    }

    p.writeC(0x00); // 1-find party members

    p.writeD(char.AbnormalEffect);  // ??
    p.writeC(0x00);

    p.writeD(char.ClanPrivileges);

    p.writeH(char.RecomLeft); // c2 recommendations remaining
    p.writeH(char.RecomHave); // c2 recommendations received
    p.writeD(0x00);
    p.writeH(char.InventoryLimit);

    p.writeD(char.ClassId);
    p. writeD(0x00); // special effects? circles around player...
    p.writeD(char.MaxCP);
    p.writeD(parseInt(char.CurCP));
    p.writeC(0); // _activeChar.isMounted() ? 0 : char.EnchantEffect()

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

    // new c5
    p.writeC(char.IsRunning); // changes the Speed display on Status Window

    p.writeD(char.PledgeClass); // changes the text above CP on Status Window
    p.writeD(0x00); // ??

    p.writeD(char.TitleColor);

    // writeD(0x00); // ??

    //if (_activeChar.isCursedWeaponEquiped()) {
    //    p.writeD(CursedWeaponsManager.getInstance().getLevel(char.CursedWeaponEquipedId()));
    //}
    //else {
        p.writeD(0x00);
    //}

    return p;
}

serverGamePackets.ExStorageMaxCount = function (char) {
    var p = new protocol.BasePacket();

    p.writeC(0xfe);
    p.writeH(0x2e);

    p.writeD(char.Inventory);
    p.writeD(char.Warehouse);
    p.writeD(char.Freight);
    p.writeD(char.PrivateSell);
    p.writeD(char.PrivateBuy);
    p.writeD(char.ReceipeDwarf);
    p.writeD(char.Recipe);

    return p;
}


serverGamePackets.EtcStatusUpdate = function (char) {
    var p = new protocol.BasePacket();

    p.writeC(0xF3);

    p.writeD(char.IncreaseForce);  // 1-7 increase force, lvl //getFirstEffect(L2Effect.EffectType.CHARGE)
    p.writeD(char.WeightPenalty); // 1-4 weight penalty, lvl (1=50%, 2=66.6%, 3=80%, 4=100%)
    p.writeD(char.IsChatBanned); // 1 = block all chat
    p.writeD(char.DangerArea); // 1 = danger area
    p.writeD(Math.min(char.ExpertisePenalty, 1)); // 1 = grade penalty
    p.writeD(char.CharmOfCourage); // 1 = charm of courage (no xp loss in siege..)
    p.writeD(char.DeathPenaltyBuffLevel); // 1-15 death penalty, lvl (combat ability decreased due to death)

    return p;
}

serverGamePackets.CharSelected = function (session2_1, char) {
    var p = new protocol.BasePacket();

    p.writeC(0x15);

    p.writeS(char.Name);
    p.writeD(char.CharId); // ??
    p.writeS(char.Title);
    p.writeD(session2_1);
    p.writeD(char.ClanId);
    p.writeD(0x00); // ??
    p.writeD(char.Sex);
    p.writeD(char.RaceId);
    p.writeD(char.Classid);
    p.writeD(0x01); // active ??
    p.writeD(char.X);
    p.writeD(char.Y);
    p.writeD(char.Z);

    p.writeF(char.CurHP);
    p.writeF(char.CurMP);
    p.writeD(char.SP);
    p.writeQ(char.EXP);
    p.writeD(char.Level);
    p.writeD(char.Karma); // thx evill33t
    p.writeD(0x0); // ?
    p.writeD(char.INT);
    p.writeD(char.STR);
    p.writeD(char.CON);
    p.writeD(char.MEN);
    p.writeD(char.DEX);
    p.writeD(char.WIT);
    for (var i = 0; i < 30; i++) {
        p.writeD(0x00);
    }

    p.writeD(0x00); // c3 work
    p.writeD(0x00); // c3 work

    // extra info
    p.writeD(0); // in-game time

    p.writeD(0x00); //

    p.writeD(0x00); // c3

    p.writeD(0x00); // c3 InspectorBin
    p.writeD(0x00); // c3
    p.writeD(0x00); // c3
    p.writeD(0x00); // c3

    p.writeD(0x00); // c3 InspectorBin for 528 client
    p.writeD(0x00); // c3
    p.writeD(0x00); // c3
    p.writeD(0x00); // c3
    p.writeD(0x00); // c3
    p.writeD(0x00); // c3
    p.writeD(0x00); // c3
    p.writeD(0x00); // c3

    return p;
}

serverGamePackets.CharSelectInfo = function (gameServer, login, session2_1, chars) {
    var p = new protocol.BasePacket();

    p.writeC(0x09);
    p.writeD(chars.length);
    p.writeD(gameServer.settings.maxCharacters);
    p.writeC(0); // _unk
    p.writeC(0); // PLAY_FREE
    p.writeD(0); // isKorean
    p.writeC(0); // gift

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

        p.writeD(gameServer.server_id); // serverId    // active - ??

        p.writeD(char.X);
        p.writeD(char.Y);
        p.writeD(char.Z);

        p.writeF(char.CurHP);
        p.writeF(char.CurMP);

        p.writeD(char.SP);
        p.writeQ(char.EXP);

        p.writeF(0); // TODO: percent EXPT to next level
        p.writeD(char.Level); // TODO: check for current SP >= nextLevelSP = increaseLevel()

        p.writeD(char.Karma);
        p.writeD(char.PK);

        p.writeD(char.PVP);

        for (var i = 0; i < 7; i++) { // trash
            p.writeD(0x00);
        }

        p.writeD(0x00);
        p.writeD(0x00);


        for (var i = 0; i < 9; i++) { // paperdollOrder
            p.writeD(0);
        }

        for (var i = 0; i < 9; i++) { //paperdollOrder 2
            p.writeD(0);
        }

        p.writeH(0);
        p.writeH(0);
        p.writeH(0);
        p.writeH(0);
        p.writeH(0);


        p.writeD(char.HairStyle);
        p.writeD(char.HairColor);
        p.writeD(char.Face);

        p.writeF(char.MaxHP);
        p.writeF(char.MaxMP);

        p.writeD(char.DeleteDays);

        p.writeD(char.ClassId); // it's current ClassId

        p.writeD(char.Active);

        p.writeC(Math.min(char.EnchantEffect, 127));

        p.writeH(char.AugmentationId); // LEFT_HANF
        p.writeH(char.AugmentationId); // RIGHT_HAND

        p.writeD(0); // getTransform: weaponId == 8190 => 301; weaponId == 8689 => 302;
        p.writeD(0); // _petObjectId
        p.writeD(0); // _petLvl
        p.writeD(0); // _petFood
        p.writeD(9); // _petFoodLvl
        p.writeF(0); // _petHP
        p.writeF(0); // _petMP

        p.writeD(1);
        p.writeD(200); // Vitality percent
        p.writeD(5); // Vitality items count
        p.writeD(1);
        p.writeC(char.IsNoble); // 0x01: symbol on char menu ctrl+I
        p.writeC(char.IsHero);
        p.writeC(1); //_unk2

    });

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