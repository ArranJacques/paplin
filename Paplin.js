const ConcurrentMoveSequencer = require('./ConcurrentMoveSequencer');
const errors = require('./errors');
const moves = require('./moves');
const usb = require('usb');

const RobotArm = function () {

    this._connection = null;
    this.performingSequence = false;
    this.lightOn = false;
    this.forceStop = false;
};

RobotArm.prototype.openConnection = function (idVendor) {

    let ubsDevices = usb.getDeviceList();

    for (let key in ubsDevices) {
        if (ubsDevices.hasOwnProperty(key)) {
            if (ubsDevices[key].deviceDescriptor.idVendor === idVendor) {
                this._connection = ubsDevices[key];
                break;
            }
        }
    }

    if (!this._connection) {
        return false;
    }

    this._connection.open();

    return true;
};

RobotArm.prototype.closeConnection = function () {
    this._connection.controlTransfer(0x40, 6, 0x100, 0, new Buffer([0, 0, 0]), () => {
        this._connection.close();
        this._connection = null;
    });
};

RobotArm.prototype._controlTransfer = function (move) {
    this._connection.controlTransfer(0x40, 6, 0x100, 0, new Buffer(move));
};

RobotArm.prototype._performSequence = function (sequence) {


    if (this.lightOn) {
        sequence.forEach(command => command.move[2] = 1);
    }

    return new Promise((resolve, reject) => {

        if (this.performingSequence) {
            reject(errors.PERFORMING_SEQUENCE);
            return;
        }
        this.performingSequence = true;

        function makeMovement(i, self) {

            if (i >= sequence.length) {
                self.stopMovement();
                self.performingSequence = false;
                resolve(self);
                return;
            }

            self._controlTransfer(sequence[i].move);

            setTimeout(() => {
                if (self.forceStop) {
                    self.forceStop = false;
                } else {
                    makeMovement(i + 1, self);
                }
            }, sequence[i].time);
        }

        makeMovement(0, this);
    });
};

RobotArm.prototype.stop = function () {
    this.forceStop = true;
    this.performingSequence = false;
    this.lightOn = false;
    this._controlTransfer([0, 0, 0]);
};

RobotArm.prototype.stopMovement = function () {
    this.forceStop = true;
    this.performingSequence = false;
    this._controlTransfer([0, 0, this.lightOn ? 1 : 0]);
};

RobotArm.prototype.moveShoulderUp = function (time) {
    return this._performSequence([{ move: moves.shoulder.up, time }]);
};

RobotArm.prototype.moveShoulderDown = function (time) {
    return this._performSequence([{ move: moves.shoulder.down, time }]);
};

RobotArm.prototype.moveShoulderClockwise = function (time) {
    return this._performSequence([{ move: moves.shoulder.clockwise, time }]);
};

RobotArm.prototype.moveShoulderCounterclockwise = function (time) {
    return this._performSequence([{ move: moves.shoulder.counterClockwise, time }]);
};

RobotArm.prototype.moveElbowUp = function (time) {
    return this._performSequence([{ move: moves.elbow.up, time }]);
};

RobotArm.prototype.moveElbowDown = function (time) {
    return this._performSequence([{ move: moves.elbow.down, time }]);
};

RobotArm.prototype.moveWristUp = function (time) {
    return this._performSequence([{ move: moves.wrist.up, time }]);
};

RobotArm.prototype.moveWristDown = function (time) {
    return this._performSequence([{ move: moves.wrist.down, time }]);
};

RobotArm.prototype.openGrip = function (time) {
    return this._performSequence([{ move: moves.grip.open, time }]);
};

RobotArm.prototype.closeGrip = function (time) {
    return this._performSequence([{ move: moves.grip.close, time }]);
};

RobotArm.prototype.turnLightOn = function () {

    return new Promise((resolve, reject) => {

        if (!this.performingSequence) {
            this.lightOn = true;
            this._controlTransfer([0, 0, 1]);
            resolve(this);
        } else {
            reject(errors.PERFORMING_SEQUENCE);
        }

    });
};

RobotArm.prototype.turnLightOff = function () {

    return new Promise((resolve, reject) => {

        if (!this.performingSequence) {
            this.lightOn = false;
            this._controlTransfer([0, 0, 0]);
            resolve(this);
        } else {
            reject(errors.PERFORMING_SEQUENCE);
        }

    });
};

RobotArm.prototype.concurrent = function (moves) {
    let Concurrent = new ConcurrentMoveSequencer();
    moves(Concurrent);
    return this._performSequence(Concurrent.sequence());
};

module.exports = RobotArm;
