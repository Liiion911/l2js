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

//-----------------------------------------------//
// LoginServer                                   //
//-----------------------------------------------//

var loginServer = {
    sessionId: 0
};

helper.poolLoginServer = mysql.createPool({
    connectionLimit: 100,
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'iPRyRKu2',
    database: 'l2jls'
});

helper.poolLoginGameServer = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'iPRyRKu2',
    database: 'l2jgs'
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

    sock.client.blowFish = require('./packets/blowfish.js');

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