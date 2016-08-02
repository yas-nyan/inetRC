/**
 * 
 * 読み込んだJSONから走行するやつ
 */

const Client = require("./lib/client");
const fs = require("fs");
const programdata = fs.readFileSync("")

/**
 * 
 * 
 */



const client = new Client (env.mode,env.nettype,env.s_host,env.s_port);

client.stanby();

