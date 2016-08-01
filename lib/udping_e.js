/**
 *　UDPINGのノードをスタートする。
 *  inetRC用に改造した。
 */
"use strict";
/**
 * npm dependences
 */
const ip = require("ip");
const fs = require("fs");
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
    mode: "client",
    //サーバーのホストネーム IP 
    host: "localhost",
    port: 55555,
    execTIme: new Date().getTime(),
    savepath: "./udping_result.txt",
    //何ミリ秒おきに送るか タイムアウト時間はその二倍
    wait: 1000,
    //走行ログデータを書き換えるパス
    logpath: "./inetRC_result.txt"
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
                this.server = new Server(this.env.host, this.env.port, this.env.wait * 1.5, this.env.logpath);
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
    constructor(host, port, wait, logpath) {
        super(host, port, wait);
        //走行ログデータを入れるパス
        this.logpath = logpath;
        //タイマーに引数として与えておく。
        //TIMEOUTを検知するタイマー タイムアウトは1500ミリ秒で検知する。
        //console.log(this.logpath);
        this.timeoutCheck = setInterval(this.TIMEOUT, this.wait, this.logpath);
    }
    //タイムアウト時のメソッドを無理やり改造する。
    //操作をするインスタンスが別のやつなので多分本当は良くない。
    TIMEOUT(logpath) {
        super.TIMEOUT();

        let res = controler.stop();
        let logtext = `[INETRC]  ${Date.now()} !!EMAGENCY STOP!! STEER: ${res.steer} AXEL: ${res.axel}`;
        console.log(logtext);
        //なぜかパスが上手く渡せない。
        fs.appendFile(`./err_${Date.now()}.txt`, `${logtext}\n`);
    }

    returnMsg(msg, rinfo) {
        //関数内でクラスを参照するために変数に入れる。
        let thisserver = this;
        //クライアントにメッセージをそのまま返す
        thisserver.socket.send(msg, 0, msg.length, rinfo.port, rinfo.address, function (err, bytes) {
            if (err) throw err;
            //console.log('RETURN MSG TO : ' + rinfo.address + ':' + rinfo.port);
        });
        //返したのでタイマースタート
        this.timeoutCheck = setInterval(this.TIMEOUT, this.wait, this.logpath);

    }

}

module.exports = Udping;




