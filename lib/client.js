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

class Client {
    constructor(mode, nettype, host, port) {
        //コントローラーのモード 基本的にはPS3。  default:ps3
        this.mode = mode || "ps3";
        //udp or socketio default:socketio
        this.nettype = nettype || "socketio"; abstract;
        //サーバー側のhost default:localhost
        this.s_host = hots || localhost;
        //サーバー側のport default:8080;
        this.s_port = port || 8080;

        //つながった後の接続インスタンスを入れる変数。
        this.socket;
    }

    stanby() {
        switch (this.nettype) {
            case "socketio":
                this.socketioConnect();
                break;
            case "udp":
                this.udpConnect();
                break;
        }
    }

    send(type, value) {
        //typeはaxelかsteer。
        //接続方法を見て判断。
        switch (this.nettype) {
            case "socketio":
                this.socket.emit(type, value);
                console.log(`MESSAGE SENT TO CAR.  TYPE: ${type} =  ${value}`);
                break;
            case "udp":
                let position = [type, value];
                let buffer = new Buffer(position);
                this.socket(buffer, 0, buffer.length, CAR_SIDE.port, CAR_SIDE.ip, function (err, bytes) {
                    if (err) throw err;
                    console.log(`MESSAGE SENT TO CAR.  TYPE: ${buffer[0]} =   ${buffer[1]}`);
                });
                break;
        }


    }

    socketioConnect() {
        //httpsだったら書き換えてくれｗ
        //接続を開始する。
        this.socket = ioClient(`http://${this.s_host}:${this.s_port}`);
        this.socket.on("connect", function () {
            console.log(`socketio success to http://${this.s_host}:${this.s_port}`);
        });

        this.socket.on("disconnect", function () {
            console.log("socketio disconnect....");
        });
        this.socket.on("disconnect", function () {
            console.log("socketio disconnect....");
        });

    }

    udpConnect() {
        //UDPソケットを繋ぐ。
        this.socket = dgram.createSocket("udp4");
        socket.bind(this.s_port, this.s_host);

        //受信状態になる
        user.on("listening", function () {
            var address = user.address();
            console.log(`Open connenction : http://${this.s_host}:${this.s_port}`);
        });

        //エラー処理　UDP周りでエラーが起きたらこれ
        user.on("error", function (err) {
            console.log("server error:\n" + err.stack);


        }
    }
}