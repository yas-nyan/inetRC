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
const Udping = require('./lib/udping_e');

/**
 * original dependences
 */
const Drive = require("./lib/Drive");

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
        this.logpath = logpath || `./${Date.now()}inetRC_result.txt`;
        //書き込みをオープンする
        fs.writeFileSync(this.logpath, `${Date.now()}\n`, "utf8");

        //もしPS3モード以外なら、
        if (this.mode !== "web") {
            //Udpingのサーバーをスタートさせる。
            this.udping = new Udping({
                //サーバーorクライアント クライアントが初期値。
                mode: "server",
                //サーバーのホストネーム IP 
                host: this.host,
                port: 55555,
                execTIme: new Date().getTime(),
                savepath: `./${Date.now()}udping_result.txt`,
                //何ミリ秒おきに送るか タイムアウト時間はその二倍
                wait: 1000,
                //走行ログデータのパス
                logpath:this.logpath
            });
            //udpingのタイムアウト確認はここで行う。
            //this.emergencyStop();
            //this.udping.server.timeoutCheck = setInterval(this.controler.stop,5000);
        }

        

        // host.jsonを作成・書き換えをする。
        fs.writeFileSync(`${__dirname}/public/js/host.json`, JSON.stringify({ host: this.host, ip: this.ip }));


    }

    listen() {

        switch (this.mode) {
            case "web":
                //web操作の場合、
                if (this.nettype !== "socketio") {
                    console.error("[ERR] web mode is using socketio only.");
                    process.exit();
                    break;
                }
                let app = this.app;
                app.use(express.static(`${__dirname}/public`));
                app.get('/', function (req, res) {
                    res.sendfile(`${__dirname}/public/index.html`);
                });
                console.log(`[INETRC] ${Date.now()}  web mode! `);
                fs.appendFile(this.logpath, `[INETRC] web mode! \n`);

                // HTTPサーバーを立てる
                this.server.listen(this.port);
                let logtext = `[INETRC] ${Date.now()}  HTTP server is listening ${this.host}:${this.port}`
                console.log(logtext);
                fs.appendFile(this.logpath, `${logtext}\n`);
                this.socketioListen();
                break;
            case "ps3":
                console.log(`[INETRC] ${Date.now()}  ps3 mode! `);
                //socketioの場合,UDPとwebsocketが選択可能。
                switch (this.nettype) {
                    case "socketio":
                        // HTTPサーバーを立てる
                        this.server.listen(this.port);
                        let logtext = `[INETRC] ${Date.now()}  HTTP server is listening ${this.host}:${this.port}`;
                        console.log(logtext);
                        fs.appendFile(this.logpath, `${logtext}\n`);

                        this.socketioListen();
                        break;
                    case "udp":
                        this.udpListen();
                        break;

                }

        }

    }


    socketioListen() {
        //socketioを開く
        let io = socketio.listen(this.server);
        //子の関数の中でthis内のものを使いたいので、ここで変数に入れておく。
        let controler = this.controler;
        let logpath = this.logpath;
        // 接続確立後の通信処理部分を定義
        io.sockets.on('connection', function (socket) {
            //ここのthisはsocketioのthisになってしまう。

            // クライアントからサーバーへ メッセージ送信イベント
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
                let logtext = `[INETRC] ${Date.now()} STEER: ${res.steer} AXEL: ${res.axel}`;
                console.log(logtext);
                fs.appendFile(logpath, `${logtext}\n`);


                //ログデータを書き出し。
                //あとでやる
            });

            // クライアントからサーバーへ メッセージ送信イベント
            socket.on('axel', function (data) {
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
                let logtext = `[INETRC] ${Date.now()} STEER: ${res.steer} AXEL: ${res.axel}`;
                console.log(logtext);
                fs.appendFile(logpath, `${logtext}\n`);

                //ログデータを書き出し。
                //あとでやる

            });
        });
        let logtext = `[INETRC] ${Date.now()}  socketio server is listening`;
        console.log(logtext);
        fs.appendFile(logpath, `${logtext}\n`);

    }

    udpListen() {
        //udpsocketを開く。
        let socket = dgram.createSocket("udp4");
        //子の関数の中でthis内のものを使いたいので、ここで変数に入れておく。
        let controler = this.controler;
        let logpath = this.logpath;
        //待ち受ける
        socket.bind(this.port, this.host);
        //受信状態になる
        socket.on("listening", function () {
            let address = socket.address();
            let logtext = `[INETRC] ${Date.now()} UDP socket is listening ${address.address}:${address.port}`
            console.log(logtext);
            fs.appendFile(logpath, `${logtext}\n`);
            
        });



        //エラー処理　UDP周りでエラーが起きたらこれ
        socket.on("error", function (err) {
            console.log("server error:\n" + err.stack);
            let logtext = `[INETRC] ${Date.now()}  server error:\n err.stack`
            console.log(logtext);
            fs.appendFile(this.logpath, `${logtext}\n`);
            socket.close();
        });



        //受信処理　commandが来たらコレ
        //msgにはバッファ化された配列が入るはず。
        socket.on("message", function (msg, rinfo) {
            /**
            * msg = [key,value]
            * keyは1,2のうちどちらか。
            1:steer,2:axel
            */
            let res = {};
            switch (msg[0]) {
                case 1:
                    res = controler.steer(msg[1]);
                    break;
                case 2:
                    res = controler.axel(msg[1]);
                    break;
                default:
                    console.log("invaild");
                    break;
            }
            //ログデータを書き出し。
            //あとでやる
            let logtext = `[INETRC] ${Date.now()} STEER: ${res.steer} AXEL: ${res.axel}`;
            console.log(logtext);
            fs.appendFile(logpath, `${logtext}\n`);

        })



    }

    emergencyStop(controler) {
        controler.axel(150);
        controler.steer(150);
        console.log("stop");
        let logtext = `[INETRC]  ${Date.now()} !!EMAGENCY STOP!! STEER: ${res.steer} AXEL: ${res.axel}`;
        console.log(logtext);
        fs.appendFile(logpath, `${logtext}\n`);

        /*
        //参照渡し。
        let udping = this.udping;
        console.log(udping);
        let controler = this.controler;
        let wait = udping.server.wait;
        

        setInterval(function () {
            console.log(udping.server.timeoutFlag);
            if (!udping.server.timeoutFlag) {
                //trueが来れば止める
                //安全に停止できる値ををthis.controlerに送る
                controler.axel(150);
                controler.steer(150);
                console.log("stop");

            } else {
                return;
            }

        }, wait);
        */
    }


}
module.exports = InetRC;