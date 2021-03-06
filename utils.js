/*
 * File: util.js
 * Project: leek-auto-build
 * File Created: 2018-11-01 10:56:30 am
 * Author: dushaobin (dushaobin@youxin.com)
 * -----
 * Last Modified: 2018-11-01 11:20:55 am
 * Modified By: dushaobin (dushaobin@youxin.com>)
 * -----
 * Copyright (c) renrendai 2018
 */

const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');
const semver = require('semver');
const fse = require('fs-extra');
const glob = require('glob');

const execDir = process.cwd();
const configName = 'leek-auto-build.conf';

const buildLog = {
    currIndex: 0,
    taskList: [],
    task: {},
    error: {},
    success: {},
};

/**
 * 读取构建日志
 * @param {string} dist 构建日志的路径
 */
function readBuildLog(dist) {
    if (!fs.existsSync(dist)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(dist, { encoding: 'utf8', }));
}

/**
 * 保存构建任务
 * @param {string} dist 保存任务路径
 */
function writeBuildLog(dist) {
    if (!fs.existsSync(dist)) {
        fse.mkdirpSync(path.dirname(dist));
    }
    fse.writeFileSync(dist, JSON.stringify(buildLog, null, 4), { encoding: 'utf8', });
}

/**
 * 初始化任务列表
 * @param {arrary} versions 版本列表
 * @param {string} taskLogPath 任务日志路径
 */
function initTask(versions, taskLogPath) {
    if (Array.isArray(versions)) {
        buildLog.taskList = versions;
        versions.forEach((v) => {
            buildLog.task[v] = {};
        });
    }
    writeBuildLog(taskLogPath);
}
/**
 * 更新打包任务log
 * @param {string} taskIdx 当前的任务id
 * @param {string} v 当前构建的react native 版本号
 * @param {string} status 当前任务的状态
 * @param {string} taskLogPath 保存任务的路径
 * @param {object} res 任务附件信息
 */
function updateTask(taskIdx, v, status, taskLogPath, res) {
    if (taskIdx === undefined || !v) {
        return;
    }
    buildLog.currIndex = taskIdx;
    if (status === 'success') {
        buildLog[status][v] = Object.assign({}, buildLog[status][v], res || {});
    } else if (status === 'error') {
        buildLog[status][v] = Object.assign({}, buildLog[status][v], res || {});
    }
    writeBuildLog(taskLogPath);
}

