﻿var _ = require('underscore');

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

    if (sock.client.status == 0 && packetId == 0x0e) {

    } else {

        crypto.decrypt(sock, packetsArray, 0, packetsArray.length);

        packetId = packetsArray[0];

    }

    packetsArrayParse = new Uint8Array(packetsArray.length - 1);
    packetsArrayParse.fill(0, 0, packetsArray.length - 1);
    for (var i = 1; i < packetsArray.length; i++) {
        packetsArrayParse[i - 1] = packetsArray[i] || 0;
    }

    console.log('[GS] Recive packet: ' + packetId + ', OPcode: ' + packetId.toString(16));

    switch (packetId) {

        case 0x03:

            console.log('[GS] Recive packet RequestStartPledgeWar');

            var pack = clientGamePackets.RequestStartPledgeWar(new Buffer(packetsArrayParse));



            break;

        case 0x0e:

            if (sock.client.status != 0) {
                console.log('[GS] Wrong status 0');
                sock.destroy();
            }

            var pack = clientGamePackets.ProtocolVersion(new Buffer(packetsArrayParse));

            if (pack.protocolVersion === -2 || pack.protocolVersion === -3 || pack.protocolVersion >= 65533) {

                console.log('[GS] Recive Ping');
                sock.destroy();

            } else if (pack.protocolVersion >= 19 && pack.protocolVersion <= 606) {

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

        case 0x0f:

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

            //var toX1 = pack.toX - 33554432; // fix realX client bug ?!?!?!?! not fixed
            //var toX2 = pack.toX - 100663296; // fix realX client bug ?!?!?!?! not fixed
            //console.log('RealX 1: ' + toX1);
            //console.log('RealX 2: ' + toX2);

            // TODO:  Can't move if character is confused
            // activeChar.isOutOfControl() || 

            console.log('[GS] cur: ' + curX + ' ' + curY + ' ' + curZ);
            console.log('[GS] orig: ' + pack.origX + ' ' + pack.origY + ' ' + pack.origZ);
            console.log('[GS] to: ' + pack.toX + ' ' + pack.toY + ' ' + pack.toZ);

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
                console.log('[GS] Distance: ' + distance + ' - is so big!');
                helper.sendGamePacket('ActionFailed', sock);
                helper.sendGamePacket('MoveToLocation', sock, sock.client.char, { X: sock.client.char.X, Y: sock.client.char.Y, Z: sock.client.char.Z }); // char stay and don't move
            } else {

                // TODO: GEDATA - https://github.com/oonym/l2InterludeServer/blob/4a89de6427a4148308aaedc24f87c5db93b35f40/L2J_Server/java/net/sf/l2j/gameserver/model/L2Character.java

                // TODO: calculate speed
                var speed = sock.client.char.RunSpd * 1.013157894736842146;
                var ticksToMove = 1 + Math.ceil((100 * distance) / speed);
                var ticksToMoveCompleted = 0;
                var spdX = dx / ticksToMove;
                var spdY = dy / ticksToMove;

                var heading = ((Math.atan2(-spx, -spy) * 10430.378350470452724949566316381) + 32768); // ? short.MaxValue 

                console.log('[GS] Move ticksToMove: ' + ticksToMove);
                console.log('[GS] Speed: ' + speed);
                console.log('[GS] Distance: ' + distance);

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

        case 0x11:

            console.log('[GS] Recive packet EnterWorld');

            if (sock.client.status != 3) {
                console.log('[GS] Wrong status 3');
                sock.destroy();
            }

            sock.client.status = 4;

            // for (castles =>) 
            // ExCastleState

            if (1 == 2) {// TODO: isGM

            }

            gameServer.World.getInstance(sock).addPlayer(sock);

            // TODO: add spawn protection
            // setProtection();

            helper.sendGamePacket('ChangeMoveType', sock, sock.client.char, 1);
            console.log('[GS] Send packet: ChangeMoveType');

            helper.sendGamePacket('ExBR_PremiumState', sock, sock.client.char, 0);
            console.log('[GS] Send packet: ExBR_PremiumState');

            // TODO: Send macroses
            // getMacroses().sendUpdate(0x01, 0, true);

            helper.sendGamePacket('MacroListPacket', sock); // SendMacroList
            console.log('[GS] Send packet: MacroListPacket');

            helper.sendGamePacket('SSQInfo', sock, 0);
            console.log('[GS] Send packet: SSQInfo');

            helper.sendGamePacket('HennaInfo', sock, sock.client.char);
            console.log('[GS] Send packet: HennaInfo');

            helper.sendGamePacket('ItemList', sock, sock.client.char, false);
            console.log('[GS] Send packet: ItemList');

            helper.sendGamePacket('ShortCutInit', sock, sock.client.char);
            console.log('[GS] Send packet: ShortCutInit');

            helper.sendGamePacket('ExPeriodicHenna', sock);
            console.log('[GS] Send packet: ExPeriodicHenna');

            helper.sendGamePacket('ExAcquireAPSkillList', sock);
            console.log('[GS] Send packet: ExAcquireAPSkillList');

            helper.sendGamePacket('SkillCoolTime', sock);
            console.log('[GS] Send packet: SkillCoolTime');

            helper.sendGamePacket('UserInfo', sock, sock.client.char);
            console.log('[GS] Send packet: UserInfo');

            helper.sendGamePacket('ExVitalityEffectInfo', sock, sock.client.char);
            console.log('[GS] Send packet: ExVitalityEffectInfo');

            helper.sendGamePacket('ExUserInfoInvenWeight', sock, sock.client.char);
            console.log('[GS] Send packet: ExUserInfoInvenWeight');

            helper.sendGamePacket('MagicAndSkillList', sock, sock.client.char);
            console.log('[GS] Send packet: MagicAndSkillList');

            helper.doAction(gameServer, sock, null, -1); // cancel target

            //// TODO: seven signs status
            //// if (SevenSigns.isSealValidationPeriod())
            //// packet SignsSky

            // TODO: Happy Birthday!

            // Broadcast to clan members

            // TODO: wedding engage and notify Partner
            // engage

            // TODO: notify friends

            // TODO: load tutorial quest ?

            // TODO: mentoring (notify, applyMentoringCond)
            // mentoringLoginConditions

            // TODO: buff and status icons

            /*
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
            */
            helper.sendGamePacket('SkillList', sock, sock.client.char, 0);
            console.log('[GS] Send packet: SkillList');

            helper.sendGamePacket('SkillCoolTime', sock);
            console.log('[GS] Send packet: SkillCoolTime');
            /*
                        }

                    });

                }

            });
            */

            helper.sendGamePacket('FriendList', sock, sock.client.char);
            console.log('[GS] Send packet: FriendList');

            helper.sendGamePacket('ExStorageMaxCount', sock, sock.client.char);
            console.log('[GS] Send packet: ExStorageMaxCount');

            helper.sendGamePacket('QuestList', sock, sock.client.char);
            console.log('[GS] Send packet: QuestList');

            helper.sendGamePacket('ExBasicActionList', sock, helper.BasicActions, helper.TransformationActions, false);
            console.log('[GS] Send packet: ExBasicActionList');

            helper.sendGamePacket('EtcStatusUpdate', sock, sock.client.char);
            console.log('[GS] Send packet: EtcStatusUpdate');

            // TODO: checkHpMessages of effects

            // TODO: checkDayNightMessages

            // TODO: do userinfo task on interval
            helper.sendGamePacket('UserInfo', sock, sock.client.char);
            console.log('[GS] Send packet: UserInfo');

            //helper.sendGamePacket('ActionFailed', sock);
            //console.log('[GS] Send packet: ActionFailed');

            helper.sendGamePacket('ClientSetTime', sock, gameServer);
            console.log('[GS] Send packet: ClientSetTime');

            // TODO: ExSetCompassZoneCode


            // TODO: disable effects 
            // L2Effect.EffectType.HEAL_OVER_TIME
            // L2Effect.EffectType.COMBAT_POINT_HEAL_OVER_TIME


            // TODO: apply augmentation boni for equipped items
            // getAugmentedItems

            helper.sendGamePacket('CharInfo', sock, sock.client.char);
            console.log('[GS] Send CharInfo self to ' + sock.client.char.Name);

            // TODO: Broadcast CharInfo to all in region/instance: CharInfo
            _.each(gameServer.World.getInstance(sock).getPlayersInRadius(sock, 3500, true, false), (player) => {

                if (sock.client.char.Name != player.client.char.Name) { // don't self broadcast, cuz we hav UserInfo
                    helper.sendGamePacket('CharInfo', player, sock.client.char);
                    console.log('[GS] Send CharInfo about ' + sock.client.char.Name + ' to ' + player.client.char.Name);

                    // broadcast info about another player to me
                    helper.sendGamePacket('CharInfo', sock, player.client.char);
                    console.log('[GS] Send CharInfo about ' + player.client.char.Name + ' to ' + sock.client.char.Name);
                }

            });

            setTimeout(() => {

                helper.sendGamePacket('UserInfo', sock, sock.client.char);
                console.log('[GS] Send packet: UserInfo');

            }, 1000);


            break;

        case 0x1f:

            console.log('[GS] Recive packet RequestAction / Action');

            var pack = clientGamePackets.RequestAction(new Buffer(packetsArrayParse));

            if (pack.ObjectId != 0) {

                var player = gameServer.World.getInstance(sock).getPlayerByObjectId(pack.ObjectId);
                if (player) {

                    // TODO: Check if the target is valid, if the player haven't a shop or isn't the requester of a transaction (ex : FriendInvite, JoinAlly, JoinParty...)

                    helper.doAction(gameServer, sock, player, pack.Action);

                    return; // don't send action failed packet
                }

            }

            helper.sendGamePacket('ActionFailed', sock);

            break;


        case 0xb1:

            console.log('[GS] Recive packet 0xb1 - Ping');

            break;

        case 0x2b:

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

                                helper.sendGamePacket('LoginResultPacket', sock);

                                gamePacketController.sendCharList(sock, gameServer);


                            }

                        }

                    });
                }
            });

            break;

        case 0x00:

            console.log('[GS] Recive packet Logout');

            try {

                helper.savePlayer(sock, () => {

                    try {
                        gameServer.clients.splice(gameServer.clients.indexOf(sock), 1);
                        gameServer.World.getInstance(sock).removePlayer(sock);
                        helper.syncPlayersCount(gameServer);

                        sock.destroy();
                        //helper.sendGamePacket('LeaveWorld', sock);

                        //console.log('[GS] Send packet LeaveWorld');

                    } catch (ex) {
                        helper.exceptionHandler(ex);
                    }

                });


            } catch (ex) {
                helper.exceptionHandler(ex);
            }

            break;

        case 0x0c:

            console.log('[GS] Recive packet CharacterCreate');

            if (sock.client.status != 2) {
                console.log('[GS] Wrong status 2');
                sock.destroy();
            }

            if (sock.client.chars.length >= gameServer.settings.maxCharacters) {

                helper.sendGamePacket('CharCreateFail', sock, 1);
                console.log('[GS] Send packet: CharCreateFail - too many chars on acc');

                return;
            }

            var pack = clientGamePackets.CharacterCreate(new Buffer(packetsArrayParse));

            var charTemplate = _.findWhere(gameServer.charTemplates, { ClassId: pack.ClassId });
            if (!charTemplate) {

                helper.sendGamePacket('CharCreateFail', sock, 0);
                console.log('[GS] Send packet: CharCreateFail - bad template class id');

                return;
            }

            if (helper.existCharName(pack.Name, (res) => {
                if (res.length > 0) {

                    helper.sendGamePacket('CharCreateFail', sock, 2);
                    console.log('[GS] Send packet: CharCreateFail - exist char name');

                    return;
                }

                //console.log(pack);

                if ((pack.Name.length < 3) || (pack.Name.length > 16) || !helper.isAlphaNumericAndSpecial(pack.Name)) {

                    helper.sendGamePacket('CharCreateFail', sock, 3);
                    console.log('[GS] Send packet: CharCreateFail - char name 16 symbols or not valid');

                    return;
                }

                var objectId = _.clone(gameServer.nextObjectId);

                console.log('[GS] New object Id for character: ' + objectId);

                gameServer.nextObjectId++;

                helper.createChar({
                    charTemplate: charTemplate,
                    ObjectId: objectId,
                    AccountName: sock.client.data.login,
                    Name: pack.Name,
                    HairStyle: pack.HairStyle,
                    HairColor: pack.HairColor,
                    Face: pack.Face,
                    Sex: pack.Sex,
                    MaxHP: 500,
                    MaxCP: 300,
                    MaxMP: 200,
                    CharId: sock.client.chars.length + 1
                }, (res) => {

                    helper.sendGamePacket('CharCreateSuccess', sock);
                    console.log('[GS] Send packet: CharCreateSuccess');

                    gamePacketController.sendCharList(sock, gameServer);

                });

            }));

            break;

        case 0x12:

            console.log('[GS] Recive packet CharacterSelected');

            if (sock.client.status != 2) {
                console.log('[GS] Wrong status 2');
                sock.destroy();
            }

            var pack = clientGamePackets.CharacterSelected(new Buffer(packetsArrayParse));

            if (sock.client.chars.length > pack.charIndex) {

                sock.client.status = 3;
                sock.client.char = sock.client.chars[pack.charIndex];
                helper.sendGamePacket('CharSelected', sock, gameServer, sock.client.data.session2_1, sock.client.char);
                console.log('[GS] Send packet: CharSelected');

            } else {
                sock.destroy();
            }

            break;

        case 0x13:

            console.log('[GS] Recive packet NewCharacter');

            if (sock.client.status != 2) {
                console.log('[GS] Wrong status 2');
                sock.destroy();
            }

            helper.sendGamePacket('CharTemplates', sock, sock, gameServer.charTemplates);
            console.log('[GS] Send packet: CharTemplates');

            break;

        case 0x48:

            console.log('[GS] Recive packet RequestTargetCancel');

            var pack = clientGamePackets.RequestTargetCancel(new Buffer(packetsArrayParse));

            if (pack.unselect == 0) { // && casting now - abort cast
                // TODO: abort cast
            }

            helper.doAction(gameServer, sock, null, -1); // cancel target

            break;

        case 0x49:

            console.log('[GS] Recive packet Say2');

            var pack = clientGamePackets.Say2(new Buffer(packetsArrayParse));

            if (pack.real) { // TODO: !!! on create character Say2 sended too. 0_o

                // TODO: check player can use chat
                // TODO: flood protection
                // TODO: check BOTs etc.  https://xp-dev.com/sc/186542/3/%2Ftrunk%2FL2J_Server_BETA%2Fjava%2Fcom%2Fl2jserver%2Fgameserver%2Fnetwork%2Fclientpackets%2FSay2.java

                console.log('[GS] CHAT - [' + pack.type + '] ' + sock.client.char.Name + ': ' + pack.text);

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

            }

            break;

        case 0x38:
            console.log('[GS] Recive packet RequestMagicSkillList');

            // TODO: skill list

            helper.sendGamePacket('SkillList', sock);
            console.log('[GS] Send packet: SkillList');

            helper.sendGamePacket('SkillCoolTime', sock);
            console.log('[GS] Send packet: SkillCoolTime');

            break;

        case 0x50:

            console.log('[GS] Recive packet RequestSkillList');

            // TODO: skill list

            helper.sendGamePacket('SkillList', sock);
            console.log('[GS] Send packet: SkillList');

            helper.sendGamePacket('SkillCoolTime', sock);
            console.log('[GS] Send packet: SkillCoolTime');

            break;

        case 0x57:

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

            gamePacketController.sendCharList(sock, gameServer);



            break;

        case 0x59:

            console.log('[GS] Recive packet ValidatePosition');

            var pack = clientGamePackets.ValidatePosition(new Buffer(packetsArrayParse));

            var realX = sock.client.char.X;
            var realY = sock.client.char.Y;
            var realZ = sock.client.char.Z;

            var dx = pack.X - realX;
            var dy = pack.Y - realY;
            var diffSq = ((dx * dx) + (dy * dy));

            console.log("[GS] client pos: " + pack.X + " " + pack.Y + " " + pack.Z + " head " + pack.Heading);
            console.log("[GS] server pos: " + realX + " " + realY + " " + realZ + " head " + sock.client.char.Heading); // TODO: may be not real heading xD

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

                //console.log('DISTANCE server: ' + distanceServer);
                //console.log('DISTANCE client: ' + distanceClient);

                var time = distanceServer / sock.client.char.moveObject.speed;

                var speedServer = sock.client.char.moveObject.speed
                var speedClient = distanceClient / time;

                //console.log('SPEED server: ' + speedServer);
                //console.log('SPEED client: ' + speedClient);

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

        case 0x62:

            console.log('[GS] Recive packet RequestQuestList');

            // TODO: quest list

            helper.sendGamePacket('QuestList', sock);
            console.log('[GS] Send packet: QuestList');

            break;

        case 0xa6:

            console.log('[GS] Recive packet RequestSkillCoolTime');

            // TODO: send skill cool time? Java servers ignore this packet

            break;

        case 0xD0:

            var id2 = -1;
            if (packetsArrayParse.length >= 1) {

                id2 = packetsArrayParse[0] & 0xffff;

                // TODO: check to other D0 pakets !!! ( D0 it's not only manor list)

                console.log('[GS] id2: ' + id2);

                switch (id2) {
                    case 0x01:

                        console.log('[GS] Recive packet RequestManorList');

                        helper.sendGamePacket('ExSendManorList', sock);

                        console.log('[GS] Send packet: ExSendManorList');

                        break;

                    case 0xD1:

                        console.log('[GS] Recive packet RequestBR_NewIConCashBtnWnd');

                        helper.sendGamePacket('ExBR_NewIConCashBtnWnd', sock);

                        console.log('[GS] Send packet: ExBR_NewIConCashBtnWnd');

                        break;

                    case 0x3A:

                        console.log('[GS] Recive packet RequestAllFortressInfo');

                        helper.sendGamePacket('ExShowFortressInfo', sock);

                        console.log('[GS] Send packet: ExShowFortressInfo');

                        break;

                    case 0x21:

                        console.log('[GS] Recive packet RequestKeyMapping');

                        helper.sendGamePacket('ExUISetting', sock);

                        console.log('[GS] Send packet: ExUISetting');

                        break;


                    case 0x104:

                        console.log('[GS] Recive packet ExSendClientINI');

                        var pack = clientGamePackets.ExSendClientINI(new Buffer(packetsArrayParse));


                        break;
                    default:

                        helper.unknownGamePacket(sock, packetId + " - " + id2, packetsArrayParse);

                        break;
                }

            } else {

                console.log('[GS] Client: sent a 0xd0 without the second opcode.');

            }

            break;
        default:

            helper.unknownGamePacket(sock, packetId, packetsArrayParse);

            break;
    }

}

