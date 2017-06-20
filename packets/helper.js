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

                    console.log('[GS] CharTemplates loaded: ' + gameServer.charTemplates.length);

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

helper.doAction = (gameServer, sock, player, action) => {
    if (action == -1) { // cancel target
        if (sock.client.char.TargetId) {

            sock.client.char.TargetId = 0;
            sock.client.char.Target = null;

            _.each(gameServer.World.getInstance(sock).getPlayersInRadius(sock, 3500, true, false), (player) => {

                helper.sendGamePacket('TargetUnselected', player, player, { ObjectId: sock.client.char.ObjectId, X: sock.client.char.X, Y: sock.client.char.Y, Z: sock.client.char.Z });

            });

            console.log('[GS] Broadcast packet TargetUnselected');

        } else {
            helper.sendGamePacket('ActionFailed', sock);
        }
        
    } else {
        if (sock.client.char.TargetId != player.client.char.ObjectId) {

            sock.client.char.TargetId = player.client.char.ObjectId;
            sock.client.char.Target = player.client.char;

            helper.sendGamePacket('MyTargetSelected', sock, sock, sock.client.char.TargetId, 0);
            console.log('[GS] Send packet MyTargetSelected');

            _.each(gameServer.World.getInstance(sock).getPlayersInRadius(sock, 3500, true, false), (player) => {

                helper.sendGamePacket('TargetSelected', player, player, { TargetId: sock.client.char.TargetId, ObjectId: sock.client.char.ObjectId, X: sock.client.char.X, Y: sock.client.char.Y, Z: sock.client.char.Z });

            });

            console.log('[GS] Broadcast packet TargetSelected');

        } else {
            helper.sendGamePacket('ActionFailed', sock);
        }
    }
};

