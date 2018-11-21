# leek-build-apks
根据不同的react native版本，构建不同测试版本的apk，验证系统在不同react native下的兼容问题


## 定义需求


自动安装 不同版本的react native的依赖

自动集成 react-native-patch sdk （包括安装依赖，集成代码）

根据配置文件自动构建指定react native 版本的 apk/ipa

todo:
自动测试


## 实现思路

react native init介绍：

1. 根据传入的版本号 下载安装 react-native 依赖并生成对应的 package.json

2. 执行react-native中local-cli/init命令

3. 根据当前 react-native 中的template 生成对应的项目名称的源代码


注: 每个react-native 对应的react版本是不同的 对应的 android、ios 模板代码也是不同的


自动打包思路：

1. 初始化一次 react-native 最新版本的代码 （使用最新版的rn 模块）
2. 添加react-native-tinker依赖
2. 获取 react-native-tinker 的 测试代码 （js）
3. 修改package.json指定的react-native 版本和 react 版本 （切换不同的版本）
4. 执行 npm install （安装依赖）
5. 执行 构建apk 操作 （使用gradle 构建）
6. 将 apk 拷贝到 要发布发布的目录 （按照不同版本分类）

todo:

7. 自动打开模拟器，运行指定的apk
8. 检查更新到指定的版本内容，上报结果
9. 重复7、8

## 产出

### 第一版
一个可执行行node脚本
一个配置文件
```
{
    androidSdk: '26',
    rnVersion: '>=0.45',
    dist: '../dist/',
    log: '../dist/build.log'
}
```

### 第二版
第一版的产出可能满足不了需求
1. 单独一个可执行文件，开发的依赖很难管理
2. 项目中预置的资源很难操作
3. 脚本放置的位置不可控，不同机器可能会有权限问题，导致问题太多
4. 发布到哪里，这个对单独文件来说也很难管理，别人托管的脚本是否进行过修改，会不会注入不安全的代码

最终考虑还是以cli项目通过npm进行发布管理。避免很多不必要的麻烦


## 自动运行测试包服务

工具不知道app内部的自动测试运行情况，所以不知道何时进行卸载安装下一个包

当前只提供一个命令集合，让服务端控制怎么执行，使用websockt来进行前后端通信

1. APK打包完成，上报当前的apk信息
2. 安装apk
3. 打开某个activity
4. 卸载apk






## 使用说明


### 配置环境
首先需要配置打包环境

需要安装 node js

#### android

1. 安装java
2. 安装android sdk
3. 安装gradle
4. 安照官方配置


#### ios

todo



### 安装工具
npm install -g leek-auto-build 


### 配置打包参数

默认打包的配置文件为： leek-auto-build.conf

切换到 配置文件所在目录

运行命令 lab

```
lab -r continue // 接着上一次未打完的进度继续打包
lab -r rebuild // 重新构建上一次打包
lab -r error // 打包 上一次失败的包
```

配置demo:

```
{
    "appName": "FunApp", // 生成的android 项目名称
    "reactNativeRange": ">=0.45.2", // 要打包的react native 版本范围
    "dist": "./dist/", // 打包生成的包放置的位置
    "taskLogPath": "./dist/task.log", // 打包任务log存放的路径
    "platform": "android", // 打包平台
    "beforeBuildDir": "./beforeBuildDir", // 打包之前需要执行的脚本
    "afterBuildDir": "./afterBuildDir", // 打包之后需要执行的脚本
    "dependencies": { // 在生成App的时候需要加入的依赖
        "react-native-tinker": "latest"
    }
}

````

打包之前执行脚本的配置：

文件名为针对哪些版本进行执行，多个限制使用空格分开 例如: >=0.45.1 <=0.57.2.js 

当执行脚本的时候 会把项目的根目录作为参数传给脚本

执行脚本Demo:

```
#!/usr/bin/env node

const path = require('path');
const shelljs = require('shelljs');
console.log('\n\n\n\n\n\n');
const projectRoot = process.argv[process.argv.length - 1];
shelljs.exec(`cp -f ${path.join(__dirname, './assets/build.gradle')} ${projectRoot}/android/build.gradle`);
console.log('重置 build.gradle 完成');
console.log('\n\n\n\n\n\n');
````



## 问题
1. 每个版本的react-native 模板是不同的，集成方式也是不同的，影响集成脚本

