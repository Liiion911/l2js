var protocol = require('../protocol.js');
var _ = require('underscore');

var clientGamePackets = {};

//-----------------------------------------------//
// Game server client packets                   //
//-----------------------------------------------//

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