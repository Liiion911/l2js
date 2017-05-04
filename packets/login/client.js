var protocol = require('../protocol.js');
var _ = require('underscore');

var clientLoginPackets = {};

//-----------------------------------------------//
// Login server client packets                   //
//-----------------------------------------------//

clientLoginPackets.RequestServerList = function(buffer) {
    var p = new protocol.ClientPacket(buffer);
    p.readD();
    p.readD();
    p.session1_1 = p._data[0];
    p.session1_2 = p._data[1];
    return p;
}

clientLoginPackets.RequestServerLogin = function(buffer) {
    var p = new protocol.ClientPacket(buffer);
    p.readD();
    p.readD();
    p.readC();
    p.session1_1 = p._data[0];
    p.session1_2 = p._data[1];
    p.server_id = p._data[2];
    return p;
}

clientLoginPackets.RequestGGAuth = function(buffer) {
    var p = new protocol.ClientPacket(buffer);
    p.readD();
    p.sessionId = p._data[0];
    return p;
}

clientLoginPackets.RequestAuthLogin = function(buffer) {
    var p = new protocol.ClientPacket(buffer);
    p.readB(128);
    p.login_pass = p._data[0];
    return p;
}

module.exports = clientLoginPackets;