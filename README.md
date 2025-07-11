# PoP (Proof-of-Pose) - 用动作重新定义链上交互与空投机制

基于 zkTLS 零知识证明技术的创新Web3项目，通过真实动作验证重新定义链上身份认证和代币分发机制。用户通过完成特定动作生成零知识证明，获得链上奖励，开创了"动作即证明"的全新交互范式。

## 🎯 核心价值

### 🔗 Web3 创新特性
- **Proof-of-Pose 机制**: 首创"动作即证明"的身份验证方式
- **zkTLS 零知识证明**: 保护隐私的同时提供可验证的动作证明
- **自动化代币奖励**: 完成动作自动获得 0.01 S 代币奖励
- **链上成就系统**: 永久记录用户动作成就到区块链
- **去中心化验证**: 无需中心化服务器，完全基于区块链验证

### 🤖 AI 技术特性
- **双模式检测**: 支持人体姿势检测和手部动作检测
- **实时动作识别**: 使用 ml5.js PoseNet 和 MediaPipe Hands 进行实时检测
- **丰富动作库**:
  - 人体姿势：树式、战士式、平板支撑、深蹲、开合跳、Diamond Hands
  - 手部动作：挥手、点赞、比心、握拳、张开手掌
- **智能评分系统**: 基于准确度、稳定性和持续时间的综合评分
- **实时反馈**: 提供即时的动作指导和改进建议
- **可视化显示**: 可选择显示/隐藏骨架关键点和手部关键点

## 🚀 快速开始

### 环境要求

- 现代浏览器（支持 WebRTC 和 WebGL）
- 摄像头设备
- HTTPS 环境（本地开发可使用 localhost）
- MetaMask 钱包（用于Web3交互）
- Sonic Blaze Testnet 网络配置

### 安装和运行

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd rhythm-pose
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   打开浏览器访问 `http://localhost:8080`

5. **配置 Web3 环境**
   - 安装 MetaMask 浏览器扩展
   - 添加 Sonic Blaze Testnet 网络
   - 获取测试代币用于交易费用

### 生产环境部署

```bash
npm run start
```

### Sonic Blaze Testnet 配置

```
网络名称: Sonic Blaze Testnet
RPC URL: https://rpc.blaze.soniclabs.com
链 ID: 57054
货币符号: S
区块浏览器: https://blaze.soniclabs.com
```

## 📱 使用说明

### Web3 工作流程

1. **连接钱包**: 点击"连接钱包"按钮，连接 MetaMask
2. **启用摄像头**: 点击"启用摄像头"按钮，允许浏览器访问摄像头
3. **选择检测模式**:
   - **人体姿势**: 检测全身动作和姿态
   - **手部动作**: 专注于手部手势识别
4. **选择动作**: 根据检测模式选择要练习的动作
5. **开始检测**: 点击"开始检测"按钮启动AI识别
6. **完成动作**: 根据动作指导完成相应姿势，获得评分
7. **生成证明**: 点击"生成 zkTLS 证明"按钮创建零知识证明
8. **获得奖励**: 系统自动发放 0.01 S 代币到您的钱包
9. **查看成就**: 在区块链上永久记录您的动作成就

### 支持的动作

#### 人体姿势检测
- **树式 (瑜伽)**: 单腿站立平衡姿势 - 奖励 0.01 S
- **战士式 (瑜伽)**: 前腿弯曲后腿伸直的力量姿势 - 奖励 0.01 S
- **平板支撑**: 核心力量训练动作 - 奖励 0.01 S
- **深蹲**: 下肢力量训练动作 - 奖励 0.01 S
- **开合跳**: 有氧运动动作 - 奖励 0.01 S
- **Diamond Hands**: 双手形成钻石形状的Web3经典手势 - 奖励 0.01 S

#### 手部动作检测
- **挥手**: 手掌张开左右摆动 - 奖励 0.01 S
- **点赞**: 竖起拇指的手势 - 奖励 0.01 S
- **比心/胜利**: 伸出食指和中指的V字手势 - 奖励 0.01 S
- **握拳**: 五指紧握的拳头 - 奖励 0.01 S
- **张开手掌**: 五指完全展开的手掌 - 奖励 0.01 S

### PoP 评分与奖励系统

#### 评分维度
- **准确度 (50%)**: 姿势与标准动作的匹配程度
- **稳定性 (30%)**: 动作保持的稳定程度
- **持续时间 (20%)**: 正确姿势的保持时间

