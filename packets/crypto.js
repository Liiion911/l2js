var crypto = {}
var helper = require('./helper.js');

crypto.randomInteger = function (min, max) {
    var rand = min - 0.5 + Math.random() * (max - min + 1)
    rand = Math.round(rand);
    return rand;
}

crypto.decrypt = function (sock, raw, offset, size) {
    try {

        var temp = 0;
        for (var i = 0; i < size; i++) {
            var temp2 = raw[offset + i] & 0xFF;
            raw[offset + i] = (temp2 ^ sock.client.newXorKeyDec[i & 15] ^ temp);
            temp = temp2;
        }

        var old = sock.client.newXorKeyDec[8] & 0xff;
        old |= (sock.client.newXorKeyDec[9] << 8) & 0xff00;
        old |= (sock.client.newXorKeyDec[10] << 0x10) & 0xff0000;
        old |= (sock.client.newXorKeyDec[11] << 0x18) & 0xff000000;

        old += size;

        sock.client.newXorKeyDec[8] = (old & 0xff);
        sock.client.newXorKeyDec[9] = ((old >> 0x08) & 0xff);
        sock.client.newXorKeyDec[10] = ((old >> 0x10) & 0xff);
        sock.client.newXorKeyDec[11] = ((old >> 0x18) & 0xff);

    } catch (ex) {
        helper.exceptionHandler(ex);
    }
}

crypto.encrypt = function (sock, raw, offset, size) {
    try {

        var temp = 0;
        for (var i = 0; i < size; i++) {
            var temp2 = raw[offset + i] & 0xFF;
            temp = temp2 ^ sock.client.newXorKeyEnc[i & 15] ^ temp;
            raw[offset + i] = temp;
        }

        var old = sock.client.newXorKeyEnc[8] & 0xff;
        old |= (sock.client.newXorKeyEnc[9] << 8) & 0xff00;
        old |= (sock.client.newXorKeyEnc[10] << 0x10) & 0xff0000;
        old |= (sock.client.newXorKeyEnc[11] << 0x18) & 0xff000000;

        old += size;

        sock.client.newXorKeyEnc[8] = (old & 0xff);
        sock.client.newXorKeyEnc[9] = ((old >> 0x08) & 0xff);
        sock.client.newXorKeyEnc[10] = ((old >> 0x10) & 0xff);
        sock.client.newXorKeyEnc[11] = ((old >> 0x18) & 0xff);

    } catch (ex) {
        helper.exceptionHandler(ex);
    }
}

crypto.generateNewKey = function () {
    try {
        var key = new Uint8Array(16);

        // randomize the 8 first bytes
        for (var j = 0; j < key.length; j++) {
            key[j] = crypto.randomInteger(0, 255);
        }

        // the last 8 bytes are static
        key[8] = 0xc8;
        key[9] = 0x27;
        key[10] = 0x93;
        key[11] = 0x01;
        key[12] = 0xa1;
        key[13] = 0x6c;
        key[14] = 0x31;
        key[15] = 0x97;
        return key;

    } catch (ex) {
        helper.exceptionHandler(ex);
    }
    return [];
}

crypto.appendChecksum = function (raw, offset, size) {
    try {

        var chksum = 0;
        var count = size - 4;
        var ecx;
        var i;

        for (i = offset; i < count; i += 4) {
            ecx = raw[i] & 0xff;
            ecx |= (raw[i + 1] << 8) & 0xff00;
            ecx |= (raw[i + 2] << 0x10) & 0xff0000;
            ecx |= (raw[i + 3] << 0x18) & 0xff000000;

            chksum ^= ecx;
        }

        ecx = raw[i] & 0xff;
        ecx |= (raw[i + 1] << 8) & 0xff00;
        ecx |= (raw[i + 2] << 0x10) & 0xff0000;
        ecx |= (raw[i + 3] << 0x18) & 0xff000000;

        raw[i] = (chksum & 0xff);
        raw[i + 1] = ((chksum >> 0x08) & 0xff);
        raw[i + 2] = ((chksum >> 0x10) & 0xff);
        raw[i + 3] = ((chksum >> 0x18) & 0xff);
        return raw;

    } catch (ex) {
        helper.exceptionHandler(ex);
    }
    return [];
}

crypto.newPubKey = function () {
    try {
        var ret = new Uint8Array(16);
        for (var i = 0; i < 16; i++) {
            ret[i] = (parseInt((Math.random() * 50).toFixed(0)));
        }
        return ret;
    } catch (ex) {
        helper.exceptionHandler(ex);
    }
    return [];
}

crypto.encXORPass = function (raw, offset, size, key) {
    try {

        var stop = size - 8;
        var pos = 4 + offset;
        var edx;
        var ecx = key; // Initial xor key

        while (pos < stop) {
            edx = (raw[pos] & 0xFF);
            edx |= (raw[pos + 1] & 0xFF) << 8;
            edx |= (raw[pos + 2] & 0xFF) << 16;
            edx |= (raw[pos + 3] & 0xFF) << 24;

            ecx += edx;

            edx ^= ecx;

            raw[pos++] = (edx & 0xFF);
            raw[pos++] = ((edx >> 8) & 0xFF);
            raw[pos++] = ((edx >> 16) & 0xFF);
            raw[pos++] = ((edx >> 24) & 0xFF);
        }

        raw[pos++] = (ecx & 0xFF);
        raw[pos++] = ((ecx >> 8) & 0xFF);
        raw[pos++] = ((ecx >> 16) & 0xFF);
        raw[pos++] = ((ecx >> 24) & 0xFF);
        return raw;

    } catch (ex) {
        helper.exceptionHandler(ex);
    }
    return [];
}

module.exports = crypto;