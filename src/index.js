'use strict';

const $ = require('jquery');
const _ = require('underscore');
const nx = require('notatrix');

const GUI = require('./gui');
const Graph = require('./graph');
const Log = require('./browser-logger');
const Manager = require('./manager');
const Server = require('./server');

const cfg = require('./config')
const errors = require('./errors');
const funcs = require('./funcs');

// on ready
$(() => {

	funcs.global().log = new Log(cfg.defaultLoggingLevel);
	funcs.global().server = new Server();
	funcs.global().manager = new Manager();

	manager.parse(require('./test/data/conllu').from_cg3_with_spans);

});

module.exports = {
	nx,
	errors,
	Log
};