const utils = {
    event: {
        buildSucc: [],
    },
    /**
     * 从npm获取相关包的版本列表
     * @param {string} packageName 包名
     * @return {array}
     */
    getVersionList(packageName) {
        if (!packageName) {
            return [];
        }
        const std = shelljs.exec(`npm view ${packageName} versions`, { silent: true, });
        if (!std.stdout) {
            return [];
        }
        const versionList = std.stdout.split(',');
        const purVersions = versionList.map((v) => {
            return v.replace(/\\| |'|\\n|\n|\[|\]/ig, '');
        });
        return purVersions;
    },

    /**
     *
     * 过滤可用版本
     *
     * @param {string} rule 规则
     * @param {array} versions 要过滤的版本列表
     *
     * @return {array}
     *
     */
    filterVersion(rule, versions) {
        if (!rule || !Array.isArray(versions)) {
            return [];
        }
        return versions.filter((v) => {
            if (!v || !semver.valid(v)) {
                return false;
            }
            if (semver.satisfies(semver.coerce(v), rule)) {
                return true;
            }
            return false;
        });
    },
    /**
     * 检查adb是否安装，如果没有安装则退出项目
     *
     * @return {bool}
     */
    checkAdb() {
        const std = shelljs.exec('adb', { silent: true, });
        if (std.stdout && std.stdout.indexOf('version') > -1 && std.stdout.indexOf('Android Debug Bridge' > -1)) {
            return true;
        }
        return false;
    },
    /**
     * 获取当前目录下所有的apk
     * @param {string} buildDist 要查找的目录
     * @param {string} type 文件类型
     * @return {array} 文件列表
     */
    filterApk(buildDist, type) {
        if (!buildDist) {
            return null;
        }
        const fileList = glob.sync(`**/**/*.${type}`, {
            cwd: buildDist,
            absolute: true,
        });
        return fileList;
    },
    /**
     * 检查react native cli是否安装
     * @return {bool}
     */
    checkRNCli() {
        const std = shelljs.exec('react-native -v');
        if (std.stdout.indexOf('react-native-cli') > -1) {
            return true;
        }
        return false;
    },
    /**
     * 初始化RN cli
     */
    initRNCli() {
        if (!this.checkRNCli()) {
            shelljs.exec('npm install react-native-cli -g');
        }
    },
    /**
     * 检查gradle是否安装
     * @return {bool}
     */
    checkGradle() {
        const std = shelljs.exec('gradle', { silent: true, });
        if (std.stdout && std.stdout.indexOf('Gradle') > -1) {
            return true;
        }
        return false;
    },
    /**
     * 获取project package.json
     * @param {string} projectName 项目名
     * @return {object}
     */
    getProjectPackage(projectName) {
        if (!projectName) {
            return null;
        }
        try {
            // readJSON
            // const std = shelljs.exec(path.join(__dirname,
            // `.${path.sep}project${path.sep}${projectName}${path.sep}package.json`));
            // eslint-disable-next-line global-require
            const pkgJSON = require(`./project/${projectName}/package.json`);
            return pkgJSON;
        } catch (e) {
            return null;
        }
    },
    /**
     * 初始化项目
     * @param {string} rnVersion react native 版本
     */
    initProject(rnVersion) {
        const confInfo = this.getConfigInfo();
        if (!confInfo) {
            console.log('获取配置信息失败，请在当前目录创建配置文件');
            return;
        }
        if (!rnVersion) {
            console.log('没有指定react native 版本');
            return;
        }
        // 初始化RN cli 
        // todo: 貌似可以优化 不用每次都使用命令行检测
        this.initRNCli();
        const projectRoot = path.join(__dirname, './project/');
        console.log('项目根目录：', projectRoot);
        // 清空文件夹
        fse.emptydirSync(projectRoot);
        shelljs.cd(projectRoot);
        shelljs.exec(`react-native init ${confInfo.appName} --version ${rnVersion}`);
    },
    /**
     * 安装指定版本的依赖
     * @param {string} projectName 项目名称
     * @param {string} rnVersion rn版本
     * @return {bool}
     */
    installDep(projectName, rnVersion) {
        if (!projectName || !rnVersion) {
            return false;
        }
        const confInfo = this.getConfigInfo();
        if (!confInfo) {
            console.log('获取配置信息失败，请在当前目录创建配置文件');
            return null;
        }
        shelljs.cd(execDir);
        // get project package.json
        const pkg = this.getProjectPackage(projectName);
        if (!pkg) {
            console.log('没有找到对应项目的package.json');
            return false;
        }
        if (pkg.dependencies) {
            pkg.dependencies = Object.assign({}, pkg.dependencies, confInfo.dependencies);
        }
        const pkgPath = path.join(path.join(__dirname, `.${path.sep}project${path.sep}${projectName}${path.sep}package.json`));
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4), { encoding: 'utf8', });
        console.log('依赖合并完成');
        shelljs.cd(`./project/${projectName}`);
        shelljs.exec('rm -rf ./node_modules');
        shelljs.exec('yarn install');
        console.log('依赖安装完成');
        return true;
    },
    /**
     * 获取构建之前执行的脚本
     * @return {object}
     */
    getBeforeBuildScripts() {
        const confInfo = this.getConfigInfo();
        if (!confInfo) {
            console.log('获取配置信息失败，请在当前目录创建配置文件');
            return null;
        }
        if (!confInfo.beforeBuildDir) {
            return null;
        }
        const beforeBuildScriptDir = path.join(execDir, confInfo.beforeBuildDir);
        const fileList = glob.sync('*.js', {
            absolute: true,
            cwd: beforeBuildScriptDir,
        });
        const scriptsConf = {};
        fileList.forEach((v) => {
            if (v) {
                scriptsConf[path.basename(v).replace(path.extname(v), '')] = v;
            }
        });
        return scriptsConf;
    },
    /**
     * 执行构建之前的脚本
     * @param {string} buildConf 构建脚本配置
     * @param {string} projectName 项目名称
     * @param {string} rnVersion 当前react native的版本
     */
    execBeforeBuild(buildConf, projectName, rnVersion) {
        if (!buildConf || !projectName || !rnVersion) {
            return;
        }
        Object.keys(buildConf).forEach((rule) => {
            if (!semver.satisfies(rnVersion, rule) || !buildConf[rule]) {
                return;
            }
            const projectRoot = path.join(__dirname, `./project/${projectName}`);
            shelljs.cd(execDir);
            const spath = buildConf[rule].replace(/(<|>| |=)/ig, ($1) => {
                return '\\' + $1;
            });
            console.log('执行脚本：', spath);
            const std = shelljs.exec(`${spath} ${projectRoot}`);
            if (std.code > 0) {
                throw new Error(std.stderr);
            }
        });
    },
    /**
     * 开始构建安装包
     * @param {string} projectName 项目名称
     * @param {string} platform(android)
     * @param {string} 当前构建的react native版本
     *
     */
    startBuild(projectName, platform, v, beforeBuildConf) {
        console.log('执行构建前脚本...');
        this.execBeforeBuild(beforeBuildConf, projectName, v);
        console.log('开始构建项目...');
        const projectRoot = path.join(__dirname, `./project/${projectName}/${platform}`);
        shelljs.cd(projectRoot);
        if (platform === 'android') {
            const std = shelljs.exec('./gradlew assembleRelease');
            if (std.code > 0) {
                throw new Error('构建失败:\n' + std.stderr);
            }
        }
        console.log('构建成功');
    },
    /**
     * 获取当前配置文件的路径
     * @return {string}
     */
    getConfPath() {
        const currDir = execDir;
        return path.join(currDir, configName);
    },
    /**
     * 检查配置文件
     * 配置文件名称是固定值，leek-auto-build.conf
     * @return {bool}
     */
    checkConfig() {
        const configPath = this.getConfPath();
        if (!fs.existsSync(configPath)) {
            return false;
        }
        return true;
    },
    /**
     * 获取默认的任务
     * @return {object}
     */
    getDefaultConf() {
        // eslint-disable-next-line global-require
        return require('./leek-auto-build-conf-default.json');
    },
    /**
     * 获取项目配置信息
     * return {object}
     */
    getConfigInfo() {
        if (!this.checkConfig()) {
            console.log('没有找到配置文件');
            return null;
        }
        const configPath = this.getConfPath();
        const customConf = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf8', }));
        const defaultConf = this.getDefaultConf();
        return Object.assign({}, defaultConf, customConf);
    },
    /**
     * 完成构建
     * @param {string} projectName 项目名
     * @param {string} platform 构建的平台
     * @param {string} rnVersion 需要构建的react native版本
     * @param {string} idx 当前打包的索引
     * @return
     */
    finishBuild(projectName, platform, rnVersion, idx, taskLogPath) {
        const confInfo = this.getConfigInfo();
        if (!projectName) {
            console.log('没有指定项目名称');
            return;
        }
        if (!confInfo) {
            console.log('获取配置信息失败，请在当前目录创建配置文件');
            return;
        }
        if (!rnVersion) {
            console.log('没有指定react native版本');
            return;
        }
        const currDir = execDir;
        const dist = path.join(currDir, confInfo.dist, rnVersion);
        let buildDist = null;
        if (platform === 'android') {
            buildDist = path.join(__dirname, `./project/${projectName}/${platform}/app/build/outputs/apk/`);
        } else {
            throw new Error('暂时不支持该平台：' + platform);
        }
        if (fs.existsSync(dist)) {
            fse.removeSync(dist);
        }
        const apks = this.filterApk(buildDist, 'apk');
        let distFile;
        apks.forEach((v) => {
            distFile = path.join(dist, path.basename(v));
            fse.copySync(v, distFile);
        });
        updateTask(idx, rnVersion, 'success', taskLogPath, {
            distPath: distFile,
        });
        console.log('完成构建');
    },
    getBuildLog() {
        const confInfo = this.getConfigInfo();
        const taskLogPath = path.join(execDir, confInfo.taskLogPath);
        return readBuildLog(taskLogPath);
    },
    /**
     * 进行构建
     */
    run(startWith) {
        const confInfo = this.getConfigInfo();
        /**
         * 检查环境
         */
        if (!confInfo) {
            console.log('获取配置信息失败，请在当前目录创建配置文件');
            return;
        }
        if (!utils.checkAdb()) {
            console.log('adb 没有安装');
            return;
        }
        console.log('获取要构建的react native版本...');
        let exitLog = null;
        const rnVersions = utils.getVersionList('react-native');
        let avlVers = utils.filterVersion(confInfo.reactNativeRange, rnVersions);
        if (avlVers.length < 1) {
            console.log('没有找到匹配的打包版本');
            return;
        }
        if (!confInfo.taskLogPath) {
            console.log('没有配置打包日志路径');
            return;
        }
        if (!confInfo.appName) {
            console.log('没有配置项目名称');
            return;
        }
        const projectName = confInfo.appName;
        const taskLogPath = path.join(execDir, confInfo.taskLogPath);
        if (!startWith) {
            initTask(avlVers, taskLogPath);
        } else {
            exitLog = readBuildLog(taskLogPath);
            if (startWith === 'error') {
                avlVers = Object.keys(exitLog.error);
            } else if (startWith === 'continue') {
                avlVers = exitLog.taskList;
            } else if (startWith === 'rebuild') {
                avlVers = Object.keys(exitLog.task);
            }
        }
        console.log('版本列表：', avlVers, avlVers.length);
        const beforeBuildConf = this.getBeforeBuildScripts();
        avlVers.forEach((v, i) => {
            console.log('开始构建react native版本：', v);
            // 跳过已经打包的索引
            if (startWith === 'continue' && i < exitLog.currIndex) {
                return;
            }
            updateTask(i, v, null, taskLogPath);
            try {
                utils.initProject(v);
                utils.installDep(projectName, v);
                utils.startBuild(projectName, confInfo.platform, v, beforeBuildConf);
                utils.finishBuild(projectName, confInfo.platform, v, i, taskLogPath);
                updateTask(i, v, 'success', taskLogPath, {
                    msg: '构建成功',
                });
                this.execEventHandler('buildSucc', {
                    rnVersion: v,
                    projectName,
                });
            } catch (e) {
                console.log('构建错误:', e);
                updateTask(i, v, 'error', taskLogPath, { msg: e.msg, });
            }
        });
    },
    /**
     * 执行事件
     * @param {string} type 事件类型
     */
    execEventHandler(type, ...args) {
        if (type && this.event[type]) {
            this.event[type].forEach((v) => {
                if (v) {
                    v(...args);
                }
            });
        }
    },
    /**
     * 添加执行事件类型的回调函数
     * @param {string} type 事件类型
     * @param {function} handler 回调函数
     */
    addListener(type, handler) {
        if (!type || !handler || !this.event[type]) {
            return;
        }
        this.event[type].push(handler);
    },
    /**
     * 清楚指定类型的所有回调
     * @param {string} type 事件类型
     */
    cleanListener(type) {
        if (type && this.event[type]) {
            this.event[type] = [];
        }
    },
    /**
     * 需要检查环境变量，如果没有配置环境变量没办法执行后续的操作
     * @return {object}
     */
    checkSdkEnv() {
        // 需要检查 ANDROID_HOME
        // 需要检查 ANDROID_ROOT_HOME
        // 需要检查 ANDROID_SDK_ROOT
        // 需要检查 所有工具是否可用
        // adb、sdkmanager、emulator、emulatorManager、gradle
        // todo: 判断std.code 是否正确
        const astd = shelljs.exec('echo $ANDROID_SDK_ROOT', { silent: true, });
        const res = astd.stdout.replace(/\s/g, '');
        if (!res) {
            console.log('$ANDROID_SDK_ROOT：没有配置成功');
            return {
                success: false,
                msg: '[$ANDROID_SDK_ROOT] check failed',
            };
        }

        const estd = shelljs.exec('emulator', { silent: true, });
        const eres = estd.stdout.replace(/\s/g, '');
        if (!eres) {
            console.log('没有找到命令：emulator');
            return {
                success: false,
                msg: '[emulator] check failed',
            };
        }

        if (!this.checkAdb()) {
            console.log('没有找到命令：adb');
            return {
                success: false,
                msg: '[adb] check failed',
            };
        }

        if (!this.checkGradle()) {
            console.log('没有找到命令：gradle');
            return {
                success: false,
                msg: '[gradle] check failed',
            };
        }

        return {
            success: true,
        };
    },
    /**
     * 获取可用的模拟器
     * @return {array}
     */
    getEmulatorList() {
        const std = shelljs.exec('emulator -list-avds', { silent: true, });
        if (std.code == 0) {
            return std.stdout.split(/\n/).filter((v) => {
                if (v) {
                    return true;
                }
                return false;
            });
        }
        return [];
    },
    /**
     * 启动android模拟器, 可能有问题, 对后续结果不作保证，可以通过diviceList 查看是否启动成功
     */
    startEmulatorAsync(avdName) {
        if (!avdName) {
            return;
        }
        shelljs.exec(`$ANDROID_SDK_ROOT/tools/emulator -avd ${avdName} > /dev/null 2>&1 &`, { silent: true, async: true, }, (code) => {
            if (code == 0) {
                console.log(`emulator: ${avdName} 启动成功`);
            }
            console.log(`emulator: ${avdName} 启动失败`);
        });
    },
    /**
     * 获取正在运行的设备列表
     * @return {array}
     */
    getDevicesList() {
        const std = shelljs.exec('adb devices', { silent: true, });
        if (std.code == 0) {
            return std.stdout.split(/\n/).filter((v) => {
                if (v) {
                    const vs = v.split(/\s+/g);
                    if (vs.indexOf('device') > -1) {
                        return true;
                    }
                }
                return false;
            }).map((v) => {
                return v.split(/\t/g)[0];
            });
        }
        return [];
    },
    /**
     * 安装apk到指定的设备
     * @param {string} deviceId 设备id
     * @param {string} apk 当前apk的路径
     * @return {bool}
     */
    installApk(deviceId, apk) {
        if (!deviceId || !apk) {
            return false;
        }
        const std = shelljs.exec(`adb -s ${deviceId} install ${apk}`, { silent: true, });
        if (std.code == 0) {
            console.log('安装成功');
            return true;
        }
        console.log('安装失败');
        return false;
    },
    /**
     * 卸载app
     * 人人贷的app名字：com.renrendai.finance
     * @param {string} deviceId 设备id
     * @param {string} id 当前app的Id
     * @return {bool}
     */
    uninstallApk(deviceId, id) {
        if (!deviceId || !id) {
            return false;
        }
        const std = shelljs.exec(`adb -s ${deviceId} uninstall ${id}`, { silent: true, });
        if (std.code == 0) {
            console.log('卸载成功');
            return true;
        }
        console.log('卸载失败');
        return false;
    },
    /**
     * 打开app指定的activity
     * com.renrendai.finance/Main
     * @param {string} deviceId 设备id
     * @param {string} activity 当前activity
     * @return {bool}
     */
    openActivity(deviceId, activity) {
        if (!deviceId || !activity) {
            return null;
        }
        const std = shelljs.exec(`adb -s ${deviceId} shell am start -n ${activity}`, { silent: true, });
        console.log('命令执行成功:', std.stderr);
        return {
            isError: std.stderr.indexOf('Error') > -1,
            msg: std.stderr,
        };
    },
    /**
     * 退出App
     * @param {string} deviceId 设备id
     * @param {sting} activity 当前appId
     * @return {bool}
     */
    stopApp(deviceId, appId) {
        if (!deviceId || !appId) {
            return false;
        }
        const std = shelljs.exec(`adb -s ${deviceId} shell am force-stop ${appId}`, { silent: true, });
        if (std.code == 0) {
            console.log('关闭成功');
            return true;
        }
        console.log('关闭失败');
        return false;
    },
    /**
     * 给指定的app 设置权限
     * @param {string} deviceId 设备id
     * @param {string} appId appId
     * @param {string} permission 当前的权限
     * @return {bool}
     */
    grantPermission(deviceId, appId, permission) {
        if (!deviceId || !appId) {
            return false;
        }
        const std = shelljs.exec(`adb -s ${deviceId} shell pm grant ${appId} ${permission}`, { silent: true, });
        if (std.code == 0) {
            console.log('授权成功');
            return true;
        }
        console.log('授权失败');
        return false;
    },


};


module.exports = utils;
