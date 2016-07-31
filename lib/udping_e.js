/**
 *　UDPINGのノードをスタートする。
 *  inetRC用に改造した。
 */
"use strict";
/**
 * npm dependences
 */
const ip = require("ip");
/**
 * lib dependences
 * 
 */
const _Client = require("udping/lib/cl.js");
const _Server = require("udping/lib/sv.js");
const Drive = require("./Drive"),
      controler = new Drive();

/**
 * 
 * env options.
 */
const _env = {
    //サーバーorクライアント クライアントが初期値。
    mode:  "client",
    //サーバーのホストネーム IP 
    host: "localhost",
    port: 55555,
    execTIme: new Date().getTime(),
    savepath: "./udping_result.txt",
    //何ミリ秒おきに送るか タイムアウト時間はその二倍
    wait: 1000
}



class Udping {
    constructor(env) {
        //引数がない場合、グローバルのenvが入る。
        this.env = env || _env;
        //はじめに、クライアントかサーバーかをはっきりさせる。
        switch (this.env.mode) {
            case "client":
                this.client = new Client(this.env.host, this.env.port, this.env.wait, this.env.savepath, this.env.time);
                console.log("Client start!");
                break;
            case "server":
                this.server = new Server(this.env.host, this.env.port, this.env.wait * 1.5);
                console.log("Server start!");
                break;
            default:
                console.log("Invailed process.env.mode. server or client");
                process.exit(1);
                break;
        }
    }
}

class Client extends _Client {

}

class Server extends _Server {
    constructor (host, port, wait){
        super(host, port, wait);
    }
    //タイムアウト時のメソッドを無理やり改造する。
    //操作をするインスタンスが別のやつなので多分本当は良くない。
    TIMEOUT (){
        super.TIMEOUT();
        controler.stop();
        console.log(" Emergency stop");
    }
    
}

module.exports = Udping;




