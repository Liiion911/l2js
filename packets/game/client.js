var protocol = require('../protocol.js');
var _ = require('underscore');

var clientGamePackets = {};

//-----------------------------------------------//
// Game server client packets                   //
//-----------------------------------------------//

clientGamePackets.ProtocolVersion = function(buffer) {
    var p = new protocol.ClientPacket(buffer);
    p.readD();
    p.protocolVersion = p._data[0];
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