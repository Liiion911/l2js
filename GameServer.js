var net = require("net");
var fs = require("fs");
var execFile = require('child_process').execFile;
var util = require('util');
var _ = require('underscore');
var mysql = require('mysql');

var protocol = require('./packets/protocol.js');
var crypto = require('./packets/crypto.js');
var helper = require('./packets/helper.js');
var db = require('./db/db.js');

var clientGamePackets = require('./packets/game/client.js');
var serverGamePackets = require('./packets/game/server.js');
var gamePacketController = require('./packets/gamePacketController.js');


//-----------------------------------------------//
// GameServer                                    //
//-----------------------------------------------//

var gameServer = {
    server_id: 1,
    clients: [],
    onlineSyncCount: -1,
    loginServerMasterIP: '127.0.0.1',
    loginServerMasterPort: 5555
};

helper.poolGameServer = mysql.createPool({
    connectionLimit: 100,
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'iPRyRKu2',
    database: 'l2jgs'
});

gameServer.server = net.createServer();
gameServer.server.listen(7777);
console.log('GameServer listening on ' + gameServer.server.address().address + ':' + gameServer.server.address().port);
gameServer.server.on('connection', (sock) => {

    sock.client = {
        status: 0
    };

    console.log('[GS] CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

    gameServer.clients.push(sock);
    helper.syncPlayersCount(gameServer);

    sock.on('data', (data) => {
        gamePacketController.onRecivePacket(data, sock)
    });

    sock.on('close', (had_error) => {
        console.log('[GS] CLOSED: ' + had_error + ', ' + sock.remoteAddress + ' ' + sock.remotePort);
    });

    sock.on('end', () => {
        console.log('[GS] END: ' + sock.remoteAddress + ' ' + sock.remotePort);
        gameServer.clients.splice(gameServer.clients.indexOf(sock), 1);
        helper.syncPlayersCount(gameServer);
    });

    sock.on('error', (err) => {
        console.log('[GS] ERROR: ' + err + ' , ' + sock.remoteAddress + ' ' + sock.remotePort);
    });

});

gameServer.connectToMaster = () => {

    gameServer.client = new net.Socket();
    gameServer.client.connect(gameServer.loginServerMasterPort, gameServer.loginServerMasterIP, () => {
        console.log('[GS] Connected to Login Server Master');
        gameServer.client.write('0|' + gameServer.server_id + '|' + gameServer.clients.length);
    });

    gameServer.client.on('data', (data) => {
        var dataArray = data.split('|');
        switch (data[0]) {
            case "0": // disconnect player
                var username = data[1];
                helper.disconnectPlayer(username, gameServer.clients, 0)
                break;
        }
    });

    gameServer.client.on('close', () => {
        console.log('[GS] Closed connection to Login Server Master');
        setTimeout(() => {
            gameServer.connectToMaster();
        }, 10000)
    });


    gameServer.client.on('error', (err) => {
        console.log('[GS] Error connection to Login Server Master');
    });

};

gameServer.connectToMaster();

setInterval(() => {

    helper.syncPlayersCount(gameServer);

}, 30000);
