const ConcurrentMoveSequencer = require('./ConcurrentMoveSequencer');
const errors = require('./errors');
const moves = require('./moves');
const usb = require('usb');


/**
 * Robot Arm.
 *
 * @constructor
 */
const RobotArm = function () {

    /**
     * The connection to the robot arm.
     *
     * @type {null}
     * @private
     */
    this._connection = null;

    /**
     * Is the robot arm moving?
     *
     * @type {boolean}
     */
    this.performingSequence = false;

    /**
     * Is the light on?
     *
     * @type {boolean}
     */
    this.lightOn = false;

    /**
     * Flag to be able to cancel a sequence of actions
     * @type {Boolean}
     */
    this.forceStop = false;
};


/**
 * Open a connection to the robot arm.
 *
 * @param {int} idVendor
 * @returns {boolean}
 */
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


/**
 * Close the connection to the robot arm.
 */
RobotArm.prototype.closeConnection = function () {
    this._connection.controlTransfer(0x40, 6, 0x100, 0, new Buffer([0, 0, 0]), () => {
        this._connection.close();
        this._connection = null;
    });
};


/**
 * @param {[int,int,int]} move
 * @private
 */
RobotArm.prototype._controlTransfer = function (move) {
    this._connection.controlTransfer(0x40, 6, 0x100, 0, new Buffer(move));
};


/**
 * @param {Array} sequence
 * @returns {Promise}
 * @private
 */
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
                if ( self.forceStop ) {
                    self.forceStop = false;
                }
                else {
                    makeMovement(i + 1, self);
                }
            }, sequence[i].time);
        }

        makeMovement(0, this);
    });
};


/**
 * Stop all movement and turn the light off.
 */
RobotArm.prototype.stop = function () {
    this.forceStop = true;
    this.performingSequence = false;

    this.lightOn = false;
    this._controlTransfer([0, 0, 0]);
};


/**
 * Stop all movement but keep the light on, if it's on.
 * @returns {Promise}
 */
RobotArm.prototype.stopMovement = function () {
    this.forceStop = true;
    this.performingSequence = false;

    this._controlTransfer([0, 0, this.lightOn ? 1 : 0]);
};


/**
 * Move the shoulder up.
 *
 * @param {int} time
 * @returns {Promise}
 */
RobotArm.prototype.moveShoulderUp = function (time) {
    return this._performSequence([{move: moves.shoulder.up, time}]);
};


/**
 * Move the shoulder down.
 *
 * @param {int} time
 * @returns {Promise}
 */
RobotArm.prototype.moveShoulderDown = function (time) {
    return this._performSequence([{move: moves.shoulder.down, time}]);
};


/**
 * Move the shoulder clockwise.
 *
 * @param {int} time
 * @returns {Promise}
 */
RobotArm.prototype.moveShoulderClockwise = function (time) {
    return this._performSequence([{move: moves.shoulder.clockwise, time}]);
};


/**
 * Move the shoulder counterclockwise.
 *
 * @param {int} time
 * @returns {Promise}
 */
RobotArm.prototype.moveShoulderCounterclockwise = function (time) {
    return this._performSequence([{move: moves.shoulder.counterClockwise, time}]);
};


/**
 * Move the elbow up.
 *
 * @param {int} time
 * @returns {Promise}
 */
RobotArm.prototype.moveElbowUp = function (time) {
    return this._performSequence([{move: moves.elbow.up, time}]);
};


/**
 * Move the elbow down.
 *
 * @param {int} time
 * @returns {Promise}
 */
RobotArm.prototype.moveElbowDown = function (time) {
    return this._performSequence([{move: moves.elbow.down, time}]);
};


/**
 * Move the wrist up.
 *
 * @param {int} time
 * @returns {Promise}
 */
RobotArm.prototype.moveWristUp = function (time) {
    return this._performSequence([{move: moves.wrist.up, time}]);
};


/**
 * Move the wrist up.
 *
 * @param {int} time
 * @returns {Promise}
 */
RobotArm.prototype.moveWristDown = function (time) {
    return this._performSequence([{move: moves.wrist.down, time}]);
};


/**
 * Open the grip.
 *
 * @param {int} time
 * @returns {Promise}
 */
RobotArm.prototype.openGrip = function (time) {
    return this._performSequence([{move: moves.grip.open, time}]);
};


/**
 * Close the grip.
 *
 * @param {int} time
 * @returns {Promise}
 */
RobotArm.prototype.closeGrip = function (time) {
    return this._performSequence([{move: moves.grip.close, time}]);
};


/**
 * Turn the light on.
 *
 * @returns {Promise}
 */
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


/**
 * Turn the light off.
 *
 * @returns {Promise}
 */
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


/**
 * Perform moves concurrently.
 *
 * @param {Function} moves
 * @returns {Promise}
 */
RobotArm.prototype.concurrent = function (moves) {
    let Concurrent = new ConcurrentMoveSequencer();
    moves(Concurrent);
    return this._performSequence(Concurrent.sequence());
};


module.exports = RobotArm;