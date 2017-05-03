var _ = require('underscore');
var fs = require("fs");
var execFile = require('child_process').execFile;
var util = require('util');
var btoa = require('btoa');
var md5 = require('md5');

var helper = require('./helper.js');
var db = require('../db/db.js');
var clientLoginPackets = require('./login/client.js');

var crypto = require('./crypto.js');

var loginPacketController = {};

loginPacketController.onRecivePacket = function (data, sock) {

    var packetLength = data[0] - 2;
    var packetsArray = new Uint8Array(data.length - 2);
    packetsArray.fill(0, 0, data.length - 2);
    for (var i = 2; i < data.length; i++) {
        packetsArray[i - 2] = data[i] || 0;
    }

    sock.client.blowFish.decrypt(packetsArray, 0, packetsArray.length);

    var packetId = packetsArray[0];

    var packetsArrayParse = new Uint8Array(packetsArray.length - 1);
    packetsArrayParse.fill(0, 0, packetsArray.length - 1);
    for (var i = 1; i < packetsArray.length; i++) {
        packetsArrayParse[i - 1] = packetsArray[i] || 0;
    }

    console.log('[LS] Recive packet: ' + packetId);

    switch (packetId) {
        case 0x07:

            console.log('[LS] Recive packet RequestGGAuth');

            if (sock.client.status != 1) {
                console.log('[LS] Wrong status 1');
                sock.destroy();
            }

            var pack = clientLoginPackets.RequestGGAuth(new Buffer(packetsArrayParse));
            if (sock.client.sessionId != pack.sessionId) {
                console.log('[LS] Wrong sessionId');
                sock.destroy();
            }


            sock.client.status = 2;
            helper.sendLoginPacket('GGAuth', sock, sock);

            console.log('[LS] Send packet GGAuth');

            break;

        case 0x00:

            console.log('[LS] Recive packet RequestAuthLogin');

            if (sock.client.status != 2) {
                console.log('[LS] Wrong status 2');
                sock.destroy();
            }

            var pack = clientLoginPackets.RequestAuthLogin(new Buffer(packetsArrayParse));
            var base64authString = pack.login_pass.toString('base64');
            sock.client.rsaKeyPairs.base64authString = base64authString;

            sock.client.rsaKeyPairs._scrambledModulus = sock.client.rsaKeyPairs._old_scrambledModulus;
            delete sock.client.rsaKeyPairs._old_scrambledModulus

            fs.writeFileSync(__dirname + "/../RSAgenerator/keys/" + sock.client.sessionId + ".json", util.inspect(sock.client.rsaKeyPairs), 'utf-8');

            var decoder = execFile(__dirname + "/../RSAgenerator/RSAGenerator.exe", ["decode", sock.client.sessionId.toString()], function (error, stdout, stderr) {
                if (error) {
                    console.log(error);
                }
                console.log(stdout);

                delete require.cache[require.resolve(__dirname + "/../RSAgenerator/keys/" + sock.client.sessionId + ".json")];
                var rsaKeyPairs
                sock.client.rsaKeyPairs = rsaKeyPairs = require(__dirname + "/../RSAgenerator/keys/" + sock.client.sessionId + ".json");
                sock.client.login = sock.client.rsaKeyPairs.login.toLowerCase();
                sock.client.pass = md5(btoa(sock.client.rsaKeyPairs.pass));

                var query = db.getAccountByLoginPassword(sock.client.login, sock.client.pass);
                helper.poolLoginServer.getConnection(function (err_con, connection) {

                    if (err_con) {
                        console.log(err_con);
                    } else {

                        connection.query(query.text, query.values, function (err, result) {

                            if (err) {
                                console.log(err);
                                connection.release();
                            } else {
                                if (result.length == 1) { //checkLoginPass //sock.client.login == "123" && sock.client.pass == "321"

                                    connection.release();

                                    sock.client.session1_1 = crypto.randomInteger(1000, 9999);
                                    sock.client.session1_2 = crypto.randomInteger(1000, 9999);

                                    sock.client.status = 4;
                                    helper.sendLoginPacket('LoginOk', sock, sock.client.session1_1, sock.client.session1_2);

                                    console.log('[LS] Send packet LoginOk');

                                } else if (helper.autoCreate) {

                                    var query1 = db.createAccount(sock.client.login, sock.client.pass, 0);
                                    connection.query(query1.text, query1.values, function (err1, result1) {

                                        connection.release();

                                        if (err1) {

                                            if (err1.code != "ER_DUP_ENTRY") console.log(err1);

                                            sock.client.status = 3;
                                            helper.sendLoginPacket('LoginFail', sock, 3);

                                        } else {

                                            console.log('[LS] Account auto created: ' + sock.client.login);

                                            sock.client.session1_1 = crypto.randomInteger(1000, 9999);
                                            sock.client.session1_2 = crypto.randomInteger(1000, 9999);

                                            sock.client.status = 4;
                                            helper.sendLoginPacket('LoginOk', sock, sock.client.session1_1, sock.client.session1_2);

                                            console.log('[LS] Send packet LoginOk');

                                        }

                                    });

                                } else {

                                    connection.release();

                                    sock.client.status = 3;
                                    helper.sendLoginPacket('LoginFail', sock, 3);

                                    console.log('[LS] Send packet LoginFail');

                                }

                            }


                        });

                    }

                });

            });

            break;

        case 0x05:

            console.log('[LS] Recive packet RequestServerList');

            if (sock.client.status != 4) {
                console.log('[LS] Wrong status 4');
                sock.destroy();
            }

            var pack = clientLoginPackets.RequestServerList(new Buffer(packetsArrayParse));
            if (pack.session1_1 != sock.client.session1_1 || pack.session1_2 != sock.client.session1_2) {
                console.log('[LS] Wrong session1 on RequestServerList');
                sock.destroy();
            }



            var query = db.getServers();
            helper.poolLoginServer.getConnection(function (err_con, connection) {

                if (err_con) {
                    console.log(err_con);
                } else {

                    connection.query(query.text, query.values, function (err, result) {

                        if (err) {
                            console.log(err);
                            connection.release();
                        } else {

                            console.log(result);

                            //var servers = _.extend(result, {
                            //    AgeLimit: 0,
                            //    IsPvpServer: 0,
                            //    PlayerCount: 99,
                            //    MaxPlayerCount: 100,
                            //    IsOnline: 1,
                            //    ShowClock: 0,
                            //    ServerBrackets: 0,
                            //});

                            //sock.client.status = 5;

                            //helper.sendLoginPacket('ServerList', sock, servers);

                            console.log('[LS] Send packet ServerList');
                        }

                    });

                }

            });


            break;

        case 0x02:

            console.log('[LS] Recive packet RequestServerLogin');

            if (sock.client.status != 5) {
                console.log('[LS] Wrong status 5');
                sock.destroy();
            }

            var pack = clientLoginPackets.RequestServerLogin(new Buffer(packetsArrayParse));
            if (pack.session1_1 != sock.client.session1_1 || pack.session1_2 != sock.client.session1_2) {
                console.log('[LS] Wrong session1 on RequestServerLogin');
                sock.destroy();
            }

            if (1 == 1) { //check server players/maxPlayers etc.

                sock.client.session2_1 = (parseInt((Math.random() * 1000000000).toFixed(0)))
                sock.client.session2_2 = (parseInt((Math.random() * 1000000000).toFixed(0)))

                // attempt user to login onto GameServer

                var query = db.getAuthDataByLogin(sock.client.login);
                helper.poolLoginGameServer.getConnection(function (err_con, connection) {

                    if (err_con) {
                        console.log(err_con);
                    } else {

                        connection.query(query.text, query.values, function (err, result) {
                            if (err) {
                                console.log(err);
                                connection.release();
                            } else {

                                if (result.length == 1) {

                                    var query1 = db.updateAuthData(sock.client.login, sock.client.session1_1, sock.client.session1_2, sock.client.session2_1, sock.client.session2_2);
                                    connection.query(query1.text, query1.values, function (err1, result) {

                                        connection.release();

                                        if (err1) {
                                            console.log(err1);
                                        } else {

                                            sock.client.status = 7;
                                            helper.sendLoginPacket('PlayOk', sock, sock.client.session2_1, sock.client.session2_2);

                                            console.log('[LS] Send packet PlayOk');

                                        }
                                    });

                                } else {

                                    var query1 = db.insertAuthData(sock.client.login, sock.client.session1_1, sock.client.session1_2, sock.client.session2_1, sock.client.session2_2);
                                    connection.query(query1.text, query1.values, function (err1, result) {

                                        connection.release();

                                        if (err1) {
                                            console.log(err1);
                                        } else {

                                            sock.client.status = 7;
                                            helper.sendLoginPacket('PlayOk', sock, sock.client.session2_1, sock.client.session2_2);

                                            console.log('[LS] Send packet PlayOk');

                                        }
                                    });
                                }


                            }

                        });
                    }
                });

            } else {

                sock.client.status = 6;
                helper.sendLoginPacket('PlayFail', sock, 0x0000000f);

                console.log('[LS] Send packet PlayFail');

            }

            break;
        default:

            helper.uncnownLoginPacket(sock, packetId, packetsArrayParse);

            break;

    }

}

module.exports = loginPacketController;