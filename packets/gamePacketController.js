var _ = require('underscore');

var helper = require('./helper.js');
var clientGamePackets = require('./game/client.js');
var serverGamePackets = require('./game/server.js');
var crypto = require('./crypto.js');

var gamePacketController = {};

gamePacketController.onRecivePacket = function (data, sock) {

    var packetLength = data[0] - 2;
    var packetsArray = new Uint8Array(data.length - 2);
    packetsArray.fill(0, 0, data.length - 2);
    for (var i = 2; i < data.length; i++) {
        packetsArray[i - 2] = data[i] || 0;
    }

    var packetId = packetsArray[0];

    var packetsArrayParse;

    packetsArrayParse = packetsArray;

    if (sock.client.status == 0 && packetId == 0x00) {

    } else {

        crypto.decrypt(sock, packetsArray, 0, packetsArray.length);

        packetId = packetsArray[0];

    }

    packetsArrayParse = new Uint8Array(packetsArray.length - 1);
    packetsArrayParse.fill(0, 0, packetsArray.length - 1);
    for (var i = 1; i < packetsArray.length; i++) {
        packetsArrayParse[i - 1] = packetsArray[i] || 0;
    }

    console.log('[GS] Recive packet: ' + packetId);

    switch (packetId) {
        case 0x07:

            console.log('[GS] Recive packet 0x07 - Ping');

            break;

        case 0x08:

            if (sock.client.status != 1) {
                console.log('[GS] Wrong status 1');
                sock.end();
            }

            console.log('[GS] Recive packet AuthLogin');

            var pack = clientGamePackets.AuthLogin(new Buffer(packetsArrayParse));

            sock.client.data = _.findWhere(helper.allServerData, { login: pack.login });
            if (!sock.client.data || sock.client.data.session2_1 != pack.session2_1 || sock.client.data.session2_2 != pack.session2_2 || sock.client.data.session1_1 != pack.session1_1 || sock.client.data.session1_2 != pack.session1_2) {

                console.log('[GS] No allServerData login or wrong session keys');
                sock.end();

            } else {

                var chars = [
                    {
                        Name: 'testNickName',
                        CharId: 1,
                        ClanId: 0,
                        Sex: 0,
                        Race: 0,
                        BaseClassId: 0,
                        X: 0,
                        Y: 0,
                        Z: 0,
                        HP: 50.00,
                        MP: 100.00,
                        SP: 180,
                        EXP: 9.00,
                        Level: 1,
                        Karma: 2,
                        PK: 3,
                        PVP: 4,
                        HairStyle: 0,
                        HairColor: 0,
                        Face: 0,
                        MaxHP: 800.00,
                        MaxMP: 900.00,
                        DeleteDays: 0,
                        ClassId: 0,
                        Active: 1,
                        EnchantEffect: 0,
                        AugmentationId: 0
                    }
                ];

                sock.client.status = 2;
                helper.sendGamePacket('CharSelectInfo', sock, sock.client.data.login, sock.client.data.session2_1, chars);

                console.log('[GS] Send packet: CharSelectInfo');

            }

            break;

        case 0x00:

            if (sock.client.status != 0) {
                console.log('[GS] Wrong status 0');
                sock.end();
            }

            var pack = clientGamePackets.ProtocolVersion(new Buffer(packetsArrayParse));

            if (pack.protocolVersion === -2) {

                console.log('[GS] Recive Ping');
                sock.end();

            } else if (pack.protocolVersion === 746) {

                console.log('[GS] Recive packet ProtocolVersion');

                sock.client.newXorKeyEnc = crypto.generateNewKey();
                sock.client.newXorKeyDec = _.clone(sock.client.newXorKeyEnc);
                var packet = serverGamePackets.CryptInit(sock.client.newXorKeyEnc);

                var packetArray = helper.cryptPreSendGame(packet.getContent(), sock);

                sock.client.status = 1;
                sock.write(new Buffer(packetArray));
                console.log('[GS] Send packet: CryptInit/FirstKey');

            } else {

                console.log('[GS] Protocol Version: ' + pack.protocolVersion); // 746
                sock.end();

            }

            break;


        case 0x09:

            console.log('[GS] Recive packet Logout');

            sock.end();

            break;

        default:

            helper.uncnownGamePacket(sock, packetId, packetsArrayParse);

            break;
    }

}

module.exports = gamePacketController;