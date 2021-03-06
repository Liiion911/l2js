// TODO: RTFM http://stackoverflow.com/questions/7310521/node-js-best-practice-exception-handling
process.on('uncaughtException', function (err) {
    console.log('uncaughtException');
    console.log(err);
})

var gameDomain = require('domain').create();

gameDomain.on('error', (err) => {
    console.log('domain error');
    console.log(err);
});

gameDomain.run(() => {

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
        loginServerMasterPort: 5555,
        settings: {
            gameTime: 55,
            maxCharacters: 5,
            removeDisconnectedPlayerTimeout: 10, // seconds
        }
    };

    gameServer.exceptionHandler = helper.exceptionHandler;

    helper.poolGameServer = mysql.createPool({
        connectionLimit: 100,
        host: '127.0.0.1', //ikonto.ddns.net
        port: 3306,
        user: 'root',
        password: 'admin',
        database: 'l2js'
    });

    gameServer.server = net.createServer();
    gameServer.server.listen(7777);
    console.log('[GS] GameServer listening on ' + gameServer.server.address().address + ':' + gameServer.server.address().port);
    gameServer.server.on('connection', (sock) => {

        sock.setKeepAlive(true, 5000); //
        sock.setTimeout(30000, () => {
            // TODO: NetPing + timeout
            //console.log('[GS] TIMEOUT: ' + sock.remoteAddress + ' ' + sock.remotePort);
            //sock.destroy();
        });

        sock.client = {
            status: 0
        };

        console.log('[GS] CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

        try {
            gameServer.clients.push(sock);
            helper.syncPlayersCount(gameServer);
        } catch (ex) {
            loginServer.exceptionHandler(ex);
        }

        sock.on('data', (data) => {
            try {
                gamePacketController.onRecivePacket(data, sock, gameServer);
            } catch (ex) {
                gameServer.exceptionHandler(ex);
            }
        });

        sock.on('close', (had_error) => {
            console.log('[GS] CLOSED: ' + had_error + ', ' + sock.remoteAddress + ' ' + sock.remotePort);
        });

        sock.on('end', () => {
            console.log('[GS] END: ' + sock.remoteAddress + ' ' + sock.remotePort);
            try {

                // TODO: all check and operations in one - helper.playerDisconnected();

                helper.savePlayer(sock, () => {
                    try {

                        gameServer.clients.splice(gameServer.clients.indexOf(sock), 1);
                        gameServer.World.getInstance(sock).removePlayer(sock);
                        helper.syncPlayersCount(gameServer);
                        sock.destroy();
                        sock.removePLayerTimerId = setTimeout(() => {

                        }, gameServer.settings.removeDisconnectedPlayerTimeout)

                    } catch (ex) {
                        gameServer.exceptionHandler(ex);
                    }
                });

            } catch (ex) {
                gameServer.exceptionHandler(ex);
            }
        });

        sock.on('error', (err) => {
            console.log('[GS] ERROR: ' + err + ' , ' + sock.remoteAddress + ' ' + sock.remotePort);
        });

    });

    gameServer.connectToMaster = () => {
        try {

            gameServer.client = new net.Socket();
            gameServer.client.connect(gameServer.loginServerMasterPort, gameServer.loginServerMasterIP, () => {
                setTimeout(() => {
                    try {

                        gameServer.client.write('0|' + gameServer.server_id + '|' + gameServer.clients.length + '|');
                        console.log('[AS] Connected to Login Server Master');
                    } catch (ex) {
                        gameServer.exceptionHandler(ex);
                        gameServer.client.end();
                    }
                }, 100);
            });

            gameServer.client.on('data', (data) => {
                try {
                    var dataArray = data.toString('utf8').split('|');
                    switch (dataArray[0]) {
                        case "1": // attempt login
                            var username = dataArray[1];

                            console.log('[AS] Attemp to connect player recived: ' + username);

                            helper.disconnectPlayer(username, gameServer.clients);
                            gameServer.client.write('1|' + gameServer.server_id + '|' + username);

                            // TODO: remove player with timeout or on new connection from this character

                            break;
                    }
                } catch (ex) {
                    gameServer.exceptionHandler(ex);
                }
            });

            gameServer.client.on('close', () => {
                console.log('[AS] Closed connection to Login Server Master');
                setTimeout(() => {
                    gameServer.connectToMaster();
                }, 10000)
            });


            gameServer.client.on('error', (err) => {
                console.log('[AS] Error connection to Login Server Master');
            });

        } catch (ex) {
            gameServer.exceptionHandler(ex);
        }

    };

    gameServer.World = {
        instances: [
            {
                instanceId: 0,
                name: "World",
                players: [],
                removePlayer: function (sock) {
                    this.players.splice(this.players.indexOf(sock), 1);
                },
                addPlayer: function (sock) {
                    this.players.push(sock);
                },
                getPlayers: function () {
                    return this.players;
                },
                getPlayerByObjectId: function (objectId) {
                    let players = this.getPlayers();
                    return _.find(players, (player) => { return player.client.char.ObjectId == objectId });
                },
                getPlayersInRadius: function (sock, radius, checkZ, strictCheck) {
                    var players = this.getPlayers();
                    var playersInRadius = [];
                    _.each(players, (player) => {
                        if (player.client.char) {
                            if (helper.isInsideRadiusPlayers(player.client.char, sock.client.char, radius, checkZ, strictCheck)) playersInRadius.push(player);
                        }
                    });
                    return playersInRadius;
                }
            }
        ],
        getInstance: (sock) => {
            let instanceId = 0;
            if (sock && sock.client.char && gameServer.World.instances.length > sock.client.char.Instance) instanceId = sock.client.char.Instance;
            return gameServer.World.instances[instanceId];
        }
    };


    helper.checkDisconnectedPlayersInInstance(gameServer);

    gameServer.connectToMaster();

    // TODO: cascad load and THEN listen gameserver port


    helper.getNextObjectId((res) => {

        console.log('[GS] Next ObjectId: ' + res[0].nextObjectId);

        gameServer.nextObjectId = res[0].nextObjectId;

        helper.initializeMapRegions(gameServer);

        helper.initializeCharTemplates(gameServer);

    });



    setInterval(() => {

        helper.syncPlayersCount(gameServer);

    }, 30000);

});
