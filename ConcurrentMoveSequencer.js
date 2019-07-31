const moves = require('./moves');

const ConcurrentMoveSequencer = function () {
    this._sequence = [];
};

ConcurrentMoveSequencer.prototype._mergeMoves = function (a, b) {
    return [
        (a[0] + b[0]),
        (a[1] ^ b[1]),
        (a[2] ^ b[2])
    ];
};

ConcurrentMoveSequencer.prototype._mergeIntoMoveSequence = function (move, time, it) {

    let i = it ? it : 0;
    let command = this._sequence[i];

    if (!command) {
        this._sequence.push({ move, time });
        return;
    }

    if (time < command.time) {

        let remaingTime = command.time - time;
        let originalMove = command.move.slice(0);

        command.time = time;
        command.move = this._mergeMoves(command.move.slice(0), move);

        this._sequence.splice(i + 1, 0, { move: originalMove, time: remaingTime });

    } else {
        if (time > command.time) {
            let diff = time - command.time;
            command.move = this._mergeMoves(command.move.slice(0), move);
            this._mergeIntoMoveSequence(move, diff, i + 1);
        } else {
            command.move = this._mergeMoves(command.move.slice(0), move);
        }
    }
};

ConcurrentMoveSequencer.prototype.sequence = function () {
    return this._sequence;
};

ConcurrentMoveSequencer.prototype.moveShoulderUp = function (time) {
    this._mergeIntoMoveSequence(moves.shoulder.up, time);
};

ConcurrentMoveSequencer.prototype.moveShoulderDown = function (time) {
    this._mergeIntoMoveSequence(moves.shoulder.down, time);
};

ConcurrentMoveSequencer.prototype.moveShoulderClockwise = function (time) {
    this._mergeIntoMoveSequence(moves.shoulder.clockwise, time);
};

ConcurrentMoveSequencer.prototype.moveShoulderCounterclockwise = function (time) {
    this._mergeIntoMoveSequence(moves.shoulder.counterClockwise, time);
};

ConcurrentMoveSequencer.prototype.moveElbowUp = function (time) {
    this._mergeIntoMoveSequence(moves.elbow.up, time);
};

ConcurrentMoveSequencer.prototype.moveElbowDown = function (time) {
    this._mergeIntoMoveSequence(moves.elbow.down, time);
};

ConcurrentMoveSequencer.prototype.moveWristUp = function (time) {
    this._mergeIntoMoveSequence(moves.wrist.up, time);
};

ConcurrentMoveSequencer.prototype.moveWristDown = function (time) {
    this._mergeIntoMoveSequence(moves.wrist.down, time);
};

ConcurrentMoveSequencer.prototype.openGrip = function (time) {
    this._mergeIntoMoveSequence(moves.grip.open, time);
};

ConcurrentMoveSequencer.prototype.closeGrip = function (time) {
    this._mergeIntoMoveSequence(moves.grip.close, time);
};

module.exports = ConcurrentMoveSequencer;
