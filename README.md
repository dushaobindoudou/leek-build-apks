# leek-build-apks
根据不同的react native版本，构建测试版本的apk，验证在不同react native下的兼容问题

## 要求

根据配置文件自动构建指定react native 版本的 apk。

自动集成 react-native-patch sdk

自动安装 不同版本的react native的依赖

打包生成apk


## 实现思路

react native init的逻辑是

1. 根据传入的版本号 下载安装 react-native 依赖并生成对应的 package.json

2. 执行react-native中local-cli/init命令

3. 根据目前 react-native 中的template 生成对应的 项目名称的 源代码

4. 每个react-native 对应的react 版本是不同的



1. 初始化一次 react-native 最新版本的代码
2. 获取react-native-patch的测试代码
3. 修改package.json指定的react-native 版本和 react 版本
4. 执行 npm install
5. 执行 构建apk 操作
6. 将 apk 拷贝到 执行的目录



