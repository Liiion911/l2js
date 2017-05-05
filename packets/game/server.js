var protocol = require('../protocol.js');
var _ = require('underscore');

var serverGamePackets = {};

//-----------------------------------------------//
// Game Server packets                          //
//-----------------------------------------------//

serverGamePackets.CreatureSay = function (sock, type, text, targetName) {
    var p = new protocol.BasePacket();

    p.writeC(0x4a);

    p.writeD(sock.client.char.ObjectId);
    p.writeD(type);
    p.writeS(targetName ? targetName : sock.client.char.Name);
    p.writeS(sock.client.char.Name);

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

serverGamePackets.ActionFailed = function () {
    var p = new protocol.BasePacket();

    p.writeC(0x25);

    return p;
}

serverGamePackets.LeaveWorld = function () {
    var p = new protocol.BasePacket();

    p.writeC(0x7e);

    return p;
}

serverGamePackets.UserInfo = function (char) {
    var p = new protocol.BasePacket();

    p.writeC(0x04);

    p.writeD(char.X);
    p.writeD(char.Y);
    p.writeD(char.Z);
    p.writeD(char.Heading); // ??
    p.writeD(char.ObjectId); // ?
    p.writeS(char.Name);
    p.writeD(char.Race);
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
    p.writeD(parseInt(char.HP));
    p.writeD(char.MaxMP);
    p.writeD(parseInt(char.MP));
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
    p.writeD(char.PAtkSpd);
    p.writeD(char.PDef);
    p.writeD(char.EvasionRate);
    p.writeD(char.Accuracy);
    p.writeD(char.CriticalHit);
    p.writeD(char.MAtk);

    p.writeD(char.MAtkSpd);
    p.writeD(char.PAtkSpd);

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
    p.writeF(8);
    p.writeF(23);
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
    p.writeD(parseInt(char.CP));
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

    p.writeD(0x07);  // 1-7 increase force, lvl //getFirstEffect(L2Effect.EffectType.CHARGE)
    p.writeD(char.WeightPenalty); // 1-4 weight penalty, lvl (1=50%, 2=66.6%, 3=80%, 4=100%)
    p.writeD(char.IsChatBanned); // 1 = block all chat
    p.writeD(0x00); // 1 = danger area
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
    p.writeD(char.Race);
    p.writeD(char.Classid);
    p.writeD(0x01); // active ??
    p.writeD(char.X);
    p.writeD(char.Y);
    p.writeD(char.Z);

    p.writeF(char.HP);
    p.writeF(char.MP);
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

serverGamePackets.CharSelectInfo = function (login, session2_1, chars) {
    var p = new protocol.BasePacket();

    p.writeC(0x13);
    p.writeD(chars.length);

    _.each(chars, (char) => {

        p.writeS(char.Name);
        p.writeD(char.CharId);

        p.writeS(login);
        p.writeD(session2_1);

        p.writeD(char.ClanId);
        p.writeD(0x00); // Builder level - ?

        p.writeD(char.Sex);
        p.writeD(char.Race);
        p.writeD(char.BaseClassId); // it's BaseClassId

        p.writeD(0x01); // active - ??

        p.writeD(char.X);
        p.writeD(char.Y);
        p.writeD(char.Z);

        p.writeF(char.HP);
        p.writeF(char.MP);

        p.writeD(char.SP);
        p.writeQ(char.EXP);
        p.writeD(char.Level); // TODO: check for current SP >= nextLevelSP = increaseLevel()

        p.writeD(char.Karma);
        p.writeD(char.PK);

        p.writeD(char.PVP);

        for (var i = 0; i < 7; i++) { // trash
            p.writeD(0x00);
        }

        for (var i = 0; i < 17; i++) { // paperdollOrder
            p.writeD(0);
        }

        for (var i = 0; i < 17; i++) { //paperdollOrder 2
            p.writeD(0);
        }

        p.writeD(char.HairStyle);
        p.writeD(char.HairColor);
        p.writeD(char.Face);

        p.writeF(char.MaxHP);
        p.writeF(char.MaxMP);

        p.writeD(char.DeleteDays);

        p.writeD(char.ClassId); // it's current ClassId

        p.writeD(char.Active);

        p.writeC(Math.min(char.EnchantEffect, 127));

        p.writeD(char.AugmentationId);

        p.writeH(0);
        p.writeH(0);

    });

    return p;
}

serverGamePackets.CryptInit = function (newXorKey) {
    var p = new protocol.BasePacket();

    p.writeC(0x00);
    p.writeC(0x01);
    p.writeB(new Buffer(newXorKey));
    p.writeD(0x01);
    p.writeD(0x01);

    return p;
}

module.exports = serverGamePackets;