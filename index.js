/*
 * File: index.js
 * Project: leek-auto-build
 * File Created: 2018-10-30 5:48:52 pm
 * Author: dushaobin (dushaobin@youxin.com)
 * -----
 * Last Modified: 2018-11-01 3:39:30 pm
 * Modified By: dushaobin (dushaobin@youxin.com>)
 * -----
 * Copyright (c) renrendai 2018
 */

const path = require('path');
const childProcess = require('child_process');

const utils = require('./utils');
const confInfo = utils.getConfigInfo();

/**
 * 检查环境
 */
if (!confInfo) {
    console.log('获取配置信息失败，请在当前目录创建配置文件');
    return;
}

// 使用新线程开启 ws server

const lab = {
    /**
     * 开始构建apk
     * @param {string} 构建参数
     */
    start: (params) => {
        const wsServer = childProcess.fork(path.join(__dirname, './wsServer.js'));

        wsServer.on('message', (msg) => {
            if (!msg) {
                return;
            }
            switch (msg.type) {
            case 'start':
                console.log('ws server is running');
                break;
            default:
                console.log('ws server subprocess msg:', msg.type, msg.data);
            }
            console.log('weServer subprocess:', JSON.stringify(msg));
        });

        utils.addListener('buildSucc', (msg) => {
            console.log('成功构建：', msg);
            wsServer.send({
                type: 'buildSucc',
                curr: msg,
                full: utils.getBuildLog(),
            });
        });

        // 3秒后开始执行打包，这里无所谓了，仅仅单纯的想延迟执行
        setTimeout(() => {
            utils.run(params);
        }, 3000);
    },
};

// lab.start();

module.exports = lab;

// wsServer.send({from: 'parent'});

// utils.startEmulatorAsync('Nexus_5X_API_26');

// utils.installApk('emulator-5554', '/Users/rrd/rrd-project/rrdfinance/finance/app/build/outputs/apk/prod/debug/app-prod-debug.apk');

// utils.uninstallApk('emulator-5554', 'com.renrendai.finance');

// console.log(utils.openActivity('emulator-5554', 'com.renrendai.finance/.activity.SplashActivity'));

// utils.stopApp('emulator-5554', 'com.renrendai.finance');

// android.permission.READ_PHONE_STATE

// utils.grantPermission('emulator-5554', 'com.renrendai.finance', 'android.permission.READ_PHONE_STATE');

// console.log(utils.getBeforeBuildScripts());

// utils.checkAdb();

// console.log('获取要构建的react native版本...');
// const rnVersions = utils.getVersionList('react-native');
// const avlVers = utils.filterVersion(confInfo.reactNativeRange, rnVersions);
// console.log('版本列表：', avlVers, avlVers.length);
// avlVers.forEach((v) => {
//     console.log('开始构建react native版本：', v);
//     utils.initProject(v);
//     utils.installDep(projectName, v);
//     utils.startBuild(projectName, confInfo.platform);
//     utils.finishBuild(projectName, confInfo.platform, v);
// });

// const files = utils.filterApk('./dist/', 'apk');
// console.log(files);

// utils.initProject('0.50.0');

// utils.installDep(projectName, '0.50.0');

// utils.startBuild(projectName, 'android');

// utils.finishBuild(projectName, 'android', '0.50.0');
