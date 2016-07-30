const InetRC = require("./index");

var mode = process.env.mode;
var nettype = process.env.nettype;
var host = process.env.host;
var port = process.env.device;
var logpath = process.env.logpath;

var inetRC = new InetRC(mode,nettype,host,port,logpath);
inetRC.listen();
