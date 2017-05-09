// TODO: RTFM http://stackoverflow.com/questions/7310521/node-js-best-practice-exception-handling
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
        gameServers: []
    };

    loginServer.exceptionHandler = helper.exceptionHandler;

    helper.poolLoginServer = mysql.createPool({
        connectionLimit: 100,
        host: 'ikonto.ddns.net', //'localhost',
        port: 3306,
        user: 'root',
        password: 'iPRyRKu2',
        database: 'l2jls'
    });

    helper.poolLoginGameServer = mysql.createPool({
        connectionLimit: 10,
        host: 'ikonto.ddns.net', //'localhost',
        port: 3306,
        user: 'root',
        password: 'iPRyRKu2',
        database: 'l2jgs'
    });


    loginServer.server = net.createServer();
    loginServer.server.listen(2106);
    console.log('[LS] LoginServer listening on ' + loginServer.server.address().address + ':' + loginServer.server.address().port);
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
    console.log('[AS] LoginServer Master listening on ' + loginServer.master.address().address + ':' + loginServer.master.address().port);
    loginServer.master.on('connection', (sock) => {

        console.log('[AS] CONNECTED GAME SERVER TO MASTER: ' + sock.remoteAddress + ':' + sock.remotePort);

        sock.on('data', (data) => {
            try {

                console.log('[AS] Recived packet: ' + data.toString('utf8'));

                var dataArray = data.toString('utf8').split('|');
                switch (dataArray[0]) {
                    case "0": // game server info
                        var game_server_id = dataArray[1];
                        var online = dataArray[2];

                        sock.game_server_id = game_server_id;

                        console.log('[AS] NEW GAME SERVER WITH ID: ' + game_server_id);

                        if (!loginServer.gameServers[game_server_id]) {
                            loginServer.gameServers[game_server_id] = {
                                logins: []
                            };
                        }
                        loginServer.gameServers[game_server_id].sock = sock;
                        loginServer.gameServers[game_server_id].online = online;

                        break;

                    case "1": // player attempted to connect

                        var game_server_id = dataArray[1];
                        var username = dataArray[2];

                        sock.game_server_id = game_server_id;

                        console.log('[AS] Attemp to connect player recived: ' + username);

                        if (!loginServer.gameServers[game_server_id]) {
                            loginServer.gameServers[game_server_id] = {
                                logins: []
                            };
                        }

                        if (!loginServer.gameServers[game_server_id].logins[username]) loginServer.gameServers[game_server_id].logins[username] = {};

                        if (loginServer.gameServers[game_server_id].logins[username]["1"]) {
                            loginServer.gameServers[game_server_id].logins[username]["1"].cb(true);
                        }

                        break;
                }

            } catch (ex) {
                loginServer.exceptionHandler(ex);
            }
        });

        sock.on('close', (had_error) => {
            if (sock.game_server_id) {
                loginServer.gameServers.splice(loginServer.gameServers.indexOf(loginServer.gameServers[sock.game_server_id]), 1);
            }
            console.log('[AS] CLOSED: ' + had_error + ', ' + sock.remoteAddress + ' ' + sock.remotePort);
            console.log('[AS] DISCONNECTED GAME SERVER WITH ID: ' + sock.game_server_id);
        });

        sock.on('end', () => {
            console.log('[AS] END: ' + sock.remoteAddress + ' ' + sock.remotePort);
        });

        sock.on('error', (err) => {
            console.log('[AS] ERROR: ' + err + ' , ' + sock.remoteAddress + ' ' + sock.remotePort);
        });

    });

    loginServer.attemptToLoginOnGameServer = (sock, server_id, cb) => {
        try {

            console.log('[AS] Attempt to connect to server ' + server_id + ' player: ' + sock.client.login);

            //console.log(loginServer.gameServers);

            console.log(loginServer.gameServers.length);

            if (loginServer.gameServers[server_id]) {
                if (!loginServer.gameServers[server_id].logins[sock.client.login]) loginServer.gameServers[server_id].logins[sock.client.login] = {};
                loginServer.gameServers[server_id].logins[sock.client.login]["1"] = {
                    cb: cb
                };
                loginServer.gameServers[server_id].sock.write('1|' + sock.client.login);

                console.log('[AS] Attemp to connect player sended: ' + sock.client.login);

            } else {
                cb(false);
            }
        } catch (ex) {
            loginServer.exceptionHandler(ex);
        }
    };
});