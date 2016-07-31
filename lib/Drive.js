/**
 * 
 * servo or mortor?
 * 
 * ここで操作ログを作成し、返す。
 * 
 */
"use strict";

const Servo = require("./Servo");

class Drive {
    constructor (engine){
        //今後動力系を選択可能に出来るように作る。
        this.engine = new Servo();
        //初期値をセット。
        this.status = {
            axel:0,
            steer:0
        }
        //何もしなくても100msに一度ログを取る。必要はあるのか？保留。
    }



    axel (value){
        this.engine.send(2,value);
        //今の時間と操作の内容を記録して返す。
        let time = new Date().now;
        //現在の状況を後進。
        this.status.axel = value;
        
        return makeResult(this.status);
    }

    steer (value){
        //駆動系に命令を送る。
        this.engine.send(1,value);
        //現在の状況を後進。
        this.status.steer = value;

        //結果を作成して返す。
        return makeResult(this.status);

    }
    
    stop(){
        //止める。
        console.log(this);
        this.engine.send(1,150);
        this.engine.send(2,150);
        //現在の状況を後進。
        this.status.steer = 150;
        this.status.axel = 150;

        return makeResult(this.status);

    }

}
function makeResult (status){
    //結果を作る。
    //時間を取得。
    let time = new Date().now;
    status.TIME = time;

    return status;
}

module.exports = Drive;