var _ = require('underscore');

//-----------------------------------------------//
// protocol.ClientPacket (packets received by the server) //
//-----------------------------------------------//

var protocol = {}

protocol.ClientPacket = function(buffer) {
    this._buffer = buffer;
    this._offset = 0;
    this._data = [];
}

protocol.ClientPacket.prototype.readD = function () {
    this._data.push(
        this._buffer.readInt32LE(this._offset)
    );
    this._offset += 4;
    return this;
};

protocol.ClientPacket.prototype.readH = function () {
    this._data.push(
        this._buffer.readInt16LE(this._offset)
    );
    this._offset += 2;
    return this;
};

protocol.ClientPacket.prototype.readC = function () {
    this._data.push(
        this._buffer.readInt8(this._offset)
    );
    this._offset++;
    return this;
};

protocol.ClientPacket.prototype.readF = function () {
    this._buffer.readDoubleLE(this._offset);
    this._offset += 8;
    return this;
}

protocol.ClientPacket.prototype.readQ = function () {
    this._buffer.readDoubleLE(this._offset);
    this._offset += 8;
    return this;
}

protocol.ClientPacket.prototype.readS = function () {
    var i = this._offset;
    for (; i < this._buffer.length; i += 2) {
        if (this._buffer.readInt16LE(i) === 0x00)
            break;
    }
    this._data.push(
        this._buffer.toString('ucs2', this._offset, i)
    );
    this._offset += i + 2;
    return this;
};

protocol.ClientPacket.prototype.readB = function (length) {
    this._data.push(
        this._buffer.slice(this._offset, this._offset + length)
    );
    this._offset += length;
    return this;
}

protocol.ClientPacket.prototype.setValid = function (b) {
    this._valid = b;
    return this._valid;
}

protocol.ClientPacket.prototype.isValid = function () {
    return this._valid;
}

protocol.ClientPacket.prototype.data = function () {
    return this._data;
}

//-----------------------------------------------//
// protocol.BasePacket (packets sent by the server)       //
//-----------------------------------------------//

protocol.BasePacket = function() {
    this._virtualBuffer = [];
}


protocol.BasePacket.prototype.writeC = function (value) {
    this._virtualBuffer.push(value & 0xff);
    return this;
};

protocol.BasePacket.prototype.writeD = function (value) {
    this._virtualBuffer.push(value & 0xff);
    this._virtualBuffer.push((value >> 8) & 0xff);
    this._virtualBuffer.push((value >> 16) & 0xff);
    this._virtualBuffer.push((value >> 24) & 0xff);
    return this;
};

protocol.BasePacket.prototype.writeB = function (buf) {
    if (!Buffer.isBuffer(buf)) {
        throw 'Argument is not a buffer';
    }
    var buffer = new Buffer(buf.length);
    buf.copy(buffer, 0);
    for (byteIntexString in buffer) {
        var byteIntex = parseInt(byteIntexString);
        if (byteIntex >= 0) {
            this._virtualBuffer.push(buffer[byteIntex]);
        } else {
            break;
        }
    }
    return this;
};

protocol.BasePacket.prototype.writeH = function (value) {
    this._virtualBuffer.push(value & 0xff);
    this._virtualBuffer.push((value >> 8) & 0xff);
    return this;
};

protocol.BasePacket.prototype.writeF = function (value) {
    const buf = new Buffer(8)
    buf.writeDoubleLE(value, 0);
    _.each(buf, (b) => {
        this._virtualBuffer.push(b & 0xff);
    });

    return this;
};

protocol.BasePacket.prototype.writeQ = function (value) {

    for (var index = 0; index < 8; index++) {
        var byte = value & 0xff;
        this._virtualBuffer.push(byte)
        value = (value - byte) / 256;
    }

    return this;
};

protocol.BasePacket.prototype.writeS = function (txt) {
    var buf = Buffer.from(txt, 'ucs2');
    _.each(buf, (b) => {
        this._virtualBuffer.push(b & 0xff);
    });
    this._virtualBuffer.push(0 & 0xff);
    this._virtualBuffer.push(0 & 0xff);
    return this;
};

protocol.BasePacket.prototype.writeS2 = function (txt) {
    var buf = Buffer.from(txt, 'ucs2');
    _.each(buf, (b) => {
        this._virtualBuffer.push(b & 0xff);
    });
    return this;
};
protocol.BasePacket.prototype.writeCutS = protocol.BasePacket.prototype.writeS2;

protocol.BasePacket.prototype.getContent = function () {
    return this._virtualBuffer;
};

protocol.BasePacket.strlen = function (str) {
    return Buffer.byteLength(str, 'ucs2') + 2;
};

module.exports = protocol;