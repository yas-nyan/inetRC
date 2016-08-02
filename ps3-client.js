/**
 * 
 * 
 * PS3のコントローラーを接続する。
 */
"use strict";
/**
 * npm depences
 */
const ip = require("ip");
const GamePad = require('node-gamepad');
const controller = new GamePad('ps3/dualshock3', {
    vendorID: 1356,
    productID: 616
});


/**
 * lib/
 */
const Client = require("./lib/client");


/**
 * setting 
 * */
const env = {
    mode:"ps3",
    nettype:process.env.nettype || "socketio",
    s_host:process.env.s_host || ip.address(),
    s_port:process.env.s_port || "8080",
    setting:{
        steer:150,
        axel:146
    },
    axelstatus: "stop",
    wait : process.env.wait || 1000
}


const client = new Client (env.mode,env.nettype,env.s_host,env.s_port,env.wait);

//通信を開始する。
client.stanby();
controller.connect();



//bindする。
controller.on('right:move', function (x, y) {
    //x.yの0~255のデータを100~200のデータに変換して、切り捨て。
    let data = Math.floor(x.y * 100 / 255 + 100);

    if (data < 150) {
        env.axelstatus = "forward";
        //console.log(env.axelstatus);
    } else if (data > 159) {
        env.axelstatus = "back";
        //console.log(env.axelstatus);
    } else {
        env.axelstatus = "stop";
        //console.log(env.axelstatus);
    }
    client.send("axel",data);
    //console.log("R/ X:" + x.x + "Y:" + x.y);
});

controller.on('left:move', function (x, y) {
    //x.yの0~255のデータを100~200のデータに変換して、切り捨て。
    let data = Math.floor(x.x * 100 / 255 + (env.setting.steer - 50));
    //console.log(data);
    client.send("steer",data);
    //console.log("R/ X:" + x.x + "Y:" + x.y);
});

//ボタン操作をbind
controller.on('square:press', brake);
controller.on('x:press', axel);
controller.on('circle:press', back);

//トリム調整をバインド
controller.on("dpadUp:press",axelUp);
controller.on("dpadDown:press",axelDown);
controller.on("dpadRight:press",steerRight);
controller.on("dpadLeft:press",steerLeft);

//UDPINGの通信を切断する(実験用)
controller.on("select:press",cutUDPING);

function brake() {
    if (env.axelstatus == "forward") {
        client.send("axel", 200);
    } else {
        client.send("axel", 150);
    }
    env.axelstatus = "stop";
    //console.log(env.axelstatus);
}


function axel() {
    client.send("axel", env.setting.axel);
    env.axelstatus = 'forward';
    //console.log(env.axelstatus);
}

function back() {
    if (env.axelstatus == "forward") {
        brake();
    }
    client.send("axel", 150);
    client.send("axel", 159);
    client.send("axel", 159);
    client.send("axel", 160);
    client.send("axel", 162);
    env.axelstatus = "back";
    //console.log(env.axelstatus);
}


//アクセル開度を変更します。
function axelDown () {
    //1だけ上げます。(バックより)
    env.setting.axel++;
    console.log("NEUTRAL_AXEL:" + env.setting.axel);
}

//アクセル開度を変更します。
function axelUp () {
    //1だけ上げます。(前進より)
    env.setting.axel--;
    console.log("NEUTRAL_AXEL:" + env.setting.axel);
}

//トリムを変更します。
function steerLeft () {
    //1だけ下げます(左より)
    env.setting.steer--;
    console.log("NEUTRAL_STEER:" + env.setting.steer);
}

//トリムを変更します。
function steerRight () {
    //1だけ上げます。(右より)
    env.setting.steer++;
    console.log("NEUTRAL_STEER:" + env.setting.steer);
}

//UDPINGの通信をカットします（デバッグ用）
function cutUDPING (){
    client.udping.client.stop();
    console.log(`[UDPING] ${Date.now()} cut connection`);
}
