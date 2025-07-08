# 🔄 ml5.js API 更新说明

## 📋 问题解决

你遇到的"无法测试PoseNet - 功能不可用"错误是因为ml5.js库更新了API。我已经将代码更新为使用最新的ml5.js 1.0+ API。

## 🆕 主要变化

### 1. PoseNet → BodyPose
```javascript
// 旧API (ml5.js 0.x)
const poseNet = await ml5.poseNet(video, options, callback);
poseNet.on('pose', (results) => { ... });

// 新API (ml5.js 1.0+)
const bodyPose = await ml5.bodyPose(options);
bodyPose.detectStart(video, (results) => { ... });
```

### 2. 配置选项变化
```javascript
// 旧配置
{
    imageScaleFactor: 0.3,
    outputStride: 16,
    flipHorizontal: false,
    minConfidence: 0.5,
    maxPoseDetections: 1,
    scoreThreshold: 0.5,
    nmsRadius: 20,
    detectionType: 'single'
}

// 新配置
{
    modelType: "MoveNet", // "MoveNet" or "BlazePose"
    enableSmoothing: true,
    minConfidence: 0.5
}
```

### 3. 检测控制
```javascript
// 旧API
poseNet.on('pose', callback);

// 新API
bodyPose.detectStart(video, callback);
bodyPose.detectStop();
```

## ✅ 已更新的文件

1. **js/pose-detector.js**
   - `poseNet` → `bodyPose`
   - 更新初始化方法
   - 更新配置选项
   - 添加检测控制

2. **js/main.js**
   - 更新库检查逻辑
   - 更新模型初始化
   - 更新错误处理

3. **debug.html**
   - 添加新API检测
   - 更新测试函数
   - 兼容性检查

4. **simple-pose.html**
   - 完全更新为新API
   - 简化的测试实现

## 🎯 新功能特点

### 更好的性能
- **MoveNet**: 更快的检测速度
- **BlazePose**: 更高的精度
- **平滑处理**: 减少抖动

### 简化的API
- 更直观的方法名
- 更少的配置选项
- 更好的错误处理

### 更好的兼容性
- 支持更多浏览器
- 更好的移动端支持
- 更稳定的性能

## 🔧 使用方法

### 1. 基础姿态检测
```javascript
// 创建BodyPose实例
const bodyPose = await ml5.bodyPose({
    modelType: "MoveNet",
    enableSmoothing: true,
    minConfidence: 0.5
});

// 开始检测
bodyPose.detectStart(video, (results) => {
    console.log('检测到姿态:', results);
});

// 停止检测
bodyPose.detectStop();
```

### 2. 配置选项
```javascript
const options = {
    modelType: "MoveNet",     // 或 "BlazePose"
    enableSmoothing: true,    // 启用平滑处理
    minConfidence: 0.5        // 最小置信度
};
```

### 3. 结果处理
```javascript
bodyPose.detectStart(video, (results) => {
    if (results.length > 0) {
        const pose = results[0];
        console.log('姿态得分:', pose.confidence);
        console.log('关键点:', pose.keypoints);
        console.log('骨架:', pose.skeleton);
    }
});
```

## 🧪 测试页面

### 1. 调试页面 (`/debug.html`)
- 检查ml5.js版本和API可用性
- 测试新旧API兼容性
- 诊断加载问题

### 2. 简化测试 (`/simple-pose.html`)
- 基础BodyPose功能测试
- 最小化实现
- 快速验证

### 3. 主应用 (`/`)
- 完整功能测试
- 姿态+手势检测
- 实际使用场景

## 🔍 故障排除

### 常见问题

1. **"bodyPose功能不可用"**
   - 确保使用ml5.js 1.0+版本
   - 检查网络连接
   - 清除浏览器缓存

2. **检测不工作**
   - 确保调用了`detectStart()`
   - 检查视频元素是否正确
   - 查看浏览器控制台错误

3. **性能问题**
   - 尝试不同的modelType
   - 调整minConfidence值
   - 关闭enableSmoothing

### 调试步骤

1. **检查库加载**
   ```javascript
   console.log('ml5版本:', ml5.version);
   console.log('bodyPose可用:', typeof ml5.bodyPose === 'function');
   ```

2. **测试基础功能**
   ```javascript
   const bodyPose = await ml5.bodyPose();
   console.log('BodyPose创建成功:', bodyPose);
   ```

3. **检查视频状态**
   ```javascript
   console.log('视频就绪:', video.readyState >= 2);
   console.log('视频尺寸:', video.videoWidth, video.videoHeight);
   ```

## 📈 性能对比

| 特性 | 旧API (PoseNet) | 新API (BodyPose) |
|------|----------------|-------------------|
| 检测速度 | 中等 | 更快 |
| 精度 | 良好 | 更好 |
| 配置复杂度 | 高 | 低 |
| 浏览器兼容性 | 良好 | 更好 |
| 移动端性能 | 一般 | 优秀 |

## 🚀 下一步

现在你可以：

1. **测试新功能**
   - 访问调试页面检查API状态
   - 使用简化测试页面验证基础功能
   - 在主应用中体验完整功能

2. **自定义配置**
   - 尝试不同的modelType
   - 调整检测参数
   - 优化性能设置

3. **集成到项目**
   - 新的API更稳定可靠
   - 为ZKTLS集成做准备
   - 扩展更多功能

---

**API更新完成！现在姿态检测应该可以正常工作了。** 🎉
