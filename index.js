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


const utils = require('./utils');
const autoRun = require('./autoRun');

const confInfo = utils.getConfigInfo();

/**
 * 检查环境
 */
if (!confInfo) {
    console.log('获取配置信息失败，请在当前目录创建配置文件');
    return;
}

// autoRun.init(() => {
//     utils.run();
// });

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
