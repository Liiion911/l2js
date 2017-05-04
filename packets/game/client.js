﻿var protocol = require('../protocol.js');
var _ = require('underscore');

var clientGamePackets = {};

//-----------------------------------------------//
// Game server client packets                   //
//-----------------------------------------------//

clientGamePackets.Say2 = function (buffer) {
    var p = new protocol.ClientPacket(buffer);
    p.readS();
    p.readD();

    p.text = p._data[0];
    p.type = p._data[1];

    if (p.type < 0 || p.type > 23) {
        p.type = 0;
    }

    if (p.type == 2) { // CHAT_TELL
        p.readS();
        p.target = p._data[2];
    }

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

clientGamePackets.MoveBackwardToLocation = function (buffer) {
    var p = new protocol.ClientPacket(buffer);
    p.readD();
    p.readD();
    p.readD();
    p.readD();
    p.readD();
    p.readD();
    p.readD();

    p.toX = p._data[0];
    p.toY = p._data[1];
    p.toZ = p._data[2];

    p.origX = p._data[3];
    p.origY = p._data[4];
    p.origZ = p._data[5];

    p.mouse = p._data[6];  // is 0 if cursor keys are used 1 if mouse is used

    return p;
}

clientGamePackets.ProtocolVersion = function(buffer) {
    var p = new protocol.ClientPacket(buffer);
    p.readD();
    p.protocolVersion = p._data[0];
    return p;
}

clientGamePackets.CharacterSelected = function (buffer) {
    var p = new protocol.ClientPacket(buffer);
    p.readD();
    p.charIndex = p._data[0];
    return p;
}

clientGamePackets.AuthLogin = function (buffer) {
    var p = new protocol.ClientPacket(buffer);
    p.readS()
    p.readD();
    p.readD();
    p.readD();
    p.readD();
    p.login = p._data[0].toLowerCase();
    p.session2_2 = p._data[1];
    p.session2_1 = p._data[2];
    p.session1_1 = p._data[3];
    p.session1_2 = p._data[4];
    return p;
}

module.exports = clientGamePackets;