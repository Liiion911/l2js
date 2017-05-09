var _ = require('underscore');
var crypto = require('./crypto.js');
var db = require('../db/db.js');
var serverLoginPackets = require('./login/server.js');
var serverGamePackets = require('./game/server.js');

var helper = {
    defaultKey: [0x6b, 0x60, 0xcb, 0x5b, 0x82, 0xce, 0x90, 0xb1, 0xcc, 0x2b, 0x6c, 0x55, 0x6c, 0x6c, 0x6c, 0x6c],
    autoCreate: true
};

helper.isAlphaNumeric = (str) => {
    return /^[a-zA-Z0-9]*$/.test(str);
};

helper.isAlphaNumericAndSpecial = (str) => {
    return /^[a-zA-Zа-яА-ЯёЁ0-9_\-]*$/.test(str);
};

helper.isAlphaNumeric = (str) => {
    return /^[a-zA-Zа-яА-ЯёЁ0-9_\-]*$/.test(str);
};

helper.createChar = (char, cb) => {

    var query = db.insertCharacter(char);
    helper.poolGameServer.getConnection(function (err_con, connection) {

        if (err_con) {
            console.log(err_con);
        } else {

            connection.query(query.text, query.values, function (err, result) {

                connection.release();

                if (err) {
                    console.log(err);
                } else {

                    cb(result);

                }

            });

        }
    });

};

helper.getNextObjectId = (cb) => {

    var query = db.getServerData();
    helper.poolGameServer.getConnection(function (err_con, connection) {

        if (err_con) {
            console.log(err_con);
        } else {

            connection.query(query.text, query.values, function (err, result) {

                connection.release();

                if (err) {
                    console.log(err);
                } else {

                    cb(result);

                }

            });

        }
    });

};

helper.existCharName = (name, cb) => {

    var query = db.getCharByName(name);
    helper.poolGameServer.getConnection(function (err_con, connection) {

        if (err_con) {
            console.log(err_con);
        } else {

            connection.query(query.text, query.values, function (err, result) {

                connection.release();

                if (err) {
                    console.log(err);
                } else {

                    cb(result);

                }

            });

        }
    });

};

helper.initializeCharTemplates = (gameServer) => {

    var query = db.getCharTemplates();
    helper.poolGameServer.getConnection(function (err_con, connection) {

        if (err_con) {
            console.log(err_con);
        } else {

            connection.query(query.text, query.values, function (err, result) {

                connection.release();

                if (err) {
                    console.log(err);
                } else {

                    gameServer.charTemplates = [];

                    _.each(result, (res) => {

                        gameServer.charTemplates.push(res);

                    });

                }

            });

        }
    });

};

helper.initializeMapRegions = (gameServer) => {

    var query = db.getMapRegions();
    helper.poolGameServer.getConnection(function (err_con, connection) {

        if (err_con) {
            console.log(err_con);
        } else {

            connection.query(query.text, query.values, function (err, result) {

                connection.release();

                if (err) {
                    console.log(err);
                } else {

                    var count2 = 0;

                    if (!gameServer.World.regions) gameServer.World.regions = [];

                    _.each(result, (region) => {
                        regionId = region.region;

                        for (var j = 0; j < 10; j++) {
                            if (!gameServer.World.regions[j]) gameServer.World.regions[j] = [];

                            gameServer.World.regions[j][regionId] = region["sec" + j];

                            //console.log('Init - j: ' + j + '; region: ' + regionId + '; value: ' + region["sec" + j]);

                            count2++;

                        }
                    });

                    console.log('[GS] Loaded map regions: ' + count2);

                }

            });

        }
    });

};

helper.isInsideRadiusObject = (object, x, y, z, radius, checkZ, strictCheck) => {
    return helper.isInsideRadiusPos(object.X, object.Y, object.Z, x, y, z, radius, checkZ, strictCheck);
};

helper.isInsideRadiusPlayers = (player1, player2, radius, checkZ, strictCheck) => {
    return helper.isInsideRadiusPos(player1.X, player1.Y, player1.Z, player2.X, player2.Y, player2.Z, radius, checkZ, strictCheck);
};

helper.isInsideRadiusPos = (posX1, posY1, posZ1, posX2, posY2, posZ2, radius, checkZ, strictCheck) => {
    var dx = posX2 - posX1;
    var dy = posY2 - posY1;
    var dz = posZ2 - posZ1;

    if (strictCheck) {
        if (checkZ) return ((dx * dx) + (dy * dy) + (dz * dz)) < (radius * radius);

        return ((dx * dx) + (dy * dy)) < (radius * radius);
    }

    if (checkZ) return ((dx * dx) + (dy * dy) + (dz * dz)) <= (radius * radius);

    return ((dx * dx) + (dy * dy)) <= (radius * radius);
}

helper.getMapRegion = (gameServer, posX, posY) => {
    var x = helper.getMapRegionX(posX);
    var y = helper.getMapRegionY(posY);

    //console.log(gameServer.World.regions[x].length);

    return gameServer.World.regions[x][y];
}

