var crypto = require('./crypto.js');
var serverLoginPackets = require('./login/server.js');
var serverGamePackets = require('./game/server.js');

var helper = {
    defaultKey: [0x6b, 0x60, 0xcb, 0x5b, 0x82, 0xce, 0x90, 0xb1, 0xcc, 0x2b, 0x6c, 0x55, 0x6c, 0x6c, 0x6c, 0x6c],
    autoCreate: true
};

helper.syncPlayersCount = function (gameServer) {
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
};


helper.getPlanDistanceSq = function(x, y)
{
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
};

helper.setIntention = function (sock, intention, args) {

    // TODO: Stop the follow mode if necessary
    //if ((intention != "AI_INTENTION_FOLLOW") && (intention != "AI_INTENTION_ATTACK"))
    // sock.client.char.intention

    switch (intention) {
        case "AI_INTENTION_MOVE_TO":

            if (sock.client.char.intention == "AI_INTENTION_REST") {
                helper.sendGamePacket('ActionFailed', sock);
            }

            // TODO: isAllSkillsDisabled -> ActionFailed

            // changeIntention(AI_INTENTION_MOVE_TO, pos, null);

            // clientStopAutoAttack();



            break;
    }

};

helper.uncnownLoginPacket = function (sock, packetId, packetsArrayParse) {
    console.log('[LS] UNKNOWN PACKET - ' + packetId);
    sock.destroy();
};

helper.uncnownGamePacket = function (sock, packetId, packetsArrayParse) {
    console.log('[GS] UNKNOWN PACKET - ' + packetId);
};

helper.sendLoginPacket = function (packetName, sock) {
    try {
        var packet = serverLoginPackets[packetName](arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8], arguments[9], arguments[10]);
        var packetArray = helper.preSendLogin(packet.getContent(), sock);
        sock.write(new Buffer(packetArray));
    }
    catch (ex) {
        console.log(ex);
    }
}

helper.sendGamePacket = function (packetName, sock) {
    try {
        var packet = serverGamePackets[packetName](arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8], arguments[9], arguments[10]);
        var packetArray = helper.preSendGame(packet.getContent(), sock);
        sock.write(new Buffer(packetArray));
    }
    catch (ex) {
        console.log(ex);
    }
}

helper.preSendGame = function (array, sock) {

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
}

helper.cryptPreSendGame = function (array, sock) {

    var newArray1 = new Uint8Array(array.length + 2);
    newArray1.fill(0, 0, array.length + 2);
    for (var i = 0; i < array.length; i++) {
        newArray1[i + 2] = array[i] || 0;
    }

    var len = array.length + 2;
    newArray1[0] = (len & 0xff);
    newArray1[1] = ((len >> 8) & 0xff);

    return newArray1;
}

helper.preSendLogin = function (array, sock) {

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
}

helper.initPreSendLogin = function (array, pubKey, sock) {

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
}

module.exports = helper;