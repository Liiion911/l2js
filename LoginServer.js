﻿// TODO: RTFM http://stackoverflow.com/questions/7310521/node-js-best-practice-exception-handling
process.on('uncaughtException', function (err) {
    console.log('uncaughtException');
    console.log(err);
})

var loginDomain = require('domain').create();

loginDomain.on('error', (err) => {
    console.log('domain error');
    console.log(err);
});

loginDomain.run(() => {

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
        sessionId: 0,
        loginServerMasterPort: 5555,
        gameServers: {}
    };

    loginServer.exceptionHandler = helper.exceptionHandler;

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
    loginServer.server.on('connection', (sock) => {

        loginServer.sessionId++;

        sock.client = {
            status: 0,
            sessionId: loginServer.sessionId
        };

        console.log('[LS] CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

        sock.on('data', (data) => {
            try {
                loginPacketController.onRecivePacket(data, sock, loginServer);
            } catch (ex) {
                loginServer.exceptionHandler(ex);
            }
        });

        sock.on('close', (had_error) => {
            console.log('[LS] CLOSED: ' + had_error + ', ' + sock.remoteAddress + ' ' + sock.remotePort);
        });

        sock.on('end', () => {
            console.log('[LS] END: ' + sock.remoteAddress + ' ' + sock.remotePort);
        });

        sock.on('error', (err) => {
            console.log('[LS] ERROR: ' + err + ' , ' + sock.remoteAddress + ' ' + sock.remotePort);
        });

        sock.client.blowFish = require('./packets/blowfish.js');

        try {

            var pubKey = new Buffer(crypto.newPubKey());

            var keygen = execFile(__dirname + "/RSAgenerator/RSAGenerator.exe", ["key", sock.client.sessionId.toString()], (error, stdout, stderr) => {
                if (error) {
                    console.log(error);
                }
                console.log(stdout);

                try {
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
                }
                catch (ex) {
                    loginServer.exceptionHandler(ex);
                }

            });

        } catch (ex) {
            loginServer.exceptionHandler(ex);
        }

    });

    loginServer.master = net.createServer();
    loginServer.master.listen(loginServer.loginServerMasterPort);
    console.log('LoginServer Master listening on ' + loginServer.master.address().address + ':' + loginServer.master.address().port);
    loginServer.master.on('connection', (sock) => {

        console.log('[LS] CONNECTED GAME SERVER TO MASTER: ' + sock.remoteAddress + ':' + sock.remotePort);

        sock.on('data', (data) => {
            try {

                var dataArray = data.toString('utf8').split('|');
                switch (data[0]) {
                    case "0": // game server info
                        var game_server_id = data[1];
                        var online = data[2];
                        if (!gameServers[game_server_id]) {
                            gameServers[game_server_id] = {
                                logins: []
                            };
                        }
                        gameServers[game_server_id].sock = sock;
                        gameServers[game_server_id].online = online;
                        break;
                    case "1": // player attempted to connect
                        var game_server_id = data[1];
                        var username = data[2];

                        if (!gameServers[game_server_id]) {
                            gameServers[game_server_id] = {
                                logins: []
                            };
                        }

                        if (!gameServers[game_server_id].logins[username]) gameServers[game_server_id].logins[username] = {};

                        if (gameServers[server_id].logins[sock.client.login]["1"]) {
                            gameServers[server_id].logins[sock.client.login]["1"].cb(true);
                        }

                        break;
                }

            } catch (ex) {
                loginServer.exceptionHandler(ex);
            }
        });

        sock.on('close', (had_error) => {
            console.log('[LS] CLOSED: ' + had_error + ', ' + sock.remoteAddress + ' ' + sock.remotePort);
        });

        sock.on('end', () => {
            console.log('[LS] END: ' + sock.remoteAddress + ' ' + sock.remotePort);
        });

        sock.on('error', (err) => {
            console.log('[LS] ERROR: ' + err + ' , ' + sock.remoteAddress + ' ' + sock.remotePort);
        });

    });

    loginServer.attemptToLoginOnGameServer = (sock, server_id, cb) => {
        try {
            if (gameServers[server_id]) {
                if (!gameServers[server_id].logins[sock.client.login]) gameServers[server_id].logins[sock.client.login] = {};
                gameServers[server_id].logins[sock.client.login]["1"] = {
                    cb: cb
                };
                gameServers[server_id].sock.write('1|' + sock.client.login);
            } else {
                cb(false);
            }
        } catch (ex) {
            loginServer.exceptionHandler(ex);
        }
    };
});