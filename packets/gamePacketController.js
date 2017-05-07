var _ = require('underscore');

var helper = require('./helper.js');
var clientGamePackets = require('./game/client.js');
var serverGamePackets = require('./game/server.js');
var crypto = require('./crypto.js');
var db = require('../db/db.js');

var gamePacketController = {};

gamePacketController.onRecivePacket = function (data, sock, gameServer) {

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

            //if (sock.client.char.UpdatePosition) {
            //    sock.client.char.UpdatePosition = false;
            //    sock.client.char.Heading = heading;
            //    helper.sendGamePacket('StopMove', sock, sock.client.char);
            //}

            // or trying to move a huge distance
            if (((dx * dx) + (dy * dy)) > 98010000 || distance > 9900) // 9900*9900 
            {
                helper.sendGamePacket('ActionFailed', sock);
            } else {

                // TODO: GEDATA - https://github.com/oonym/l2InterludeServer/blob/4a89de6427a4148308aaedc24f87c5db93b35f40/L2J_Server/java/net/sf/l2j/gameserver/model/L2Character.java

                // TODO: calculate speed
                var speed = sock.client.char.RunSpd * 0.9868421052631579;
                var ticksToMove = 1 + Math.ceil((100 * distance) / speed);
                var ticksToMoveCompleted = 0;
                var spdX = dx / ticksToMove;
                var spdY = dy / ticksToMove;

                var heading = ((Math.atan2(-spx, -spy) * 10430.378350470452724949566316381) + 32768); // ? short.MaxValue 


                console.log('[GS] Move ticksToMove: ' + ticksToMove);
                console.log('[GS] Distance: ' + distance);
                console.log('[GS] Speed: ' + speed);

                sock.client.char.Heading = heading;

                helper.movePlayer(gameServer, sock, {
                    speed: speed,
                    fromX: sock.client.char.X,
                    fromY: sock.client.char.Y,
                    fromZ: sock.client.char.Z,
                    distance: distance,
                    X: pack.toX,
                    Y: pack.toY,
                    Z: pack.toZ,
                    ticksToMove: ticksToMove,
                    ticksToMoveCompleted: ticksToMoveCompleted,
                    h: heading,
                    spdX: spdX,
                    spdY: spdY
                });

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

            gameServer.World.getInstance(sock).addPlayer(sock);

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
            helper.poolGameServer.getConnection(function (err_con, connection) {

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

        case 0x09:

            console.log('[GS] Recive packet Logout');

            helper.sendGamePacket('LeaveWorld', sock);

            console.log('[GS] Send packet LeaveWorld');

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

        case 0x38:

            console.log('[GS] Recive packet Say2');

            var pack = clientGamePackets.Say2(new Buffer(packetsArrayParse));

            // TODO: check player can use chat
            // TODO: flood protection
            // TODO: check BOTs etc.  https://xp-dev.com/sc/186542/3/%2Ftrunk%2FL2J_Server_BETA%2Fjava%2Fcom%2Fl2jserver%2Fgameserver%2Fnetwork%2Fclientpackets%2FSay2.java

            console.log('[GS] CHAT - [' + pack.type + ']' + sock.client.char.Name + ': ' + pack.text);

            switch (pack.type) {
                case 0: // CHAT_NORMAL - in distance

                    _.each(gameServer.World.getInstance(sock).getPlayersInRadius(sock, 1250, true, false), (player) => { // TODO: get players in radius

                        helper.sendGamePacket('CreatureSay', player, sock, pack.type, pack.text);

                    });

                    break;
                case 1: // CHAT_SHOUT: ! - in region

                    var region = helper.getMapRegion(gameServer, sock.client.char.X, sock.client.char.Y);

                    //console.log('CHAT - current region ' + region);

                    _.each(gameServer.World.getInstance(sock).getPlayers(), (player) => {

                        var playerRegion = helper.getMapRegion(gameServer, player.client.char.X, player.client.char.Y);

                        //console.log('CHAT - player region ' + playerRegion);

                        if (playerRegion == region) {
                            helper.sendGamePacket('CreatureSay', player, sock, pack.type, pack.text);
                        }

                    });

                    break;
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
            helper.sendGamePacket('RestartResponse', sock, 1, "OK");
            console.log('[GS] Send packet: RestartResponse');

            gamePacketController.sendCharList(sock);



            break;

        case 0x48:

            console.log('[GS] Recive packet ValidatePosition');

            var pack = clientGamePackets.ValidatePosition(new Buffer(packetsArrayParse));

            var realX = sock.client.char.X;
            var realY = sock.client.char.Y;
            var realZ = sock.client.char.Z;

            var dx = pack.X - realX;
            var dy = pack.Y - realY;
            var diffSq = ((dx * dx) + (dy * dy));

            //console.log("[GS] client pos: " + pack.X + " " + pack.Y + " " + pack.Z + " head " + pack.Heading);
            //console.log("[GS] server pos: " + realX + " " + realY + " " + realZ + " head " + sock.client.char.Heading); // TODO: may be not real heading xD

            if (!sock.client.char.moveObject) {
                sock.client.char.moveObject = {};
            }

            try {
                var dxServer = sock.client.char.moveObject.fromX - realX;
                var dyServer = sock.client.char.moveObject.fromY - realY;

                var distanceServer = helper.getPlanDistanceSq(dxServer, dyServer);

                var dxClient = sock.client.char.moveObject.fromX - pack.X;
                var dyClient = sock.client.char.moveObject.fromY - pack.Y;

                var distanceClient = helper.getPlanDistanceSq(dxClient, dyClient);

                console.log('DISTANCE server: ' + distanceServer);
                console.log('DISTANCE client: ' + distanceClient);

                var time = distanceServer / sock.client.char.moveObject.speed;

                var speedServer = sock.client.char.moveObject.speed
                var speedClient = distanceClient / time;

                console.log('SPEED server: ' + speedServer);
                console.log('SPEED client: ' + speedClient);

            } catch (ex) {
                helper.exceptionHandler(ex);
            }

            if ((diffSq > 0) && (diffSq < 1000)) // if too large, messes observation
            {

                sock.client.char.Heading = pack.Heading;

                console.log('[GS] OK, diffSq is: ' + diffSq);
            } else {
                console.log('[GS] FAIL, diffSq so: ' + diffSq);

                helper.sendGamePacket('ValidateLocation', sock, sock.client.char);
                console.log('[GS] Send packet: ValidateLocation');
            }

            // TODO: broadcast to party members

            // TODO: checkWaterState


            //helper.sendGamePacket('UserInfo', sock, sock.client.char);
            //console.log('[GS] Send packet: UserInfo');

            break;

        default:

            helper.unknownGamePacket(sock, packetId, packetsArrayParse);

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
            NameColor: 0,
            TitleColor: 0,
            IsFishing: 0,
            FishX: 0,
            FishY: 0,
            FishZ: 0,
            IsRunning: 1,
            RunSpd: 250,
            WalkSpd: 250,
            SwimRunSpd: 150,
            SwimWalkSpd: 150,
            FlRunSpd: 150,
            FlWalkSpd: 150,
            FlyRunSpd: 150,
            FlyWalkSpd: 150,
            MoveMultiplier: 1,
            AttackSpeedMultiplier: 1,
            Instance: 0
        }
    ];

    sock.client.status = 2;
    helper.sendGamePacket('CharSelectInfo', sock, sock.client.data.login, sock.client.data.session2_1, sock.client.chars);

    console.log('[GS] Send packet: CharSelectInfo');
};

module.exports = gamePacketController;