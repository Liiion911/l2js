var net = require("net");
var fs = require("fs");
var execFile = require('child_process').execFile;
var util = require('util');
var _ = require('underscore');
var mysql = require('mysql');

var protocol = require('./packets/protocol.js');
var crypto = require('./packets/crypto.js');
var helper = require('./packets/helper.js');
var db = require('../db/db.js');

var clientGamePackets = require('./packets/game/client.js');
var serverGamePackets = require('./packets/game/server.js');
var gamePacketController = require('./packets/gamePacketController.js');


//-----------------------------------------------//
// GameServer                                    //
//-----------------------------------------------//

var gameServer = {

};

helper.poolGameServer = mysql.createPool({
    connectionLimit: 100,
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'iPRyRKu2',
    database: 'l2jgs'
});

gameServer.clients = [];
gameServer.onlineSyncCount = -1;

gameServer.server = net.createServer();
gameServer.server.listen(7777);
console.log('GameServer listening on ' + gameServer.server.address().address + ':' + gameServer.server.address().port);
gameServer.server.on('connection', function (sock) {

    sock.client = {
        status: 0
    };

    console.log('[GS] CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

    gameServer.clients.push(sock);
    helper.syncPlayersCount(gameServer);

    sock.on('data', function (data) {
        gamePacketController.onRecivePacket(data, sock)
    });

    sock.on('close', function (had_error) {
        console.log('[GS] CLOSED: ' + had_error + ', ' + sock.remoteAddress + ' ' + sock.remotePort);
    });

    sock.on('end', () => {
        console.log('[GS] END: ' + sock.remoteAddress + ' ' + sock.remotePort);
        gameServer.clients.splice(gameServer.clients.indexOf(socket), 1);
        helper.syncPlayersCount(gameServer);
    });

    sock.on('error', function (err) {
        console.log('[GS] ERROR: ' + err + ' , ' + sock.remoteAddress + ' ' + sock.remotePort);
    });

});

setInterval(() => {

    helper.syncPlayersCount(gameServer);

}, 30000);
