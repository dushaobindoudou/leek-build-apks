/*
 * File: wsServer.js
 * Project: leek-auto-build
 * File Created: 2018-11-23 4:08:12 pm
 * Author: dushaobin (dushaobin@youxin.com)
 * -----
 * Last Modified: 2018-11-23 5:33:14 pm
 * Modified By: dushaobin (dushaobin@youxin.com>)
 * -----
 * Copyright (c) renrendai 2018
 */

const autoRun = require('./autoRun');

let wsListener = null;

// 想主线发送消息
function sendMsgToMainThread(type, data) {
    process.send({
        from: 'ws server',
        type: type,
        data: data,
    });
}

process.on('message', (msg) => {
    if (!msg) {
        return;
    }
    switch (msg.type) {
    case 'buildSucc':
        wsListener && wsListener(msg);
        break;
    default:
        console.log('main process msg:', msg.data);
    }
    console.log('message from parent: ' + JSON.stringify(msg));
});

autoRun.init((ws) => {
    sendMsgToMainThread('start', {
        isSuccess: true,
    });

    wsListener = (msg) => {
        ws.send(JSON.stringify(msg));
    };
});
