/**
 * inetRC 
 * github.com/yas-nyan/inetRC
 * 
 * node -v 5.6.0~
 * 
 * 
 * start option
 * 
 */
"use strict";


/**
 * npm dependences
 */

const socketio = require('socket.io');
const http = require('http');
const express = require('express');
const dgram = require("dgram");
const fs = require('fs');
const ip = require('ip');

/**
 * original dependences
 */
const Drive = require("./lib/Drive"),
      drive = new Drive();

/**
 * InetRC クラス 
 */



class InetRC {

    //コンストラクターの初期値設定は、example下の実行ファイルに載せる。
    //その時にenv.json的な物をinitするやつも作る。

    constructor(mode, nettype, host, port, device, logpath) {
        //mode means controler type. default  : web
        this.mode = mode || "web";
        //nettype means network type. default : socketio
        this.nettype = nettype || "socketio";
        //host is server(raspi)'s host name. default : ip.address() (your default address.)
        this.host = host || ip.address();
        //port is server(raspi)'s port number. default : 8080
        this.port = port || 8080;

        //device is drive type. default:servo
        this.device = device || "servo";
        this.controler = new Drive();

        //Server
        this.app = express();
        this.server = http.createServer(this.app);

        //ログデータのパス
        this.logpath = logpath;

        // host.jsonを作成・書き換えをする。
        fs.writeFileSync( `${___dirname}/public/js/host.json`, JSON.stringify({ host: this.host, ip: this.ip }));


    }

    listen() {
        // HTTPサーバーを立てる
        this.server.listen(this.port);
        console.log(`HTTP server is listening ${this.host}:${this.port}`);


        switch (this.mode) {
            case "web":
                //web操作の場合、
                if (this.nettype !== "socketio") {
                    console.error("web mode is using socketio only.");
                    process.exit();
                    break;
                }
                let app = this.app;
                app.use(express.static(`${___dirname}/public`));
                app.get('/', function (req, res) {
                    res.sendfile(`${___dirname}/public/index.html`);
                });
                /*
                app.use('/public/css', express.static('/public/css'));
                app.use('/public/js', express.static('/public/js'));
                */
                console.log("web mode! ");
                this.socketioListen();
                break;
            case "ps3":
                console.log("ps3 mode! ");
                //socketioの場合,
                this.socketioListen();

        }

    }


    socketioListen() {
        //socketioを開く
        let io = socketio.listen(this.server);
        //子の関数の中でthis内のものを使いたいので、ここで変数に入れておく。
        let controler = this.controler;
        // 接続確立後の通信処理部分を定義
        io.sockets.on('connection', function (socket) {
           //ここのthisはsocketioのthisになってしまう。

            // クライアントからサーバーへ メッセージ送信ハンドラ
            socket.on('steer', function (data) {
                /**
                 * res  = {
                 *  TIME :【UNIXTIME msec】,
                 *  AXEL :【AXEL STATUS】,
                 *  STEER :【STEER STATUS】
                 * }
                 */
                
                let res = controler.steer(data);
                // サーバーからクライアントへ メッセージを送り返し
                io.sockets.emit('steer', res.steer);

                //ログデータを書き出し。
                //あとでやる
            });

            // クライアントからサーバーへ メッセージ送信ハンドラ
            socket.on('axel', function (data) {
                console.log(typeof controler.axel());
                let res = controler.axel(data);
                /**
                 * res  = {
                 *  TIME :【UNIXTIME msec】,
                 *  AXEL :【AXEL STATUS】,
                 *  STEER :【STEER STATUS】
                 * }
                 */
                // サーバーからクライアントへ メッセージを送り返し
                io.sockets.emit('axel', res.axel);

                //ログデータを書き出し。
                //あとでやる

            });
        });
        console.log("socketio server  is listening");
    }

    udpListen() {
        //udpsocketを開く。
        let socket = dgram.createSocket("udp4");
        //子の関数の中でthis内のものを使いたいので、ここで変数に入れておく。
        let controler = this.controler;
        //待ち受ける
        socket.bind(this.port, this.host);
        //受信状態になる
        socket.on("listening", function () {
            let address = socket.address();
            console.log("udp socket is listening " +
                address.address + ":" + address.port);
        });



        //エラー処理　UDP周りでエラーが起きたらこれ
        socket.on("error", function (err) {
            console.log("server error:\n" + err.stack);
            socket.close();
        });



        //受信処理　commandが来たらコレ
        //msgにはバッファ化された配列が入るはず。
        socket.on("message", function (msg, rinfo) {
            /**
            * msg = [key,value]
            * keyはsteer or axel 
            */
            let res = {};
            switch (msg[0]) {
                case "steer":
                    res = controler.axel(msg[1]);
                    break;
                case "axel":
                    res = controler.steer(msg[1]);
                    break;
            }
            //ログデータを書き出し。
            //あとでやる

        })



    }


}

module.exports = InetRC;