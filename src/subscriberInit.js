const debug = require('debug')('refocus-real-time:subscriber');
const redis = require('redis');
const conf = require('../conf/config');
const emitUtils = require('../util/emitUtils');
const emitter = require('./emitter');

module.exports = (io) => {
  conf.pubSubPerspectives
  .map(redis.createClient)
  .forEach((client) => {
    client.subscribe(conf.perspectiveChannel);
    client.on('message', emitMessage);
  });

  conf.pubSubBots
  .map(redis.createClient)
  .forEach((client) => {
    client.subscribe(conf.botChannel);
    client.on('message', emitMessage);
  });

  function emitMessage(channel, messageAsString) {
    const obj = JSON.parse(messageAsString);
    const key = Object.keys(obj)[0];
    const parsedObj = emitUtils.parseObject(obj[key], key);
    const { pubOpts } = parsedObj;

    // Deleting pubOpts from parsedObj before passing it to the emitter
    delete parsedObj.pubOpts;

    /*
     * pass on the message received through the redis subscriber to the socket
     * io emitter to send data to the browser clients.
     */
    emitter(io, key, parsedObj, pubOpts);
  }
};

