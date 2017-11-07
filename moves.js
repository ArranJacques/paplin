/**
 * The bits for each motor direction and the LED.
 *
 * @type {{}}
 */
module.exports = {
    shoulder: {
        up: [64, 0, 0],
        down: [128, 0, 0],
        clockwise: [0, 1, 0],
        counterClockwise: [0, 2, 0]
    },
    elbow: {
        up: [4, 0, 0],
        down: [8, 0, 0]
    },
    wrist: {
        up: [32, 0, 0],
        down: [16, 0, 0]
    },
    grip: {
        open: [2, 0, 0],
        close: [1, 0, 0]
    }
};