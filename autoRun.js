
const ReconnectWebSocket = require('reconnect-websocket');
const utils = require('./utils');

/**
 * 获取可用的ws 链接实例，如果链接不可用，
 */
function getStatbleWSC() {
    const conf = utils.getConfigInfo();
    if (!conf || !conf.websocketServer) {
        return null;
    }
    return new ReconnectWebSocket(conf.websocketServer, null, {
        reconnectAttempt: true,
        maxReconnectAttempts: 30000,
    });
}

function createWSC(onOpen, onMsg, onError, onClose) {
    const ws = getStatbleWSC();

    if (!ws) {
        console.log('创建 websocket 客户端失败，可能是没有配置websocket 服务地址');
        return null;
    }

    ws.on('open', () => {
        ws.send('client is connected success');
        onOpen && onOpen(ws);
    });

    ws.on('message', (evt) => {
        console.log('message from server:', evt.data);
        onMsg && onMsg(ws, evt.data);
    });

    ws.on('error', (evt) => {
        console.log('ws error:', evt.data);
        onError && onError(ws, evt.data);
    });

    ws.on('close', (evt) => {
        console.log('ws close:', evt.data);
        onClose && onClose(ws, evt.data);
    });

    return ws;
}

function getTaskList() {
    return utils.getBuildLog();
}

function sendMsg(ws, msg) {
    ws.send(JSON.stringify(msg));
}

module.exports = {
    init: (ready) => {
        const wss = createWSC((ws) => {
            console.log('ws client start success');
            utils.addListener('buildSucc', (msg) => {
                console.log('成功构建：', msg);
                ws.send(JSON.stringify({
                    type: 'buildSucc',
                    curr: msg,
                    full: getTaskList(),
                }));
            });
            console.log('websocket client start successed！');
            if (ready) {
                ready(ws);
            }
        }, (ws, msg) => {
            try {
                if (!msg) {
                    return;
                }
                console.log('from server:', msg);
                const msgO = JSON.parse(msg);
                console.log('ws server msg:', msgO);
                switch (msgO.type) {
                case 'install':
                    const res = utils.installApk(msgO.deviceId, msgO.apkPath);
                    sendMsg(ws, {
                        type: 'install',
                        data: res,
                    });
                    break;
                case 'startEmulator':
                    utils.startEmulatorAsync(msgO.avdName);
                    sendMsg(ws, {
                        type: 'startEmulator',
                        data: 'start emulator is runing, please use emulatorList checkout emulator start successful',
                    });
                    break;
                case 'uninstall':
                    const resUn = utils.uninstallApk(msgO.deviceId, msgO.packageName);
                    sendMsg(ws, {
                        type: 'uninstall',
                        data: resUn,
                    });
                    break;
                case 'openActivity':
                    const resOA = utils.openActivity(msgO.deviceId, msgO.activity);
                    sendMsg(ws, {
                        type: 'openActivity',
                        data: resOA,
                    });
                    break;
                case 'stopApp':
                    const resSA = utils.stopApp(msgO.deviceId, msgO.packageName);
                    sendMsg(ws, {
                        type: 'stopApp',
                        data: resSA,
                    });
                    break;
                case 'grandPermission':
                    const resGP = utils.grantPermission(msgO.deviceId, msgO.packageName, msgO.permission);
                    sendMsg(ws, {
                        type: 'grandPermission',
                        data: resGP,
                    });
                    break;
                case 'deviceList':
                    sendMsg(ws, {
                        type: 'deviceList',
                        data: utils.getDevicesList(),
                    });
                    break;
                case 'emulatorList':
                    sendMsg(ws, {
                        type: 'emulatorList',
                        data: utils.getEmulatorList(),
                    });
                    break;
                case 'clientEnv':
                    sendMsg(ws, {
                        type: 'clientEnv',
                        data: utils.checkSdkEnv(),
                    });
                    break;
                default:
                    console.log('wss 消息没有对应的指令：', msgO);
                }
            } catch (err) {
                console.log('parser server msg:', err);
            }
        }, (err) => {
            console.log('ws client error', err);
        }, () => {
            console.log('ws client is closed!');
        });
    },
};
