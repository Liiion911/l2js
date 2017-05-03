var _ = require('underscore');

var helper = require('./helper.js');
var clientGamePackets = require('./game/client.js');
var serverGamePackets = require('./game/server.js');
var crypto = require('./crypto.js');
var db = require('../db/db.js');

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
                sock.destroy();
            }

            console.log('[GS] Recive packet AuthLogin');

            var pack = clientGamePackets.AuthLogin(new Buffer(packetsArrayParse));

            var query = db.getAuthDataByLogin(pack.login);
            helper.poolLoginServer.getConnection(function (err_con, connection) {

                if (err_con) {
                    console.log(err_con);
                } else {

                    connection.query(query.text, query.values, function (err, result) {

                        connection.release();

                        if (err) {
                            console.log(err);
                        } else {

                            sock.client.data = result[0];
                            if (result.length != 1 || !sock.client.data || sock.client.data.session2_1 != pack.session2_1 || sock.client.data.session2_2 != pack.session2_2 || sock.client.data.session1_1 != pack.session1_1 || sock.client.data.session1_2 != pack.session1_2) {

                                console.log('[GS] No allServerData login or wrong session keys'); 
                                sock.destroy();

                            } else {

                                gamePacketController.sendCharList(sock);

                            }

                        }

                    });
                }
            });

            break;

        case 0x0d:

            if (sock.client.status != 2) {
                console.log('[GS] Wrong status 2');
                sock.destroy();
            }

            var pack = clientGamePackets.CharacterSelected(new Buffer(packetsArrayParse));

            if (sock.client.chars.length > pack.charIndex) {

                sock.client.status = 3;
                sock.client.char = sock.client.chars[pack.charIndex];
                helper.sendGamePacket('CharSelected', sock, sock.client.data.session2_1, sock.client.char);
                console.log('[GS] Send packet: CharSelected');

            } else {
                sock.destroy();
            }


            break;

        case 0x00:

            if (sock.client.status != 0) {
                console.log('[GS] Wrong status 0');
                sock.destroy();
            }

            var pack = clientGamePackets.ProtocolVersion(new Buffer(packetsArrayParse));

            if (pack.protocolVersion === -2) {

                console.log('[GS] Recive Ping');
                sock.destroy();

            } else if (pack.protocolVersion >= 730 && pack.protocolVersion <= 746) {

                console.log('[GS] Recive packet ProtocolVersion: ' + pack.protocolVersion);

                sock.client.newXorKeyEnc = crypto.generateNewKey();
                sock.client.newXorKeyDec = _.clone(sock.client.newXorKeyEnc);
                var packet = serverGamePackets.CryptInit(sock.client.newXorKeyEnc);

                var packetArray = helper.cryptPreSendGame(packet.getContent(), sock);

                sock.client.status = 1;
                sock.write(new Buffer(packetArray));
                console.log('[GS] Send packet: CryptInit/FirstKey');

            } else {

                console.log('[GS] Protocol Version: ' + pack.protocolVersion); // 746
                sock.destroy();

            }

            break;

        case 0x03:

            console.log('[GS] Recive packet EnterWorld');

            if (sock.client.status != 3) {
                console.log('[GS] Wrong status 3');
                sock.destroy();
            }

            sock.client.status = 4;

            if (1 == 2) {// TODO: isGM

            }

            // TODO: add spawn protection
            // setProtection();


            // TODO: seven signs status
            // if (SevenSigns.isSealValidationPeriod())
            // packet SignsSky


            // TODO: buff and status icons

            helper.poolGameServer.getConnection(function (err_con, connection) {

                var query = db.skills.restorCharacterSkill(sock.client.char.CharId, sock.client.ClassId);

                if (err_con) {
                    console.log(err_con);
                } else {

                    connection.query(query.text, query.values, function (err, result) {

                        if (err) {

                            console.log(err);
                            connection.release();

                        } else {
                            // TODO: send char skills and buffs
                            // restoreEffects
                        }

                    });

                }

            });

            // TODO: EtcStatusUpdate
            helper.sendGamePacket('EtcStatusUpdate', sock, sock.client.char);
            console.log('[GS] Send packet: EtcStatusUpdate');

            // TODO: wedding engage and notify Partner
            // engage


            // TODO: disable effects 
            // L2Effect.EffectType.HEAL_OVER_TIME
            // L2Effect.EffectType.COMBAT_POINT_HEAL_OVER_TIME


            // TODO: apply augmentation boni for equipped items
            // getAugmentedItems


            /* Expand Skills */
            // Send storages
            helper.sendGamePacket('ExStorageMaxCount', sock, sock.client.char);
            console.log('[GS] Send packet: ExStorageMaxCount');

            // TODO: Send macroses
            // getMacroses().sendUpdate()


            // Send UserInfo
            helper.sendGamePacket('UserInfo', sock, sock.client.char);
            console.log('[GS] Send packet: UserInfo');

            break;

        case 0x48:

            console.log('[GS] Recive packet ValidatePosition');

            helper.sendGamePacket('UserInfo', sock, sock.client.char);
            console.log('[GS] Send packet: UserInfo');

            break;

        case 0x01:

            console.log('[GS] Recive packet MoveBackwardToLocation');


            var pack = clientGamePackets.MoveBackwardToLocation(new Buffer(packetsArrayParse));

            // TODO: check boat, teleport, attacking + BOW, GEODATA + cursor, siting (SystemMessage.SystemMessageId.CantMoveSitting)
            // isInBoat, getTeleMode, isAttackingNow + getActiveWeaponItem().getItemType() == L2WeaponType.BOW, _moveMovement + GEODATA, IsSittingInProgress/IsSitting

            // TODO: char.Obsx = -1

            var curX = sock.client.char.X;
            var curY = sock.client.char.Y;
            var curZ = sock.client.char.Z;

            var dx = pack.toX - curX;
            var dy = pack.toY - curY;

            // TODO:  Can't move if character is confused
            // activeChar.isOutOfControl() || 



            var distance = helper.getPlanDistanceSq(dx, dy);

            var spy = dy / distance
            var spx = dx / distance;

            var heading = ((Math.atan2(-spx, -spy) * 10430.378) + 32767); // ? short.MaxValue 


            if (sock.client.char.UpdatePosition) {
                sock.client.char.UpdatePosition = false;
                sock.client.char.Heading = heading;
                helper.sendGamePacket('StopMove', sock, sock.client.char);
            }

            // or trying to move a huge distance
            if (((dx * dx) + (dy * dy)) > 98010000 || distance > 9900) // 9900*9900 
            {
                helper.sendGamePacket('ActionFailed', sock);
            } else {

                sock.client.char.UpdatePosition = true;

                helper.sendGamePacket('MoveToLocation', sock, sock.client.char, { X: pack.toX, Y: pack.toY, Z: pack.toZ });
                console.log('[GS] Send packet: MoveToLocation');


                //helper.setIntention(sock, "AI_INTENTION_MOVE_TO", { x: pack.toX, y: pack.toY, z: pack.toZ, h: heading });


                // TODO: broadcastToPartyMembers

            }

            break;

        case 0x46:

            console.log('[GS] Recive packet RequestRestart');

            // TODO: check is in ol;ympyad
            // isInOlympiadMode()


            // TODO:  save Inventory
            //


            // TODO: chack for trading started or trading requested
            // getPrivateStoreType() getActiveRequester() 


            // TODO: check for fighting 
            // getAttackStanceTask


            // TODO: if flying 
            // isFlying - removeSkill 4289


            // TODO: onLogout, deleteMe, saveChar
            //

            sock.client.status = 1;
            gamePacketController.sendCharList(sock);

        case 0x09:

            console.log('[GS] Recive packet Logout');

            helper.sendGamePacket('LeaveWorld', sock);

            console.log('[GS] Send packet LeaveWorld');

            break;

        default:

            helper.uncnownGamePacket(sock, packetId, packetsArrayParse);

            break;
    }

}