helper.getMapRegionX = (posX) => {
    //console.log('POSX: ', posX, ' ', (posX >> 15) + 4);
    return (posX >> 15) + 4;// + centerTileX;
};

helper.getMapRegionY = (posY) => {
    //console.log('POSY: ', posY, ' ', (posY >> 15) + 10);
    return (posY >> 15) + 10;// + centerTileX;
};

helper.exceptionHandler = (ex) => {
    console.log('catch exception');
    console.log(ex);
};

helper.savePlayer = (sock, cb) => {
    console.log('[GS] Start save char: ' + sock.client.char.Name);

    // TODO: get pool/connection, save character to db

};

helper.disconnectPlayer = (login, clients, sock) => {
    try {

        if (!sock) {
            sock = _.find(clients, (s) => {
                var username = s.client.data ? s.client.data.login : "";
                return username == login
            });
        }

        if (sock) { // if finded player

            console.log('[GS] Kick player: ' + login);

            helper.sendGamePacket('ServerClose', sock);

            helper.savePlayer(sock, () => {
                sock.destroy();
                clients.splice(clients.indexOf(sock), 1); // rly need ?
            });

        }

    } catch (ex) {
        helper.exceptionHandler(ex);
    }
};

helper.syncPlayersCount = function (gameServer) {
    try {

        var playersCount = gameServer.clients.length;

        if (playersCount != gameServer.onlineSyncCount) {

            var query = db.updateServerData(playersCount);
            helper.poolGameServer.getConnection(function (err_con, connection) {

                if (err_con) {
                    console.log(err_con);
                } else {

                    connection.query(query.text, query.values, function (err, result) {

                        connection.release();

                        if (err) {
                            console.log(err);
                        } else {

                            gameServer.onlineSyncCount = playersCount;
                            console.log('[GS] Online Players counter - synchronized: ' + playersCount);

                        }

                    });

                }

            });

        }

    } catch (ex) {
        helper.exceptionHandler(ex);
    }
};


helper.getPlanDistanceSq = (x, y) => {
    var dist = 0;
    try {
        dist = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    } catch (ex) {
        helper.exceptionHandler(ex);
    }
    return dist;
};

helper.stopMovePlayer = (gameServer, sock, posObject, broadcast, update) => {
    try {

        if (!sock.client.char.moveObject) {
            sock.client.char.moveObject = {};
        }
        if (sock.client.char.moveObject.moveTimerId) {
            clearInterval(sock.client.char.moveObject.moveTimerId);
        }

    } catch (ex) {
        helper.exceptionHandler(ex);
    }
};

helper.movePlayer = (gameServer, sock, posObject) => {
    try {
        if (!sock.client.char.moveObject) {
            sock.client.char.moveObject = {};
        }
        if (sock.client.char.moveObject.moveTimerId) {
            clearInterval(sock.client.char.moveObject.moveTimerId);
        }

        sock.client.char.moveObject = posObject;

        _.each(gameServer.World.getInstance(sock).getPlayersInRadius(sock, 3500, true, false), (player) => {

            helper.sendGamePacket('MoveToLocation', player, sock.client.char, sock.client.char.moveObject);

        });

        console.log('[GS] Broadcast packet MoveToLocation');

        // TODO: broadcastToPartyMembers


        sock.client.char.Heading = posObject.h;

        sock.client.char.moveObject.moveTimerId = setInterval(() => {

            // TODO: ValidateWaterZones

            //if (helper.isInsideRadiusPos(posObject.X, posObject.Y, posObject.Z, sock.client.char.X, sock.client.char.Y, sock.client.char.Z, Math.max(posObject.spdX, posObject.spdY), false, false)) {

            // arrived
            if (sock.client.char.X == sock.client.char.moveObject.X
                && sock.client.char.Y == sock.client.char.moveObject.Y
                && sock.client.char.Z == sock.client.char.moveObject.Z) {

                sock.client.char.moveObject.ticksToMove = 0;
                clearInterval(sock.client.char.moveObject.moveTimerId);

                helper.stopMovePlayer(gameServer, sock, sock.client.char.moveObject, false, false);

                return;
            }

            if (sock.client.char.moveObject.ticksToMove > sock.client.char.moveObject.ticksToMoveCompleted) {

                sock.client.char.moveObject.ticksToMoveCompleted++;

                sock.client.char.X += sock.client.char.moveObject.spdX;
                sock.client.char.Y += sock.client.char.moveObject.spdY;

                var realX = sock.client.char.X;
                var realY = sock.client.char.Y;
                var realZ = sock.client.char.Z;

                //console.log("[GS] update position on interval: " + realX + " " + realY + " " + realZ + " head " + sock.client.char.Heading);

            } else {

                sock.client.char.X = sock.client.char.moveObject.X;
                sock.client.char.Y = sock.client.char.moveObject.Y;
                sock.client.char.Z = sock.client.char.moveObject.Z;

                sock.client.char.moveObject.ticksToMove = 0;
                clearInterval(sock.client.char.moveObject.moveTimerId);

                helper.stopMovePlayer(gameServer, sock, sock.client.char.moveObject, false, false);

            }

        }, 10);

    } catch (ex) {
        helper.exceptionHandler(ex);
    }
};