#### 奖励机制
- **最低分数要求**: 75分以上才能获得奖励
- **自动发放**: 生成 zkTLS 证明后自动转账
- **固定奖励**: 每个成功动作奖励 0.01 S 代币
- **链上记录**: 所有成就永久存储在区块链上
- **零知识证明**: 保护用户隐私的同时提供可验证性

## 🛠️ 技术架构

### Web3 技术栈

- **zkTLS**: Primus Labs 零知识传输层安全协议
- **Smart Contracts**: Solidity 智能合约 (Sonic Blaze Testnet)
- **Web3.js**: 以太坊区块链交互库
- **MetaMask**: 去中心化钱包集成

### AI 技术栈

- **ml5.js**: 机器学习库，提供 PoseNet 姿态估计
- **MediaPipe Hands**: Google 的手部检测模型
- **p5.js**: 创意编程库，用于视频处理和可视化
- **Canvas API**: 高性能图形渲染

### 前端技术

- **Vanilla JavaScript**: 原生 JavaScript 实现
- **CSS Grid & Flexbox**: 响应式布局
- **Progressive Web App**: 支持离线使用

### 项目结构

```
rhythm-pose/
├── index.html                      # 主页面
├── styles/
│   └── main.css                    # 样式文件
├── js/
│   ├── main.js                     # 主应用逻辑
│   ├── pose-detector.js            # 姿态检测器
│   ├── hand-detector.js            # 手势检测器 (ml5.js)
│   ├── mediapipe-hand-detector.js  # 手部检测器 (MediaPipe)
│   ├── pose-definitions.js         # 动作定义
│   ├── scoring-system.js           # 评分系统
│   ├── zktls-integration.js        # zkTLS 集成
│   ├── smart-contract-integration.js # 智能合约集成
│   ├── performance-monitor.js      # 性能监控
│   └── simple-fps-monitor.js       # FPS 监控
├── contracts/
│   └── RhythmPoseProof.sol         # PoP 智能合约
├── abi/
│   └── abi.json                    # 合约 ABI
├── package.json                    # 项目配置
├── ZKTLS_INTEGRATION.md            # zkTLS 集成文档
├── SONIC_BLAZE_DEPLOYMENT.md       # 部署文档
└── README.md                       # 项目说明
```

### 核心类说明

- **RhythmPoseApp**: 主应用类，协调各个模块
- **PoseDetector**: 姿态检测器，使用 ml5.js PoseNet
- **HandDetector**: 手势检测器，使用 ml5.js HandPose
- **MediaPipeHandDetector**: 手部检测器，使用 MediaPipe Hands
- **PoseDefinitions**: 动作定义，包含各种动作的标准参数
- **ScoringSystem**: 评分系统，计算动作质量分数

## 🔧 开发指南

### 添加新动作

1. 在 `pose-definitions.js` 中添加新的动作定义
2. 在 `scoring-system.js` 中实现对应的评估逻辑
3. 更新 UI 选择器

### 自定义评分算法

修改 `ScoringSystem` 类中的评估方法：

```javascript
// 示例：添加新的评估逻辑
evaluateCustomPose(keypoints) {
    let score = 0;
    // 实现自定义评分逻辑
    return score;
}
```

### 调整检测参数

在 `PoseDetector` 类中修改检测配置：

```javascript
this.detectionConfig = {
    imageScaleFactor: 0.3,  // 图像缩放因子
    outputStride: 16,       // 输出步长
    minConfidence: 0.5,     // 最小置信度
    // ... 其他参数
};
```

## 🎨 界面定制

### 修改主题色彩

在 `main.css` 中修改 CSS 变量：

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --accent-color: #00ff00;
}
```

### 响应式断点

```css
/* 平板设备 */
@media (max-width: 1200px) { ... }

/* 手机设备 */
@media (max-width: 768px) { ... }
```

## 🚧 已知限制

- 需要良好的光照条件
- 摄像头质量影响检测精度
- 某些复杂动作可能识别不够准确
- 需要 HTTPS 环境才能访问摄像头
- 人体姿势检测和手部检测为独立模式，不能同时进行

## 🔮 未来计划

- [ ] 集成 ZKTLS 隐私保护
- [ ] 添加区块链记录功能
- [ ] 支持更多动作类型
- [ ] 添加语音指导
- [ ] 实现多人对战模式
- [ ] 优化移动端体验

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题或建议，请联系项目维护者。
