# zkTLS Integration for Rhythm Pose

## 概述

本文档描述了 Rhythm Pose 项目中 zkTLS (Zero-Knowledge Transport Layer Security) 的集成实现。zkTLS 技术允许用户在不泄露敏感信息的情况下，生成可验证的姿态成就证明。

## 🎯 功能特点

### 核心功能
- **零知识证明生成**: 为姿态成就生成 zkTLS 证明
- **链上验证**: 将证明记录到区块链进行永久存储
- **隐私保护**: 保护用户数据隐私的同时提供可验证性
- **自动化集成**: 与现有评分系统无缝集成

### 技术特性
- **Primus Labs zkTLS SDK**: 使用业界领先的 zkTLS 解决方案
- **智能合约集成**: 支持以太坊智能合约交互
- **实时验证**: 支持实时证明生成和验证
- **批量处理**: 支持批量上传证明到区块链

## 📁 文件结构

```
js/
├── zktls-config.js              # zkTLS 配置文件
├── zktls-integration.js         # zkTLS 核心集成模块
├── zktls-scoring-integration.js # 评分系统集成
└── smart-contract-integration.js # 智能合约集成

contracts/
└── RhythmPoseProof.sol          # 智能合约 (已存在)

test-zktls-integration.html      # 测试页面
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install @primuslabs/zktls-js-sdk
```

### 2. 配置 zkTLS

编辑 `js/zktls-config.js` 文件，设置您的应用凭据：

```javascript
const ZKTLSConfig = {
    app: {
        appId: "YOUR_APP_ID",
        appSecret: "YOUR_APP_SECRET", // 生产环境中应在后端处理
        workMode: "proxytls",
        environment: "testnet"
    }
    // ... 其他配置
};
```

### 3. 初始化 zkTLS

```javascript
// 创建 zkTLS 集成实例
const zkTLSIntegration = new ZKTLSIntegration();
await zkTLSIntegration.initialize();

// 设置用户地址
zkTLSIntegration.setUserAddress("0x...");
```

### 4. 生成证明

```javascript
// 准备姿态数据
const poseData = {
    poseName: "tree-pose",
    score: 85,
    duration: 5,
    accuracy: 90,
    timestamp: Date.now()
};

// 生成证明
const proof = await zkTLSIntegration.generatePoseProof(poseData);
console.log("证明生成成功:", proof.id);
```

## 🔧 API 参考

### ZKTLSIntegration 类

#### 方法

##### `initialize()`
初始化 zkTLS 服务
- **返回**: `Promise<boolean>`
- **异常**: 初始化失败时抛出错误

##### `setUserAddress(address)`
设置用户钱包地址
- **参数**: `address` (string) - 用户钱包地址

##### `generatePoseProof(poseData)`
生成姿态成就证明
- **参数**: `poseData` (object) - 姿态数据
- **返回**: `Promise<Proof>` - 生成的证明对象

##### `verifyProof(attestation)`
验证证明有效性
- **参数**: `attestation` (object) - 证明数据
- **返回**: `Promise<boolean>` - 验证结果

##### `getProofHistory()`
获取证明历史记录
- **返回**: `Array<Proof>` - 证明历史数组

### ZKTLSScoringIntegration 类

#### 方法

##### `canGenerateProof(scoreData)`
检查是否可以生成证明
- **参数**: `scoreData` (object) - 评分数据
- **返回**: `object` - 检查结果

##### `generatePoseProof(poseKey, scoreData)`
生成姿态证明（集成评分系统）
- **参数**: 
  - `poseKey` (string) - 姿态键名
  - `scoreData` (object) - 评分数据
- **返回**: `Promise<Proof>` - 生成的证明

##### `getProofStats()`
获取证明统计信息
- **返回**: `object` - 统计数据

## 🎮 用户界面

### zkTLS 控制面板

主界面包含以下 zkTLS 相关组件：

1. **状态显示**
   - zkTLS 服务状态
   - 用户钱包连接状态

2. **操作按钮**
   - 连接钱包
   - 初始化 zkTLS
   - 生成证明

3. **证明显示**
   - 最新证明信息
   - 证明历史记录

### 证明历史面板

显示用户的证明统计和历史记录：
- 总证明数量
- 已验证证明数量
- 证明列表（最近5个）
- 导出/清除功能

## 🔐 安全考虑

### 密钥管理
- **应用密钥**: 生产环境中应在后端处理，不应暴露在前端
- **用户私钥**: 通过 MetaMask 等钱包管理，不直接处理

### 数据隐私
- **零知识证明**: 只证明姿态成就，不泄露具体动作数据
- **本地存储**: 证明历史仅存储在本地，用户可随时清除

### 网络安全
- **HTTPS**: 所有网络通信使用 HTTPS
- **证明验证**: 所有证明都经过 zkTLS 验证

## 🧪 测试

### 测试页面
使用 `test-zktls-integration.html` 进行功能测试：

1. 打开测试页面
2. 点击"初始化 zkTLS"
3. 连接 MetaMask 钱包
4. 设置测试参数
5. 生成和验证证明

### 测试用例
- zkTLS 服务初始化
- 钱包连接
- 配置验证
- 证明生成
- 证明验证
- 数据导出

## 🔄 工作流程

### 证明生成流程

1. **用户完成姿态动作**
   - 系统检测姿态
   - 计算评分数据

2. **检查证明条件**
   - 验证分数是否达到要求
   - 检查持续时间和准确度

3. **生成 zkTLS 证明**
   - 调用 Primus Labs SDK
   - 生成零知识证明

4. **存储和显示**
   - 保存到本地历史
   - 更新 UI 显示

### 区块链集成流程

1. **证明验证**
   - 验证 zkTLS 证明有效性

2. **智能合约调用**
   - 调用 `recordVerifiedPose` 方法
   - 传递证明数据

3. **链上存储**
   - 记录到区块链
   - 触发相关事件

## 📊 配置选项

### 证明生成条件
```javascript
conditions: {
    minScore: 75,        // 最低分数要求
    minDuration: 3,      // 最低持续时间（秒）
    minAccuracy: 80,     // 最低准确度要求
    cooldownPeriod: 30000 // 冷却时间（毫秒）
}
```

### 模板配置
- **姿态成就证明**: 基础姿态完成证明
- **高分记录证明**: 创造新纪录证明
- **连续成就证明**: 连击成就证明

## 🐛 故障排除

### 常见问题

1. **zkTLS 初始化失败**
   - 检查网络连接
   - 验证应用凭据
   - 确认 SDK 正确加载

2. **钱包连接失败**
   - 安装 MetaMask
   - 检查网络设置
   - 确认账户权限

3. **证明生成失败**
   - 检查评分是否达到要求
   - 验证用户地址设置
   - 查看控制台错误信息

### 调试工具
- 浏览器开发者工具
- 测试页面日志
- zkTLS SDK 调试信息

## 🔮 未来计划

### 功能扩展
- **多链支持**: 支持更多区块链网络
- **NFT 集成**: 将证明转换为 NFT
- **社交功能**: 证明分享和排行榜
- **移动端支持**: 移动设备优化

### 性能优化
- **批量处理**: 优化批量证明生成
- **缓存机制**: 改进数据缓存策略
- **网络优化**: 减少网络请求次数

## 📞 支持

如有问题或建议，请：
1. 查看本文档
2. 检查测试页面
3. 查看控制台日志
4. 联系开发团队

---

*本文档随项目更新而更新，请定期查看最新版本。*