helper.savePlayer = (sock, cb) => {
    if (sock.client.char) {
        console.log('[GS] Start save char: ' + sock.client.char.Name);

        var query = db.updateCharacter(sock.client.char);
        helper.poolGameServer.getConnection(function (err_con, connection) {

            if (err_con) {
                console.log(err_con);
                cb(2);
            } else {

                connection.query(query.text, query.values, function (err, result) {

                    connection.release();

                    if (err) {
                        console.log(err);
                        cb(3);
                    } else {

                        cb(0);

                    }

                });

            }

        });
    } else {
        cb(1);
    }

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

            var query = db.updateServerData(gameServer);
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


        console.log('[GS] Broadcast packet MoveToLocation');

        // TODO: broadcastToPartyMembers


        // broadcast to all in region/instance: MoveToLocation
        _.each(gameServer.World.getInstance(sock).getPlayersInRadius(sock, 3500, true, false), (player) => {

            //if (sock.client.char.Name != player.client.char.Name) {
                helper.sendGamePacket('MoveToLocation', player, sock.client.char, sock.client.char.moveObject);
                console.log('[GS] Send MoveToLocation ' + sock.client.char.Name + ' to ' + player.client.char.Name);
            //}

        });

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

            if (player && player.destroyed) gameServer.World.getInstance(player).removePlayer(player);

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
        newArray1[0] = ((len >> 0) & 0xff);
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
        newArray1[0] = ((len >> 0) & 0xff);
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
        newArray4[0] = ((len >> 0) & 0xff);
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

helper.BasicActions = [
    0, // ​​switch Exit. (/Sit, //Stand)
    1, // switch Run /Walk. (/Walk, /run)
    2, // ​​Attack the selected goal (s). Click while holding the mouse Ctrl, to force attack. (/Attack, /attackforce)
    3, // Request for trade with the selected player. (/Trade)
    4, // Select the nearest target for attack. (/Targetnext)
    5, // ​​pick up items around. (/Pickup)
    6, // ​​Switch on the target selected player. (/Assist)
    7, // Invite selected player in your group. (/Invite)
    8, // Leave group. (/Leave)
    9, // If you are the group leader, delete the selected player (s) of group. (/Dismiss)
    10, // Reset the personal shop for sale items. (/Vendor)
    11, // Display the window "Selection Panel" to find groups or members of your group. (/Partymatching)
    12, // Emotion: greet others. (/Socialhello)
    13, // Emotion: Show that you or someone else won //Win! (/Socialvictory)
    14, // Emotion: Inspire your allies (/socialcharge)
    15, // ​​or your pet follows you, or left in place.
    16, // Attack target.
    17, // ​​Abort the current action.
    18, // Find nearby objects.
    19, // ​​Removes Pet inventory.
    20, // Use special skill.
    21, // ​​or your minions follow you, or remain in place.
    22, // Attack target.
    23, // ​​Abort the current action.
    24, // Emotion: Reply in the affirmative. (/Socialyes)
    25, // Emotion: Reply negatively. (/Socialno)
    26, // Emotion: bow, as a sign of respect. (/Socialbow)
    27, // Use special skill.
    28, // Reset the personal shop to purchase items. (/Buy)
    29, // Emotion: I do not understand what is happening. (/Socialunaware)
    30, // Emotion: I'm waiting ... (/socialwaiting)
    31, // Emotion: From a good laugh. (/Sociallaugh)
    32, // ​​Toggle between attack /movement.
    33, // Emotion: Applause. (/Socialapplause)
    34, // Emotion: Show everyone your best dance. (/Socialdance)
    35, // Emotion: I am sad. (/Socialsad)
    36, // Poison Gas Attack.
    37, // Reset the personal studio to create objects using recipes Dwarves fee. (/Dwarvenmanufacture)
    38, // Switch to ride /dismount when you are near pet that you can ride. (/Mount, /dismount, Mountdismount)
    39, // ​​Friendly exploding corpses.
    40, // ​​Increases score goal (/evaluate)
    41, // Attack the castle gates, walls or staffs shot from a cannon.
    42, // Returns the damage back to the enemy.
    43, // Attack the enemy, creating a swirling vortex.
    44, // Attack the enemy with a powerful explosion.
    45, // Restores MP summoner.
    46, // Attack the enemy, calling destructive storm.
    47, // At the same time damages the enemy and heal his servant.
    48, // Attack the enemy shot from a cannon.
    49, // Attack in a fit of rage.
    50, // ​​Selected group member becomes the leader. (/Changepartyleader)
    51, // Create an object using the usual recipe for reward. (/Generalmanufacture)
    52, // ​​Removes ties with EP and releases it.
    53, // Move to the target.
    54, // Move to the target.
    55, // record switch to stop recording and repeats. (/Start_videorecording, /end_videorecording, //Startend_videorecording)
    56, // ​​Invite a selected target in command channel. (/Channelinvite)
    57, // ​​Displays personal messages and store personal workshop containing the desired word. (/Findprivatestore)
    58, // Call another player to a duel. (/Duel)
    59, // ​​Cancel the duel means a loss. (/Withdraw)
    60, // Call another group to a duel. (/Partyduel)
    61, // Opens personal store packages for sale (/packagesale)
    62, // Charming posture (/charm)
    63, // ​​Starts fun and simple mini-game that can be play at any time. (Command: /minigame)
    64, // Opens a free teleport, which allows to move between locations with teleporters. (Command: /teleportbookmark)
    65, // ​​report suspicious behavior of an object, whose actions suggest the use of a bot program.
    66, // Pose "Confusion" (command: /shyness)
    67, // ​​control ship
    68, // Termination control of the ship
    69, // ​​Departure ship
    70, // Descent from the ship
    71, // Bow
    72, // Give Five
    73, // Dance Together
    74, // On /Off status data
    75, // ​​Tactical Sign: Heart
    76, // ​​Invite a friend
    77, // On /Off. Record
    78, // Use the Mark 1
    79, // Use the Mark 2
    80, // Use the Mark 3
    81, // Use the Mark 4
    82, // avtopritsel Emblem 1
    83, // 2 avtopritsel Emblem
    84, // avtopritsel Emblem 3
    85, // 4 avtopritsel Emblem
    86, // Start /abort automatic search group
    87, // ​​Propose
    88, // ​​Provoke
    90, // ​​Command: /instancezone
    1000, // Attack the castle gates, walls and staffs a powerful blow.
    1001, // Reckless, but powerful attack, use it with great caution.
    1002, // To provoke others to attack you.
    1003, // unexpected attack that deals damage and stuns the opponent.
    1004, // Instant significantly increases P. Def. Def. and Mag. Def. Use this skill can not move.
    1005, // Magic Attack
    1006, // Restores HP pet.
    1007, // In case of a successful application temporarily increases the power attack group and a chance for a critical hit.
    1008, // Temporarily increases P. Def. Atk. and accuracy of your group.
    1009, // There is a chance to lift the curse with the group members.
    1010, // Increases MP regeneration of your group.
    1011, // Decreases the cooldown of your spells command.
    1012, // Removes the curse from your group.
    1013, // Taunt opponent and hit, curse, decreases P. Def. Def. and Mag. Def.
    1014, // Provokes to attack many enemies and hit with curse, lowering their P.. Def. and Mag. Def.
    1015, // Sacrifices HP to regenerate HP selected target.
    1016, // Strikes opponent powerful critical attack.
    1017, // Stunning explosion, causing damage and stunning the enemy.
    1018, // Overlay deadly curse, sucking the enemy's HP.
    1019, // skill number 2, used Cat
    1020, // skill number 2 used Meow
    1021, // skill number 2 used Kai
    1022, // skill number 2 used Jupiter
    1023, // skill number 2 used Mirage
    1024, // Skill number 2 used Bekarev
    1025, // skill number 2 used Shadow
    1026, // Skill number one used by Shadow
    1027, // skill number 2 used Hecate
    1028, // Skill number 1 used Resurrection
    1029, // Skill number 2 used Resurrection
    1030, // skill number 2 used vicious
    1031, // The King of Cats: A powerful cutting attack. Maximum damage.
    1032, // The King of Cats: Cuts nearby enemies during rotation air. Maximum damage.
    1033, // The King of Cats: Freezes enemies standing close
    1034, // Magnus: Slam hind legs, striking and stunning enemy. Maximum damage.
    1035, // Magnus: Strikes multiple objectives giant masses water.
    1036, // Wraithlord: corpse bursts, affecting adjacent enemies.
    1037, // Wraithlord: The blades in each hand applied devastating damage. Maximum damage.
    1038, // Curse of the adjacent enemies, and reducing toxic them soon. Atk.
    1039, // Siege Gun: Fires a projectile a short distance. Consumes 4 units. Gunpowder sparkling.
    1040, // Siege Gun: Fires a shell for a long distance. Consumes 5 units. Sparkling powder.
    1041, // Horrible bite the enemy
    1042, // Scratch enemy with both paws. Causes bleeding.
    1043, // Suppress the enemy with a powerful roar
    1044, // Wakes secret power
    1045, // Decreases the P.. Atk. /Mag. Atk. at nearby enemies.
    1046, // Decreases Speed. Atk. /Sprint. Mag. at nearby enemies.
    1047, // Horrible bite the enemy
    1048, // Brings double damage and stuns the enemy simultaneously.
    1049, // breathe fire in your direction.
    1050, // Suppresses surrounding enemies powerful roar.
    1051, // Increases max. amount of HP.
    1052, // Increases max. number of MP.
    1053, // Temporarily increases Atk. Atk.
    1054, // Temporarily increases speed reading spells.
    1055, // Decreases the MP cost of the selected target. Consumes runestones.
    1056, // Temporarily increases M. Def. Atk.
    1057, // Rank Temporarily increases critical strike and force magic attacks
    1058, // Temporarily increases critical strike.
    1059, // Increases the critical strike chance
    1060, // Temporarily increases Accuracy
    1061, // A strong attack from ambush. You can only use use the skill "Awakening".
    1062, // Quick double attack
    1063, // Strong twisting attack does not only damage, but also stun the enemy.
    1064, // Falling from the sky stones cause damage to enemies.
    1065, // Exits the latent state
    1066, // Friendly thunderous forces
    1067, // Quick magical enemies in sight
    1068, // Attacks multiple enemies by lightning
    1069, // slosh ambush. You can only use in the application of skill "Awakening".
    1070, // Can not impose positive effects on the wearer. Step 5 minutes.
    1071, // A strong attack on the facility
    1072, // Powerful penetrating attack on the facility
    1073, // ​​Attack enemies disperse their ranks as a tornado hit
    1074, // Attack the enemy standing in front of a powerful throw spears
    1075, // Victory cry, enhancing their own skills
    1076, // A strong attack on the facility
    1077, // Attack the enemy standing in front of the internal energy
    1078, // Attack front facing enemies using electricity
    1079, // Shouting, enhancing their own skills
    1080, // fast approaching the enemy and inflicts
    1081, // Removes negative effects from the facility
    1082, // recline flame
    1083, // A powerful bite, inflicting damage to the enemy
    1084, // Switches between the attacking /defensive mode
    1086, // Limit the number of positive effects to one
    1087, // Increases dark side to 25
    1088, // Trims important skills
    1089, // Attack the enemy standing in front with the help of the tail.
    1090, // Horrible bite the enemy
    1091, // the enemy plunged into horror and makes escape from the battlefield.
    1092, // Increases movement speed.
    1093,
    1094,
    1095,
    1096,
    1097,
    1098,
    1099,
    1100,
    1101,
    1102,
    1103,
    1104,
    1105,
    1106,
    1107,
    1108,
    1109,
    1110,
    1111,
    1112,
    1113,
    1114,
    1115,
    1116,
    1117,
    1118,
    1119,
    1120,
    1121,
    1122,
    1123,
    1124,
    1125,
    1126,
    1127,
    1128,
    1129,
    1130,
    1131,
    1132,
    1133,
    1134,
    1135,
    1136,
    1137,
    1138,
    1139,
    1140,
    1141,
    5000, // ​​can pat Rudolf. Fills scale fidelity on 25%. Can not use in time reincarnation!
    5001, // Increases Max. HP, Max. MP and Speed ​​by 20% resistance to de-buff by 10%. Time reuse: 10 min. When using the skill spent 3 essences Rose. Can not be used with the Beyond temptation. Duration: 5 min.
    5002, // Increases Max. HP /MP /CP, P.. Def. and Mag. Def. 30% Speed ​​by 20%, P. Def. Atk. 10%, Mag. Atk. 20%, and decreases MP consumption by 15%. Reuse time: 40 min. When using the skill consumes 10 Essences Rose. Duration: 20 min.
    5003, // Strikes enemies power of thunder.
    5004, // Strikes enemies standing near lightning magic attack.
    5005, // Strikes nearby enemies power of thunder.
    5006, // Do not allow to impose on host any effects. Time for 5 minutes.
    5007, // Pet pierces the enemy in deadly attacks.
    5008, // Attacks nearby enemies.
    5009, // thrust the sword into the ranks vperedistoyaschego enemies.
    5010, // Enhances your skills.
    5011, // Attacks the enemy with a powerful blow.
    5012, // Explodes accumulated in the body for energy ranks Vperedistoyaschego enemies.
    5013, // Fires a shockwave on vperedistoyaschego enemy.
    5014, // Greatly enhances their skills.
    5015 // Change the attacker /auxiliary state pet.
];

helper.TransformationActions =
    [
        1, // switch Run Walk. (/Walk, /run)
        2, // ​​Attack the selected goal (s). Click while holding the mouse Ctrl, to force attack. (/Attack, /attackforce)
        3, // Request for trade with the selected player. (/Trade)
        4, // Select the nearest target for attack. (/Targetnext)
        5, // ​​pick up items around. (/Pickup)
        6, // ​​Switch on the target selected player. (/Assist)
        7, // Invite selected player in your group. (/Invite)
        8, // Leave group. (/Leave)
        9, // If you are the group leader, delete the selected player (s) of group. (/Dismiss)
        11, // Display the window "Selection Panel" to find groups or members for your group. (/Partymatching)
        15, // ​​or your pet follows you, or left in place.
        16, // Attack target.
        17, // ​​Abort the current action.
        18, // Find nearby objects.
        19, // ​​Removes Pet inventory.
        21, // ​​or your minions follow you, or remain in place.
        22, // Attack target.
        23, // ​​Abort the current action.
        40, // ​​Increases score goal (/evaluate)
        50, // ​​Selected group member becomes the leader. (/Changepartyleader)
        52, // ​​Removes ties with EP and releases it.
        53, // Move to the target.
        54, // Move to the target.
        55, // record switch to stop recording and repeats. (/Start_videorecording, /end_videorecording, /Startend_videorecording)
        56, // ​​Invite a selected target in command channel. (/Channelinvite)
        57, // ​​Displays personal messages and store personal workshop containing the desired word. (/Findprivatestore)
        63, // ​​Starts fun and simple mini-game that can be play at any time. (Command: /minigame)
        64, // Opens a free teleport, which allows to move between locations with teleporters. (Command: /freeteleport)
        65, // ​​report suspicious behavior of an object, whose actions suggest the use of BOT-program.
        67, // ​​control ship
        68, // Termination control of the ship
        69, // ​​Departure ship
        70, // Descent from the ship
        74, // On /Off status data
        76, // ​​Invite a friend
        77, // On /Off. Record
        78, // Use the Mark 1
        79, // Use the Mark 2
        80, // Use the Mark 3
        81, // Use the Mark 4
        82, // avtopritsel Emblem 1
        83, // 2 avtopritsel Emblem
        84, // avtopritsel Emblem 3
        85, // 4 avtopritsel Emblem
        86, // Start /abort automatic search group
        87, // ​​Propose
        88, // ​​Provoke
        1000, // Attack the castle gates, walls and staffs a powerful blow.
        1001, // Reckless, but powerful attack, use it with great caution.
        1002, // To provoke others to attack you.
        1003, // unexpected attack that deals damage and stuns the opponent.
        1004, // Instant significantly increases P. Def. Def. and Mag. Def. Use this skill can not move.
        1005, // Magic Attack
        1006, // Restores HP pet.
        1007, // In case of a successful application temporarily increases the power attack group and a chance for a critical hit.
        1008, // Temporarily increases P. Def. Atk. and accuracy of your group.
        1009, // There is a chance to lift the curse with the group members.
        1010, // Increases MP regeneration of your group.
        1011, // Decreases the cooldown of your spells command.
        1012, // Removes the curse from your group.
        1013, // Taunt opponent and hit, curse, Decreases P. Def. Def. and Mag. Def.
        1014, // Provokes to attack many enemies and hit with curse, lowering their P.. Def. and Mag. Def.
        1015, // Sacrifices HP to regenerate HP selected target.
        1016, // Strikes opponent powerful critical attack.
        1017, // Stunning explosion, causing damage and stunning the enemy.
        1018, // Overlay deadly curse, sucking the enemy's HP.
        1019, // skill number 2, used Cat
        1020, // skill number 2 used Meow
        1021, // skill number 2 used Kai
        1022, // skill number 2 used Jupiter
        1023, // skill number 2 used Mirage
        1024, // Skill number 2 used Bekarev
        1025, // skill number 2 used Shadow
        1026, // Skill number one used by Shadow
        1027, // skill number 2 used Hecate
        1028, // Skill number 1 used Resurrection
        1029, // Skill number 2 used Resurrection
        1030, // skill number 2 used vicious
        1031, // The King of Cats: A powerful cutting attack. Maximum damage.
        1032, // The King of Cats: Cuts nearby enemies during rotation Air. Maximum damage.
        1033, // The King of Cats: Freezes enemies standing close
        1034, // Magnus: Slam hind legs, striking and stunning enemy. Maximum damage.
        1035, // Magnus: Strikes multiple objectives giant masses water.
        1036, // Wraithlord: corpse bursts, affecting adjacent enemies.
        1037, // Wraithlord: The blades in each hand applied devastating damage. Maximum damage.
        1038, // Curse of the adjacent enemies, and reducing toxic them soon. Atk.
        1039, // Siege Gun: Fires a projectile a short distance. Consumes 4 units. Gunpowder sparkling.
        1040, // Siege Gun: Fires a shell for a long distance. Consumes 5 units. Sparkling powder.
        1041, // Horrible bite the enemy
        1042, // Scratch enemy with both paws. Causes bleeding.
        1043, // Suppress the enemy with a powerful roar
        1044, // Wakes secret power
        1045, // Decreases the P.. Atk. /Mag. Atk. at nearby enemies.
        1046, // Decreases Speed. Atk. /Sprint. Mag. at nearby enemies.
        1047, // Horrible bite the enemy
        1048, // Brings double damage and stuns the enemy simultaneously.
        1049, // breathe fire in your direction.
        1050, // Suppresses surrounding enemies powerful roar.
        1051, // Increases max. amount of HP.
        1052, // Increases max. number of MP.
        1053, // Temporarily increases Atk. Atk.
        1054, // Temporarily increases speed reading spells.
        1055, // Decreases the MP cost of the selected target. Consumes runestones.
        1056, // Temporarily increases M. Def. Atk.
        1057, // Rank Temporarily increases critical strike and force magic attacks
        1058, // Temporarily increases critical strike.
        1059, // Increases the critical strike chance
        1060, // Temporarily increases Accuracy
        1061, // A strong attack from ambush. You can only use the skill "Awakening".
        1062, // Quick double attack
        1063, // Strong twisting attack does not only damage, but also stun the enemy.
        1064, // Falling from the sky stones cause damage to enemies.
        1065, // Exits the latent state
        1066, // Friendly thunderous forces
        1067, // Quick magical enemies in sight
        1068, // Attacks multiple enemies by lightning
        1069, // slosh ambush. You can only use in the application of skill "Awakening".
        1070, // Can not impose positive effects on the wearer. Step 5 minutes.
        1071, // A strong attack on the facility
        1072, // Powerful penetrating attack on the facility
        1073, // ​​Attack enemies disperse their ranks as a tornado hit
        1074, // Attack the enemy standing in front of a powerful throw spears
        1075, // Victory cry, enhancing their own skills
        1076, // A strong attack on the facility
        1077, // Attack the enemy standing in front of the internal energy
        1078, // Attack front facing enemies using electricity
        1079, // Shouting, enhancing their own skills
        1080, // fast approaching the enemy and inflicts
        1081, // Removes negative effects from the facility
        1082, // recline flame
        1083, // A powerful bite, inflicting damage to the enemy
        1084, // Switches between the attacking /defensive mode
        1086, // Limit the number of positive effects to one
        1087, // Increases dark side to 25
        1088, // Trims important skills
        1089, // Attack the enemy standing in front with the help of the tail.
        1090, // Horrible bite the enemy
        1091, // the enemy plunged into horror and makes escape from the battlefield.
        1092, // Increases movement speed.
        5000, // You can pat Rudolph. Fills the scale fidelity of 25%. Can not be used during reincarnation!
        5001, // Increases Max. HP, Max. MP and Speed ​​by 20% Resistance to de-buff by 10%. Time reuse: 10 min. When using the skill spent 3 essences Rose. Can not be used with the Beyond temptation. Duration: 5 min.
        5002, // Increases Max. HP /MP /CP, P.. Def. and Mag. Def. 30% Speed ​​by 20%, P. Def. Atk. 10%, Mag. Atk. 20%, and decreases MP consumption by 15%. Reuse time: 40 min. When using the skill consumes 10 Essences Rose. Duration: 20 min.
        5003, // Strikes enemies power of thunder.
        5004, // Strikes enemies standing near lightning magic attack.
        5005, // Strikes nearby enemies power of thunder.
        5006, // Do not allow to impose on host any effects. Time for 5 minutes.
        5007, // Pet pierces the enemy in deadly attacks.
        5008, // Attacks nearby enemies.
        5009, // thrust the sword into the ranks vperedistoyaschego enemies.
        5010, // Enhances your skills.
        5011, // Attacks the enemy with a powerful blow.
        5012, // Explodes accumulated in the body for energy ranks Vperedistoyaschego enemies.
        5013, // Fires a shockwave on vperedistoyaschego enemy.
        5014, // Greatly enhances their skills.
        5015 // Change the attacker /auxiliary state pet ..
    ];

module.exports = helper;