gamePacketController.sendCharList = (sock, gameServer) => {

    helper.poolGameServer.getConnection((err_con, connection) => {

        if (err_con) {
            console.log(err_con);
        } else {

            var query = db.getCharacters(sock.client.data.login);

            connection.query(query.text, query.values, (err, result) => {

                connection.release();

                if (err) {

                    console.log(err);

                } else {

                    sock.client.chars = [];

                    var active = true;

                    _.each(result, (res) => {
                        var char = _.extend({

                            DefenceFire: 0,
                            DefenceWater: 0,
                            DefenceWind: 0,
                            DefenceEarth: 0,
                            DefenceHoly: 0,
                            DefenceUnholy: 0,

                            BoatId: 0,

                            AttackElement: { Id: 0, Value: 0 },

                            Vitality: 5,
                            Fame: 0,
                            RaidPoints: 0,

                            PledgeType: 0,
                            IsClanLeader: 1,

                            ClanCrestId: 0,
                            ClanCrestLargeId: 0,

                            AllyId: 0,
                            AllyCrestId: 0,

                            DeleteDays: 0,

                            Active: active, // TODO

                            EnchantEffect: 0,
                            AugmentationId: 0,

                            PvpFlag: 0,

                            IsChatBanned: 0,

                            WeightPenalty: 0,
                            WeaponExpertisePenalty: 0,
                            ArmorExpertisePenalty: 0,
                            CharmOfCourage: 0,
                            DeathPenaltyBuffLevel: 0,
                            ConsumedSouls: 19,

                            IncreaseForce: 0, // 0-7

                            Inventory: 100,
                            Warehouse: 200,
                            Freight: 300,
                            PrivateSell: 20,
                            PrivateBuy: 30,
                            ReceipeDwarf: 50,
                            Recipe: 40,
                            PrivateStoreType: 0,
                            HasDwarvenCraft: 0,
                            InventoryExtraSlots: 10,
                            QuestItemsLimit: 10,

                            InventoryLimit: 90,
                            Load: 1,

                            Cubics: [],
                            AbnormalEffect: 0, // ?

                            Team: 0,

                            NameColor: 0x00ffffff,
                            TitleColor: 0x00ffffff,

                            IsFishing: 0,
                            FishX: 0,
                            FishY: 0,
                            FishZ: 0,

                            MountType: 0,
                            IsRunning: 1,
                            IsSiting: 0,
                            IsInCombat: 0,
                            IsAlikeDead: 0,
                            Visible: 1,

                            SwimRunSpd: 50,
                            SwimWalkSpd: 50,
                            FlRunSpd: 130,
                            FlWalkSpd: 130,
                            FlyRunSpd: 130,
                            FlyWalkSpd: 130,

                            Instance: 0,

                            DangerArea: 0,

                            TargetId: 0

                        }, res);

                        sock.client.chars.push(char);

                        // TODO: save and restore active char
                        if (active) active = false;

                    });

                    console.log('[GS] Account characters: ' + sock.client.chars.length);

                    sock.client.status = 2;

                    helper.sendGamePacket('CharSelectInfo', sock, gameServer, sock.client.data.login, sock.client.data.session2_1, sock.client.chars);

                    console.log('[GS] Send packet: CharSelectInfo');

                    helper.sendGamePacket('ExLoginVitalityEffectInfo', sock, 5);
                    console.log('[GS] Send ExLoginVitalityEffectInfo');

                }

            });

        }

    });


};

module.exports = gamePacketController;