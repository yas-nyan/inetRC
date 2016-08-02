/**
 * 
 * クライアント側にターミナルを叩く場合に使う。
 */

"use strict";


/**
 * npm dependences
 */

const ioClient = require("socket.io-client");
const dgram = require("dgram");
const fs = require('fs');
const ip = require('ip');
const Udping = require("./udping_e");


class Client {
    constructor(mode, nettype, host, port, wait) {
        //コントローラーのモード 基本的にはPS3。  default:ps3
        this.mode = mode || "ps3";
        //udp or socketio default:socketio
        this.nettype = nettype || "socketio";
        //サーバー側のhost default:ip.address()
        this.s_host = host || ip.address();
        //サーバー側のport default:8080;
        this.s_port = port || 8080;

        //つながった後の接続インスタンスを入れる変数。
        this.socket;

        

        //Udpingのクライアントを開く。
        this.udping = new Udping({
            //サーバーorクライアント クライアントが初期値。
            mode: "client",
            //サーバーのホストネーム IP 
            host: this.s_host,
            port: 55555,
            execTIme: new Date().getTime(),
            savepath: `./${this.execTIme}udping_result.txt`,
            //何ミリ秒おきに送るか。
            wait: wait || 1000
        });
    }

    stanby() {
        switch (this.nettype) {
            case "socketio":
                this.socketioConnect();
                console.log(`[INETRC] ${Date.now()} socketio stanby...`);
                break;
            case "udp":
                this.udpConnect();
                console.log(`[INETRC] ${Date.now()} UDP stanby...`);
                break;
        }
    }

    send(type, value) {
        //typeはaxelかsteer。
        //接続方法を見て判断。
        switch (this.nettype) {
            case "socketio":
                this.socket.emit(type, value);
                console.log(`[INETRC] ${Date.now()} MESSAGE SENT TO CAR.  TYPE: ${type} =  ${value}`);
                break;
            case "udp":
                let position = [0, value];
                //typeから、Buffer用の文字を作成。
                switch (type) {
                    case "steer":
                        position[0] = 1;
                        break;
                    case "axel":
                        position[0] = 2;
                        break;
                }

                let buffer = new Buffer(position, "utf-8");
                //console.log(this.s_host + ":" + this.s_port)
                this.socket.send(buffer, 0, buffer.length, this.s_port, this.s_host, function (err, bytes) {
                    if (err) throw err;
                    console.log(`[INETRC] ${Date.now()} MESSAGE SENT TO CAR.  TYPE: ${type} =   ${value}`);
                });
                break;
        }


    }

    socketioConnect() {
        //httpsだったら書き換えてくれｗ

        //コールバックではthisの値が変わるので、hostとportを変数に入れる。
        let host = this.s_host;
        let port = this.s_port;
        //接続を開始する。
        this.socket = ioClient(`http://${host}:${port}`);
        this.socket.on("connect", function () {
            console.log(`[INETRC] ${Date.now()} socketio success to http://${host}:${port}`);
        });

        this.socket.on("disconnect", function () {
            console.log(`[INETRC] ${Date.now()} socketio disconnect....`);
        });

    }

    udpConnect() {
        //UDPソケットを繋ぐ。
        let socket = dgram.createSocket("udp4");

        socket.bind(0, ip.address());
        
        /*
        //受信状態になる
        socket.on("listening", function () {
            var address = socket.address();
            console.log(`Open connenction : http://${address.address}:${address.port}`);
        });
        */

        //エラー処理　UDP周りでエラーが起きたらこれ
        socket.on("error", function (err) {
            console.log(`[INETRC] ${Date.now()} server error:\n  err.stack`);
        });

        //クラス上部にプール
        this.socket = socket;
    }
}

module.exports = Client;