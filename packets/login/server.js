var protocol = require('../protocol.js');
var _ = require('underscore');

var serverLoginPackets = {};

//-----------------------------------------------//
// Login Server packets                          //
//-----------------------------------------------//

serverLoginPackets.GGAuth = function(sock) {
    var p = new protocol.BasePacket();
    p.writeC(0x0B);
    p.writeD(sock.client.sessionId);
    p.writeD(0);
    p.writeD(0);
    p.writeD(0);
    p.writeD(0);
    return p;
}

serverLoginPackets.Init = function(pubKey, rsaKey, sock) {
    var p = new protocol.BasePacket();
    p.writeC(0x00);
    p.writeD(sock.client.sessionId);
    p.writeD(0x0000c621);
    p.writeB(rsaKey);
    p.writeD(0x29DD954E);
    p.writeD(0x77C39CFC);
    p.writeD(0x97ADB620);
    p.writeD(0x07BDE0F7);
    p.writeB(pubKey);
    p.writeC(0x00);
    return p;

}

serverLoginPackets.LoginFail = function(reason) {
    var p = new protocol.BasePacket();
    p.writeC(0x01);
    p.writeD(reason);
    return p;
    /*
            NOTHING = 0,
            SYSTEM_ERROR_TRY_AGAIN = 1,
            PASS_WRONG = 2,
            USER_OR_PASS_WRONG = 3,
            ACCESS_FAILED_TRY_AGAIN = 4,
            INCORRECT_ACCOUNT_INFO = 5,
            ACCOUNT_IN_USE = 7,
            TOO_YOUNG = 12,
            SERVER_OVERLOADED = 15,
            SERVER_MAINTENANCE = 16,
            CHANGE_TEMP_PASS = 17,
            TEMP_PASS_EXPIRED = 18,
            NO_TIME_LEFT = 19,
            SYSTEM_ERROR = 20,
            ACCESS_FAILED = 21,
            RESTRICTED_IP = 22,
            SIX = 25, //Just the number 6 LOL!
            WEEK_TIME_FINISHED = 30
            SECURITY_CARD = 31, //Enter Security card number
            NOT_VERIFY_AGE = 32,
            NO_ACCESS_COUPON = 33,
            DUAL_BOX = 35,
            INACTIVE_REACTIVATE = 36,
            ACCEPT_USER_AGREEMENT = 37,
            GUARDIAN_CONSENT = 38,
            DECLINED_AGREEMENT_OR_WIDTHDRAWL = 39,
            ACCOUNT_SUSPENDED = 40,
            CHANGE_PASS_QUIZ = 41,
            ACCESSED_10_ACCOUNTS = 42,
            MASTER_ACCOUNT_RESTRICTED = 43,
            CERTIFICATION_FAILED = 46,
            PHONE_SERVICE_OFFLINE = 47,
            PHONE_SIGNAL_DELAY = 48,
            PHONE_CALL_NOT_RECEIVED = 49,
            PHONE_EXPIRED = 50,
            PHONE_CHECKED = 51,
            PHONE_HEAVY_VALUME = 52,
            PHONE_EXPIRED_BLOCKED = 53,
            PHONE_FAILED_3_TIMES = 54,
            MAX_PHONE_USES_EXCEEDED = 55,
            PHONE_UNDERWAY = 56
    */
}

serverLoginPackets.LoginOk = function(session1_1, session1_2) {
    var p = new protocol.BasePacket();
    p.writeC(0x03);
    p.writeD(session1_1);
    p.writeD(session1_2);
    p.writeD(0);
    p.writeD(0);
    p.writeD(1002);
    p.writeH(60872);
    p.writeC(35);
    p.writeC(6);
    p.writeB(new Buffer(28));
    return p;
}

serverLoginPackets.PlayFail = function(reason) {
    var p = new protocol.BasePacket();
    p.writeC(0x06);
    p.writeD(reason);
    return p;
    /*
        // 0x00000003 - Пароль не подходит к аккаунту
        // 0x00000004 - Access failed. Please try agen later
        // 0x0000000f - Слишком много пользователей
    */
}

serverLoginPackets.PlayOk = function(session2_1, session2_2) {
    var p = new protocol.BasePacket();
    p.writeC(0x07);
    p.writeD(session2_1);
    p.writeD(session2_2);
    p.writeC(0x0E); // TODO: fix it!
    return p;
}

serverLoginPackets.ServerList = function(servers) {
    var p = new protocol.BasePacket();
    p.writeC(0x04);
    p.writeC(servers.length); // количество серверов
    p.writeC(0);

    _.each(servers, (server) => {

        p.writeC(server.Id);
        p.writeC(server.IP[0]); p.writeC(server.IP[1]); p.writeC(server.IP[2]); p.writeC(server.IP[3]);
        p.writeD(7777);
        p.writeC(server.AgeLimit);
        p.writeC(server.IsPvpServer);
        p.writeH(server.PlayerCount);
        p.writeH(server.MaxPlayerCount);
        p.writeC(server.IsOnline);
        p.writeD(1 << 10); // server type / Classic hack ?
        p.writeC(server.ServerBrackets);

    });

    var paddedBytes = 1;
    paddedBytes += (3 + (4 * (1))); // account entry().length

    p.writeH(paddedBytes);
    p.writeC(servers.length);

    _.each(servers, (server) => {

        p.writeC(server.Id);
        p.writeC(1);
        p.writeC(0);

    });

    console.log(p);

    return p;
}

module.exports = serverLoginPackets;