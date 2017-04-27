var protocol = require('../protocol.js');
var _ = require('underscore');

var serverGamePackets = {};

//-----------------------------------------------//
// Game Server packets                          //
//-----------------------------------------------//

serverGamePackets.CharSelectInfo = function (login, session2_1, chars) {
    var p = new protocol.BasePacket();

    p.writeC(0x13);
    p.writeD(chars.length);

    _.each(chars, (char) => {

        p.writeS(char.Name);
        p.writeD(char.CharId);

        p.writeS(login);
        p.writeD(session2_1);

        p.writeD(char.ClanId);
        p.writeD(0x00); // Builder level - ?

        p.writeD(char.Sex);
        p.writeD(char.Race);
        p.writeD(char.BaseClassId); // it's BaseClassId

        p.writeD(0x01); // active - ??

        p.writeD(char.X);
        p.writeD(char.Y);
        p.writeD(char.Z);

        p.writeF(char.HP);
        p.writeF(char.MP);

        p.writeD(char.SP);
        p.writeQ(char.EXP);
        p.writeD(char.Level); // TODO: check for current SP >= nextLevelSP = increaseLevel()

        p.writeD(char.Karma);
        p.writeD(char.PK);

        p.writeD(char.PVP);

        for (var i = 0; i < 7; i++) { // trash
            p.writeD(0x00);
        }

        for (var i = 0; i < 17; i++) { // paperdollOrder
            p.writeD(0);
        }

        for (var i = 0; i < 17; i++) { //paperdollOrder 2
            p.writeD(0);
        }

        p.writeD(char.HairStyle);
        p.writeD(char.HairColor);
        p.writeD(char.Face);

        p.writeF(char.MaxHP);
        p.writeF(char.MaxMP);

        p.writeD(char.DeleteDays);

        p.writeD(char.ClassId); // it's current ClassId

        p.writeD(char.Active);

        p.writeC(Math.min(char.EnchantEffect, 127));

        p.writeD(char.AugmentationId);

        p.writeH(0);
        p.writeH(0);

    });

    return p;
}

serverGamePackets.CryptInit = function (newXorKey) {
    var p = new protocol.BasePacket();

    p.writeC(0x00);
    p.writeC(0x01);
    p.writeB(new Buffer(newXorKey));
    p.writeD(0x01);
    p.writeD(0x01);

    return p;
}

module.exports = serverGamePackets;