gamePacketController.sendCharList = function (sock) {

    sock.client.chars = [
        {
            Name: 'testNickName',
            Title: 'TEST',
            CharId: 1,
            ClanId: 0,
            ClanCrestId: 0,
            AllyId: 0,
            AllyCrestId: 0,
            Sex: 0,
            Race: 0,
            BaseClassId: 0,
            X: -114356,
            Y: -249645,
            Z: -2984,
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
            AugmentationId: 0,
            INT: 0,
            STR: 0,
            CON: 0,
            MEN: 0,
            DEX: 0,
            WIT: 0,
            PAtk: 10,
            PAtkSpd: 9,
            PDef: 8,
            EvasionRate: 1,
            Accuracy: 11,
            CriticalHit: 12,
            MAtk: 12,
            MAtkSpd: 13,
            MDef: 14,
            PvpFlag: 1,
            WeightPenalty: 0,
            IsChatBanned: 0,
            ExpertisePenalty: 0,
            CharmOfCourage: 1,
            DeathPenaltyBuffLevel: 0,
            Inventory: 100,
            Warehouse: 200,
            Freight: 300,
            PrivateSell: 20,
            PrivateBuy: 30,
            ReceipeDwarf: 50,
            Recipe: 40,
            Heading: 0, // ??
            ObjectId: 1,
            Load: 9,
            MaxLoad: 10,
            MountType: 0,
            PrivateStoreType: 0,
            HasDwarvenCraft: 0,
            Cubics: [],
            AbnormalEffect: 0, // ?
            ClanPrivileges: 0,
            RecomLeft: 5,
            RecomHave: 10,
            InventoryLimit: 90,
            CP: 15,
            MaxCP: 100,
            Team: 0,
            ClanCrestLargeId: 0,
            IsNoble: 1,
            IsHero: 1,
            PledgeClass: 0,
            IsRunning: 1,
            NameColor: 0,
            TitleColor: 0,
            IsFishing: 0,
            FishX: 0,
            FishY: 0,
            Fishz: 0,
            RunSpd: 150,
            WalkSpd: 100,
            SwimRunSpd: 105,
            SwimWalkSpd: 100,
            FlRunSpd: 105,
            FlWalkSpd: 100,
            FlyRunSpd: 150,
            FlyWalkSpd: 100,
            MoveMultiplier: 1,
            AttackSpeedMultiplier: 1
        }
    ];

    sock.client.status = 2;
    helper.sendGamePacket('CharSelectInfo', sock, sock.client.data.login, sock.client.data.session2_1, sock.client.chars);

    console.log('[GS] Send packet: CharSelectInfo');
};

module.exports = gamePacketController;