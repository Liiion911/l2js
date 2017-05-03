var net = require("net");
var fs = require("fs");
var execFile = require('child_process').execFile;
var util = require('util');
var _ = require('underscore');
var mysql = require('mysql');

var protocol = require('./packets/protocol.js');
var crypto = require('./packets/crypto.js');
var helper = require('./packets/helper.js');

var clientLoginPackets = require('./packets/login/client.js');
var serverLoginPackets = require('./packets/login/server.js');
var loginPacketController = require('./packets/loginPacketController.js');

var clientGamePackets = require('./packets/game/client.js');
var serverGamePackets = require('./packets/game/server.js');
var gamePacketController = require('./packets/gamePacketController.js');


helper.allServerData = [];
helper.ip = [192, 168, 0, 100];

//-----------------------------------------------//
// LoginServer                                   //
//-----------------------------------------------//
var loginServer = {
    sessionId: 0
};

helper.poolLoginServer = mysql.createPool({
    connectionLimit: 100,
    host: process.env.OPENSHIFT_MYSQL_DB_HOST || 'localhost',
    port: process.env.OPENSHIFT_MYSQL_DB_PORT || 3306,
    user: process.env.PRODUCTION ? 'adminBqKe6Qy' : 'root',
    password: process.env.PRODUCTION ? 'yH7ykk4DHNNS' : 'iPRyRKu2',
    database: process.env.PRODUCTION ? 'l2jls' : 'l2jls'
});

helper.poolGameServer = mysql.createPool({
    connectionLimit: 100,
    host: process.env.OPENSHIFT_MYSQL_DB_HOST || 'localhost',
    port: process.env.OPENSHIFT_MYSQL_DB_PORT || 3306,
    user: process.env.PRODUCTION ? 'adminBqKe6Qy' : 'root',
    password: process.env.PRODUCTION ? 'yH7ykk4DHNNS' : 'iPRyRKu2',
    database: process.env.PRODUCTION ? 'l2jls' : 'l2jgs'
});

loginServer.server = net.createServer();
loginServer.server.listen(2106);
console.log('LoginServer listening on ' + loginServer.server.address().address + ':' + loginServer.server.address().port);
loginServer.server.on('connection', function (sock) {

    loginServer.sessionId++;

    sock.client = {
        status: 0,
        sessionId: loginServer.sessionId
    };

    console.log('[LS] CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

    sock.on('data', function (data) {
        loginPacketController.onRecivePacket(data, sock)
    });

    sock.on('close', function (had_error) {
        console.log('[LS] CLOSED: ' + had_error + ', ' + sock.remoteAddress + ' ' + sock.remotePort);
    });

    sock.on('end', function () {
        console.log('[LS] END: ' + sock.remoteAddress + ' ' + sock.remotePort);
    });

    sock.on('error', function (err) {
        console.log('[LS] ERROR: ' + err + ' , ' + sock.remoteAddress + ' ' + sock.remotePort);
    });

    sock.client.blowFish = require('./blowfish.js');

    var pubKey = new Buffer(crypto.newPubKey());

    var keygen = execFile(__dirname + "/RSAgenerator/RSAGenerator.exe", ["key", sock.client.sessionId.toString()], function (error, stdout, stderr) {
        if (error) {
            console.log(error);
        }
        console.log(stdout);

        delete require.cache[require.resolve("./RSAgenerator/keys/" + sock.client.sessionId + ".json")];
        var rsaKeyPairs;
        sock.client.rsaKeyPairs = rsaKeyPairs = require("./RSAgenerator/keys/" + sock.client.sessionId + ".json");
        var buf = new Buffer(rsaKeyPairs._scrambledModulus, 'base64');
        sock.client.rsaKeyPairs._old_scrambledModulus = rsaKeyPairs._scrambledModulus;
        sock.client.rsaKeyPairs._scrambledModulus = buf;

        var buff = serverLoginPackets.Init(pubKey, rsaKeyPairs._scrambledModulus, sock);

        var array = new Buffer(buff.getContent());

        array = helper.initPreSendLogin(array, pubKey, sock);

        sock.client.status = 1;
        sock.write(new Buffer(array));

        console.log('[LS] Send packet Init');

    });

});


//-----------------------------------------------//
// GameServer                                    //
//-----------------------------------------------//
var gameServer = {};

gameServer.server = net.createServer();
gameServer.server.listen(7777);
console.log('GameServer listening on ' + gameServer.server.address().address + ':' + gameServer.server.address().port);
gameServer.server.on('connection', function (sock) {

    sock.client = {
        status: 0
    };

    console.log('[GS] CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

    sock.on('data', function (data) {
        gamePacketController.onRecivePacket(data, sock)
    });

    sock.on('close', function (had_error) {
        console.log('[GS] CLOSED: ' + had_error + ', ' + sock.remoteAddress + ' ' + sock.remotePort);
    });

    sock.on('end', () => {
        console.log('[GS] END: ' + sock.remoteAddress + ' ' + sock.remotePort);
    });

    sock.on('error', function (err) {
        console.log('[GS] ERROR: ' + err + ' , ' + sock.remoteAddress + ' ' + sock.remotePort);
    });

});