helper.checkDisconnectedPlayersInInstance = (gameServer) => {

    setInterval(() => {

        _.each(gameServer.World.getInstance().getPlayers(), (player) => {

            if (player.destroyed) gameServer.World.getInstance(player).removePlayer(player);

        });

    }, 1000);

};

helper.unknownLoginPacket = function (sock, packetId, packetsArrayParse) {
    console.log('[LS] UNKNOWN PACKET - ' + packetId);
    sock.destroy();
};

helper.unknownGamePacket = function (sock, packetId, packetsArrayParse) {
    console.log('[GS] UNKNOWN PACKET - ' + packetId);
};

helper.sendLoginPacket = function (packetName, sock) {
    try {
        var packet = serverLoginPackets[packetName](arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8], arguments[9], arguments[10]);
        var packetArray = helper.preSendLogin(packet.getContent(), sock);
        sock.write(new Buffer(packetArray));
    } catch (ex) {
        helper.exceptionHandler(ex);
    }
}

helper.sendGamePacket = function (packetName, sock) {
    try {
        var packet = serverGamePackets[packetName](arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8], arguments[9], arguments[10]);
        var packetArray = helper.preSendGame(packet.getContent(), sock);
        sock.write(new Buffer(packetArray));
    } catch (ex) {
        helper.exceptionHandler(ex);
    }
}

helper.preSendGame = function (array, sock) {
    try {
        crypto.encrypt(sock, array, 0, array.length);

        var newArray1 = new Uint8Array(array.length + 2);
        newArray1.fill(0, 0, array.length + 2);
        for (var i = 0; i < array.length; i++) {
            newArray1[i + 2] = array[i] || 0;
        }

        var len = array.length + 2;
        newArray1[0] = (len & 0xff);
        newArray1[1] = ((len >> 8) & 0xff);

        return newArray1;
    } catch (ex) {
        helper.exceptionHandler(ex);
    }
    return [];
}

helper.cryptPreSendGame = function (array, sock) {
    try {
        var newArray1 = new Uint8Array(array.length + 2);
        newArray1.fill(0, 0, array.length + 2);
        for (var i = 0; i < array.length; i++) {
            newArray1[i + 2] = array[i] || 0;
        }

        var len = array.length + 2;
        newArray1[0] = (len & 0xff);
        newArray1[1] = ((len >> 8) & 0xff);

        return newArray1;
    } catch (ex) {
        helper.exceptionHandler(ex);
    }
    return [];
}

helper.preSendLogin = function (array, sock) {
    try {

        var newArray1 = new Uint8Array(array.length + 4);
        newArray1.fill(0, 0, array.length + 4);
        for (var i = 0; i < array.length; i++) {
            newArray1[i] = array[i] || 0;
        }

        var newArray2 = new Uint8Array((newArray1.length + 8) - newArray1.length % 8);
        newArray2.fill(0, 0, (newArray1.length + 8) - newArray1.length % 8);
        for (var i = 0; i < newArray1.length; i++) {
            newArray2[i] = newArray1[i] || 0;
        }

        crypto.appendChecksum(newArray2, 0, newArray2.length);
        sock.client.blowFish.encrypt(newArray2, 0, newArray2.length);

        var newArray4 = new Uint8Array(newArray2.length + 2);
        var len = newArray2.length + 2;
        newArray4[0] = (len & 0xff);
        newArray4[1] = ((len >> 8) & 0xff);
        for (var i = 0; i < newArray2.length; i++) {
            newArray4[i + 2] = newArray2[i] || 0;
        }

        return newArray4;


    } catch (ex) {
        helper.exceptionHandler(ex);
    }

    return [];
}

helper.initPreSendLogin = function (array, pubKey, sock) {
    try {
        var newArray1 = new Uint8Array(array.length + 6);
        newArray1.fill(0, 0, array.length + 6);
        for (var i = 0; i < array.length; i++) {
            newArray1[i] = array[i] || 0;
        }

        var newArray2 = new Uint8Array((newArray1.length + 8) - newArray1.length % 8);
        newArray2.fill(0, 0, (newArray1.length + 8) - newArray1.length % 8);
        for (var i = 0; i < newArray1.length; i++) {
            newArray2[i] = newArray1[i] || 0;
        }

        var xorKey = (parseInt((Math.random() * 1000000000).toFixed(0)));
        var newArray3 = crypto.encXORPass(newArray2, 0, newArray2.length, xorKey)

        sock.client.blowFish.init(helper.defaultKey);
        sock.client.blowFish.encrypt(newArray3, 0, newArray3.length);
        sock.client.blowFish.init(pubKey);

        var newArray4 = new Uint8Array(186);
        newArray4[0] = 186;
        newArray4[1] = 0;
        for (var i = 0; i < newArray3.length; i++) {
            newArray4[i + 2] = newArray3[i] || 0;
        }

        return newArray4;

    } catch (ex) {
        helper.exceptionHandler(ex);
    }

    return [];
};

module.exports = helper;