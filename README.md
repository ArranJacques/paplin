# Paplin.js

A promise based Node JS package for controlling the Maplin Robot Arm.

This package is written in es6 and has not been compiled to es5.

![Robot Arm](photo.jpg?raw=true)

### Contents

- [Installation](#installation)
- [Connecting to the Arm](#connecting-to-the-arm)
    - [Closing the Connection](#closing-the-connection)
- [Controlling the Arm](#controlling-the-arm)
    - [Making Movements](#making-movements)
        - [Making Moves Concurrently](#making-moves-concurrently)
    - [Stoping Movements](#stoping-movements)
    - [Controlling the light](#controlling-the-light)
- [A Full Example](#a-full-example)
- [Notes About Movement Accuracy](#notes-about-movement-accuracy)

## Installation

```
npm install --save paplin
```

```
const Paplin = require('paplin');

const Arm = new Paplin();
```

## Connecting to the Arm

Plug the arm into a usb port and make sure it's turned on. To open a connection call the `Arm.openConnection(vendorId)` method and pass the device's vendor id.

```
const vendorId = 4711;
const connected = Arm.openConnection(vendorId);

if (connected) {
    // Do stuff...
}
```

### Closing the Connection

```
Arm.closeConnection();
```


## Controlling the Arm

Once a connection has been opened you can control the arm by calling methods on the `Arm` instance.

### Making Movements

The arm is moved by calling move methods on the `Arm` instance. Each move method accepts a time parameter that defines, in milliseconds, how long the move will me made for.

```
Arm.moveShoulderUp(300);
```

Each move method returns a `Promise`. Using promises commands can be chained together to form long sequences of moves.

```
Arm.moveShoulderUp(300).then(Arm => {
    Arm.moveShoulderCounterclockwise(1000).then(Arm => {
        Arm.openGrip(100).then(Arm => {
            // etc
        });
    });
});
```

The following move methods are available:

```
// Shoulder (base)
Arm.moveShoulderUp(time);
Arm.moveShoulderDown(time);
Arm.moveShoulderClockwise(time);
Arm.moveShoulderCounterclockwise(time);

// Elbow
Arm.moveElbowUp(time);
Arm.moveElbowDown(time);

// Wrist
Arm.moveWristUp(time);
Arm.moveWristDown(time);

// Grip
Arm.openGrip(time);
Arm.closeGrip(time);
```

#### Making Moves Concurrently

As well as creating sequences of moves, multiple moves can be made simultaneously using the `Arm.concurrent()` method. The `concurrent` method accepts a callback, which is passed an instance of `ConcurrentMoveSequencer`. The moves that you want to be made concurrently are defined by calling move methods on the `ConcurrentMoveSequencer` instance.

```
Arm.concurrent(Concurrent => {
    Concurrent.moveShoulderClockwise(2000);
    Concurrent.moveShoulderDown(1000);
    Concurrent.closeGrip(500);
});
```

The `ConcurrentMoveSequencer` has the same move methods available as the `Arm`. Each method accepts a time, in milliseconds, to make the move for. Unlink the `Arm` move methods, however, these methods do not return promises so can't be chained together.

The `Arm.concurrent()` method returns a `Promise`, which can be used to chain commands together.

```
Arm.concurrent(Concurrent => {
    Concurrent.moveShoulderClockwise(2000);
    Concurrent.moveShoulderDown(1000);
    Concurrent.closeGrip(500);
}).then(Arm => {
    Arm.moveElbowDown(1000).then(Arm => {
        // etc    
    });
});
```

### Stoping Movements

Movements will automatically stop after the given time has elapsed, however they can be stopped prematurely with the following methods.

##### .stopMovement()

Stops all movements but keeps the light on, if it's on.

```
Arm.turnLightOn().then(Arm => {
    Arm.moveShoulderUp(1000).then(() => {
        // etc
    });
});
    
setTimeout(() => Arm.stopMovement(), 300);
```


##### .stop()

Stops all movements and turns the light off.

```
Arm.turnLightOn().then(Arm => {
    Arm.moveShoulderUp(1000).then(() => {
        // etc
    });
});
    
setTimeout(() => Arm.stop(), 300);
```


### Controlling the Light

```
Arm.turnLightOn();
Arm.turnLightOff();
```

Both of these methods return a `Promise`, which can be used to chain commands together.

```
Arm.turnLightOn().then(Arm => {
    Arm.moveShoulderUp(300).then(Arm => {
        // etc
    });
});
```

## A Full Example

```

const Paplin = require('paplin');

const Arm = new Paplin();

const vendorId = 4711;
const connected = Arm.openConnection(vendorId);

if (connected) {

    Arm.turnLightOn().then(Arm => {

        Arm.moveShoulderCounterclockwise(1000).then(Arm => {

            Arm.concurrent(Concurrent => {
                Concurrent.moveWristDown(500);
                Concurrent.moveElbowDown(1000);
                Concurrent.closeGrip(1000);
            }).then(Arm => {
                Arm.turnLightOff().then(Arm => {
                    Arm.closeConnection();
                });
            });
        });
    });

}
```

## Notes About Movement Accuracy

All of the movement commands are time based, i.e., the arm moves for a given number of milliseconds before stopping. It's worth noting that although two moves can be performed for the same amount of time, the distance traveled won't necessarily be the same. For example moving the shoulder down for 1s and then up for 1s will not necessarily return the arm to the same place. The reason for this is that the speed at which the arm moves is not consistent. If the arm is moving down then it will tend to move faster as it will be assisted by gravity, and when moving up it will be going against gravity so will move slower.