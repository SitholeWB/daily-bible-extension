class MockEventEmitter {
  constructor() {
    this.listeners = [];
  }
  get event() {
    return (listener) => {
      this.listeners.push(listener);
      return { dispose: () => {} };
    };
  }
  fire(data) {
    for (const l of this.listeners) {
      l(data);
    }
  }
}

const mockVscode = {
  EventEmitter: MockEventEmitter,
  window: {},
  workspace: {},
  commands: {},
  env: {}
};

// Register in module cache so `require('vscode')` resolves to mockVscode
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (path) {
  if (path === 'vscode') {
    return mockVscode;
  }
  return originalRequire.apply(this, arguments);
};

