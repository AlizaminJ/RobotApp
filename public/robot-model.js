'use strict';

// eslint-disable-next-line no-unused-vars
class RobotModel {

  constructor(log) {
    this.log = log;
    this.observers = [];
    this.levels = [];
  }

  storeLevels(levels) {
    this.levels = levels;
    this.notify('LEVELS_LOADED');
    this.selectLevel(levels[0].id);
  }

  selectLevel(id) {
    this.level = this.levels.find(level => level.id === id);
    this.reset();
  }

  reset() {
    if (!this.level) {
      this.log('MODEL missing level');
      return;
    }
    this.board = this.level.board.map(row => row.split(''));
    this.robot = Object.assign({}, this.level.robot);
    this.board.reverse();
    this.moves = 0;
    this.turns = 0;
    this.flagReached = false;
    this.appleEaten = false;
    this.applesEaten = 0;
    this.pickedUpKey = false;
    this.notify('STATE_CHANGE');
  }

  subscribe(observer) {
    if (typeof observer.update === 'function') {
      this.observers.push(observer);
      this.log('MODEL observer added');
    } else {
      this.log('MODEL can\'t subscribe observer without update function');
    }
  }

  notify(type) {
    this.log('MODEL notifying', type);
    this.observers.forEach(observer => observer.update(type));
  }

  move() {
    this.log('MODEL executing move()');
    this.appleEaten = false;
    this.flagReached = false;
    const { x, y } = this.robot;
    const [newX, newY] = this.getNewPosition();
    const cell = this.board[newY][newX];

    if (cell === '.' || cell === 'F' || cell === 'A') {
      this.board[y][x] = '.';
      this.robot.x = newX;
      this.robot.y = newY;
      this.board[newY][newX] = 'R';
      if (cell === 'F') {
        this.flagReached = true;
        this.log(`MODEL flag reached in ${this.moves} moves and ${this.turns} turns`);
        if (this.applesEaten > 0) {
          this.log('MODEL total apples eaten: ' + this.applesEaten);
        }
      } else if (cell === 'A') {
        this.appleEaten = true;
        this.applesEaten += 1;
        this.log('MODEL apple eaten: YUM');
      }
    } else {
      this.log('MODEL move blocked by obstacle');
    }
    this.moves += 1;
    this.notify('STATE_CHANGE');
  }

  turn(turnDirection) {
    if (turnDirection !== 'left' && turnDirection !== 'right') {
      this.log('MODEL ignoring invalid turn', turnDirection);
      return;
    }

    this.log('MODEL executing turn()');

    switch (this.robot.dir) {
      case 'up':
        this.robot.dir = turnDirection === 'left' ? 'left' : 'right';
        break;
      case 'down':
        this.robot.dir = turnDirection === 'left' ? 'right' : 'left';
        break;
      case 'left':
        this.robot.dir = turnDirection === 'left' ? 'down' : 'up';
        break;
      case 'right':
        this.robot.dir = turnDirection === 'left' ? 'up' : 'down';
        break;
    }

    this.turns += 1;
    this.notify('STATE_CHANGE');
  }

  pickUp() {
    const [x, y] = this.getNewPosition();
    if (this.board[y][x] === 'K') {
      this.pickedUpKey = true;
      this.board[y][x] = '.';
      this.log('CONTROLLER picked up key');
      this.notify('STATE_CHANGE');
    }
  }

  unlock() {
    const [x, y] = this.getNewPosition();
    if (this.board[y][x] === 'L') {
      if (this.pickedUpKey) {
        this.board[y][x] = '.';
        this.notify('STATE_CHANGE');
      } else {
        this.log('MODEL cannot UNLOCK: have no key');
      }
    }
  }

  getNewPosition() {
    const { x, y } = this.robot;
    let [newX, newY] = [x, y];

    switch (this.robot.dir) {
      case 'up':
        newY = Math.min(this.board.length - 1, y + 1);
        break;
      case 'down':
        newY = Math.max(0, y - 1);
        break;
      case 'left':
        newX = Math.max(0, x - 1);
        break;
      case 'right':
        newX = Math.min(this.board[y].length - 1, x + 1);
        break;
    }

    return [newX, newY];
  }
}
