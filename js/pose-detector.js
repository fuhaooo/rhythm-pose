// 增强版姿态检测器类
class PoseDetector {
    constructor() {
        this.video = null;
        this.bodyPose = null;
        this.poses = [];
        this.isDetecting = false;
        this.videoOnlyMode = false; // 是否为仅视频模式（不进行姿势检测）
        this.canvas = null;
        this.ctx = null;
        this.videoWidth = 640;
        this.videoHeight = 480;

        // 显示控制
        this.showSkeleton = true; // 是否显示骨骼和关节点
        this.detectionMode = 'pose'; // 检测模式
        this.detectionMethod = null; // 检测方法 ('tensorflow' 或 'ml5')

        // 简洁的视觉效果
        this.skeletonColor = '#00ff88'; // 骨架颜色
        this.skeletonWidth = 2;         // 骨架线条宽度

        // 外部手部检测器引用
        this.externalHandDetector = null;

        // 回调函数
        this.onPoseDetected = null;
        this.onModelReady = null;
        this.onError = null;

        // BodyPose配置 (新API)
        this.poseConfig = {
            modelType: "MoveNet", // "MoveNet" or "BlazePose"
            enableSmoothing: true,
            minConfidence: 0.5
        };

        // 动画帧ID
        this.animationFrameId = null;
        this.previewFrameId = null;
        this.tensorflowDetectionId = null;
    }

    // 初始化摄像头
    async initCamera() {
        try {
            console.log('开始初始化摄像头...');

            // 检查浏览器支持
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('浏览器不支持摄像头访问');
            }

            // 创建视频元素
            this.video = document.createElement('video');
            this.video.width = this.videoWidth;
            this.video.height = this.videoHeight;
            this.video.autoplay = true;
            this.video.muted = true;
            this.video.playsInline = true;

            console.log('请求摄像头权限...');

            // 获取摄像头权限
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: this.videoWidth },
                    height: { ideal: this.videoHeight },
                    facingMode: 'user' // 前置摄像头
                },
                audio: false
            });

            console.log('摄像头权限获取成功');
            this.video.srcObject = stream;

            return new Promise((resolve, reject) => {
                this.video.onloadedmetadata = () => {
                    console.log('视频元数据加载完成');
                    this.video.play().then(() => {
                        console.log('视频播放开始');
                        this.setupCanvas();
                        resolve(true);
                    }).catch(reject);
                };
                this.video.onerror = (e) => {
                    console.error('视频加载错误:', e);
                    reject(e);
                };

                // 添加超时处理
                setTimeout(() => {
                    reject(new Error('摄像头初始化超时'));
                }, 10000);
            });
        } catch (error) {
            console.error('摄像头初始化失败:', error);
            let errorMessage = '摄像头访问失败: ';

            if (error.name === 'NotAllowedError') {
                errorMessage += '用户拒绝了摄像头权限';
            } else if (error.name === 'NotFoundError') {
                errorMessage += '未找到摄像头设备';
            } else if (error.name === 'NotReadableError') {
                errorMessage += '摄像头被其他应用占用';
            } else if (error.name === 'OverconstrainedError') {
                errorMessage += '摄像头不支持请求的配置';
            } else {
                errorMessage += error.message;
            }

            if (this.onError) {
                this.onError(errorMessage);
            }
            throw error;
        }
    }

    // 设置画布
    setupCanvas() {
        const container = document.getElementById('video-wrapper');

        // 创建画布
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.videoWidth;
        this.canvas.height = this.videoHeight;
        this.canvas.style.maxWidth = '100%';
        this.canvas.style.height = 'auto';
        this.canvas.style.borderRadius = '10px';
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';

        this.ctx = this.canvas.getContext('2d');

        // 清空容器并添加画布
        container.innerHTML = '';
        container.appendChild(this.canvas);

        // 立即绘制一帧以显示摄像头画面
        this.drawVideoFrame();
    }

    // 绘制单帧视频（用于摄像头预览）
    drawVideoFrame() {
        if (this.video && this.ctx && this.video.readyState >= 2) {
            // 清除画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // 保存当前画布状态
            this.ctx.save();

            // 水平翻转画布以取消镜像效果
            this.ctx.scale(-1, 1);
            this.ctx.translate(-this.canvas.width, 0);

            // 绘制视频帧（现在是非镜像的）
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            // 恢复画布状态
            this.ctx.restore();

            // 在预览模式下，如果有姿态数据且开启了骨骼显示，也绘制骨骼
            if (this.showSkeleton && this.poses.length > 0) {
                this.drawPose(this.poses[0]);
            }

            // 如果不在检测模式，继续绘制预览
            if (!this.isDetecting) {
                this.previewFrameId = requestAnimationFrame(() => this.drawVideoFrame());
            }
        }
    }

    // 检查ml5.js库是否加载
    checkML5Library() {
        if (typeof ml5 === 'undefined') {
            throw new Error('ml5.js库未加载，请检查网络连接');
        }

        console.log('ml5.js版本:', ml5.version || 'unknown');

        // 检查所需的功能 (0.12.2版本API)
        if (this.detectionMode === 'pose' || this.detectionMode === 'both') {
            if (typeof ml5.poseNet !== 'function') {
                throw new Error('ml5.poseNet功能不可用，请检查ml5.js版本');
            }
        }


    }

    // 初始化AI模型
    async initAIModels() {
        try {
            console.log('正在加载AI模型...');

            // 检查ml5.js库
            this.checkML5Library();

            // 初始化姿态检测模型
            await this.initPoseNet();

            console.log('AI模型加载完成');
            if (this.onModelReady) {
                this.onModelReady();
            }

            return true;
        } catch (error) {
            console.error('AI模型初始化失败:', error);
            if (this.onError) {
                this.onError('AI 模型加载失败: ' + error.message);
            }
            throw error;
        }
    }

    // 初始化姿态检测模型
    async initPoseNet() {
        console.log('正在初始化姿态检测...');

        try {
            if (!this.video) {
                throw new Error('视频元素未初始化');
            }

            // 强制使用CPU后端避免WebGL问题
            if (typeof tf !== 'undefined') {
                await tf.setBackend('cpu');
                console.log('强制使用CPU后端，当前后端:', tf.getBackend());
            }

            // 检查可用的库
            console.log('检查可用库:');
            console.log('- window.poseDetection:', typeof window.poseDetection);
            console.log('- ml5:', typeof ml5);
            console.log('- ml5.poseNet:', typeof ml5?.poseNet);

            // 优先尝试 TensorFlow.js PoseNet
            if (typeof window.poseDetection !== 'undefined') {
                console.log('使用 TensorFlow.js PoseNet...');
                await this.initTensorFlowPoseNet();
                return this.detector;
            }
            // 备选方案：ml5.js PoseNet
            else if (typeof ml5 !== 'undefined' && typeof ml5.poseNet === 'function') {
                console.log('使用 ml5.js PoseNet...');
                await this.initML5PoseNet();
                return this.bodyPose;
            }
            else {
                throw new Error('没有可用的姿态检测库');
            }

        } catch (error) {
            console.error('❌ 姿态检测初始化失败:', error);
            throw new Error('姿态检测模型加载失败: ' + error.message);
        }
    }

    // TensorFlow.js PoseNet 初始化
    async initTensorFlowPoseNet() {
        const poseDetectionLib = window.poseDetection;
        this.detector = await poseDetectionLib.createDetector(
            poseDetectionLib.SupportedModels.PoseNet,
            {
                architecture: 'MobileNetV1',
                outputStride: 16,
                inputResolution: { width: 640, height: 480 },
                multiplier: 0.75,
                quantBytes: 2
            }
        );

        this.detectionMethod = 'tensorflow';
        console.log('TensorFlow.js PoseNet 初始化完成');

        // 不在初始化时启动检测循环，等待用户点击开始检测
    }

    // TensorFlow.js 检测循环（优化版本）
    async startTensorFlowDetection() {
        // 停止之前的检测循环
        if (this.tensorflowDetectionId) {
            cancelAnimationFrame(this.tensorflowDetectionId);
            this.tensorflowDetectionId = null;
        }

        let lastDetectionTime = 0;
        const detectionFPS = 15; // 降低检测频率到15FPS，减少计算负担

        const detect = async () => {
            if (!this.isDetecting || !this.detector || this.videoOnlyMode) {
                this.tensorflowDetectionId = null;
                return;
            }

            const currentTime = performance.now();

            // 限制检测频率
            if (currentTime - lastDetectionTime < 1000 / detectionFPS) {
                this.tensorflowDetectionId = requestAnimationFrame(detect);
                return;
            }
            lastDetectionTime = currentTime;

            try {
                // 开始检测时间监控
                const detectionStartTime = performance.now();

                const poses = await this.detector.estimatePoses(this.video);

                // 记录检测时间
                const detectionTime = performance.now() - detectionStartTime;
                window.simpleFPSMonitor?.recordDetectionTime(detectionTime);

                if (poses && poses.length > 0) {
                    // 转换为 ml5.js 格式以保持兼容性，并调整坐标以匹配镜像翻转
                    this.poses = poses.map(pose => ({
                        pose: {
                            keypoints: pose.keypoints.map(kp => ({
                                part: kp.name,
                                position: {
                                    x: this.canvas.width - kp.x,  // 镜像翻转X坐标
                                    y: kp.y
                                },
                                score: kp.score
                            })),
                            score: pose.score
                        }
                    }));

                    // 调试信息（仅在首次检测时输出）
                    if (!this._firstPoseDetection) {
                        console.log('✅ 首次检测到姿态数据，姿态数量:', poses.length);
                        console.log('姿态数据结构:', this.poses[0]);
                        console.log('关键点数量:', this.poses[0].pose.keypoints.length);
                        this._firstPoseDetection = true;
                    }

                    // 回调处理
                    if (this.onPoseDetected) {
                        this.onPoseDetected(this.poses[0]);
                    }
                } else if (!this._noPoseWarning) {
                    console.log('⚠️ 暂未检测到姿态');
                    this._noPoseWarning = true;
                }

                this.tensorflowDetectionId = requestAnimationFrame(detect);

            } catch (error) {
                console.error('TensorFlow.js 检测错误:', error);
                if (this.isDetecting) {
                    this.tensorflowDetectionId = requestAnimationFrame(detect);
                }
            }
        };

        this.tensorflowDetectionId = requestAnimationFrame(detect);
    }

    // ml5.js PoseNet 初始化（备选方案）
    async initML5PoseNet() {
        this.bodyPose = await ml5.poseNet(this.video, {
            architecture: 'MobileNetV1',
            imageScaleFactor: 0.5,
            outputStride: 16,
            flipHorizontal: false,
            minConfidence: this.poseConfig.minConfidence,
            maxPoseDetections: 1,
            scoreThreshold: 0.5,
            detectionType: 'single'
        });

        this.detectionMethod = 'ml5';

        // 设置事件监听器
        this.bodyPose.on('pose', (results) => {
            // 调整坐标以匹配镜像翻转的绘制
            this.poses = results.map(result => ({
                ...result,
                pose: {
                    ...result.pose,
                    keypoints: result.pose.keypoints.map(kp => ({
                        ...kp,
                        position: {
                            x: this.canvas.width - kp.position.x,  // 镜像翻转X坐标
                            y: kp.position.y
                        }
                    }))
                }
            }));

            // 调试信息（仅在首次检测时输出）
            if (results.length > 0 && !this._firstPoseDetection) {
                console.log('✅ 首次检测到姿态数据，姿态数量:', results.length);
                console.log('姿态数据结构:', results[0]);
                if (results[0].pose && results[0].pose.keypoints) {
                    console.log('关键点数量:', results[0].pose.keypoints.length);
                    console.log('第一个关键点:', results[0].pose.keypoints[0]);
                }
                this._firstPoseDetection = true;
            } else if (!this._noPoseWarning && results.length === 0) {
                console.log('⚠️ 暂未检测到姿态');
                this._noPoseWarning = true;
            }

            // 回调处理
            if (this.onPoseDetected && results.length > 0) {
                this.onPoseDetected(results[0]);
            }
        });

        // 添加错误监听器
        this.bodyPose.on('error', (error) => {
            console.error('PoseNet错误:', error);
        });

        console.log('ml5.js PoseNet 初始化完成');
    }

    // 设置检测模式（保留用于兼容性，但只支持pose模式）
    setDetectionMode(mode) {
        console.log('检测模式设置为:', mode, '(注意：当前只支持姿态检测)');
    }

    // 设置是否显示骨骼和关节点
    setShowSkeleton(show) {
        this.showSkeleton = show;
        console.log('骨骼显示设置为:', show);
    }

    // 设置外部手部检测器
    setExternalHandDetector(handDetector) {
        this.externalHandDetector = handDetector;
    }

    // 开始检测
    startDetection() {
        if (!this.video || (!this.bodyPose && !this.detector)) {
            console.error('摄像头或姿态检测模型未初始化');
            console.log('video:', !!this.video, 'bodyPose:', !!this.bodyPose, 'detector:', !!this.detector);
            return false;
        }

        console.log('开始姿态检测');
        console.log('检测方法:', this.detectionMethod);
        console.log('showSkeleton:', this.showSkeleton);
        console.log('poses数组长度:', this.poses.length);
        console.log('canvas:', !!this.canvas, 'ctx:', !!this.ctx);

        this.isDetecting = true;
        this.videoOnlyMode = false; // 标记为完整检测模式

        // 停止预览循环
        if (this.previewFrameId) {
            cancelAnimationFrame(this.previewFrameId);
            this.previewFrameId = null;
        }

        // 重置调试标志
        this._noPoseWarningLogged = false;
        this._skeletonDisabledLogged = false;
        this._handDrawLogged = false;
        this._firstPoseDetection = false;
        this._noPoseWarning = false;

        if (this.detectionMethod === 'tensorflow') {
            console.log('TensorFlow.js 检测已启动');
            // 启动TensorFlow.js检测循环
            this.startTensorFlowDetection();
        } else {
            console.log('ml5.js PoseNet检测已启动（自动模式）');
        }

        // 启动优化的绘制循环
        this.startOptimizedDrawLoop();

        console.log('检测已启动');
        return true;
    }

    // 仅启动视频绘制模式（用于手部检测模式）
    startVideoOnlyMode() {
        if (!this.video) {
            console.error('摄像头未初始化');
            return false;
        }

        console.log('启动视频绘制模式（不进行姿势检测）');

        this.isDetecting = true;
        this.videoOnlyMode = true; // 标记为仅视频模式

        // 停止预览循环
        if (this.previewFrameId) {
            cancelAnimationFrame(this.previewFrameId);
            this.previewFrameId = null;
        }

        // 清空姿态数据
        this.poses = [];

        // 启动仅视频的绘制循环
        this.startOptimizedDrawLoop();

        console.log('视频绘制模式已启动');
        return true;
    }

    // 停止检测
    stopDetection() {
        this.isDetecting = false;
        if (this.bodyPose && typeof this.bodyPose.detectStop === 'function') {
            this.bodyPose.detectStop();
        }
        // 取消绘制循环
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        // 取消TensorFlow检测循环
        if (this.tensorflowDetectionId) {
            cancelAnimationFrame(this.tensorflowDetectionId);
            this.tensorflowDetectionId = null;
        }

        // 重新启动预览循环
        this.drawVideoFrame();

        console.log('检测已停止，恢复预览模式');
    }

    // 优化的绘制循环（添加FPS限制和性能监控）
    startOptimizedDrawLoop() {
        // 取消之前的动画帧
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        console.log('🎬 启动优化绘制循环');

        let frameCount = 0;
        let lastFrameTime = 0;
        let fpsCounter = 0;
        let lastFpsTime = performance.now();

        // 根据模式调整FPS：视频模式更低，检测模式稍高
        const targetFPS = this.videoOnlyMode ? 20 : 30;

        const draw = (currentTime) => {
            if (!this.isDetecting) {
                console.log('🛑 绘制循环停止');
                this.animationFrameId = null;
                return;
            }

            // FPS限制 - 减少绘制频率
            if (currentTime - lastFrameTime < 1000 / targetFPS) {
                this.animationFrameId = requestAnimationFrame(draw);
                return;
            }
            lastFrameTime = currentTime;

            // 绘制当前帧（添加渲染时间监控）
            const renderStartTime = performance.now();
            this.drawFrame();
            const renderTime = performance.now() - renderStartTime;
            window.simpleFPSMonitor?.recordRenderTime(renderTime);

            frameCount++;
            fpsCounter++;

            // 每秒计算一次实际FPS
            if (currentTime - lastFpsTime >= 1000) {
                const actualFPS = fpsCounter;
                if (frameCount % 60 === 0) { // 每60帧输出一次
                    console.log(`🎥 实际FPS: ${actualFPS}, 目标FPS: ${targetFPS}, 姿态数量: ${this.poses.length}`);
                }
                fpsCounter = 0;
                lastFpsTime = currentTime;
            }

            this.animationFrameId = requestAnimationFrame(draw);
        };

        this.animationFrameId = requestAnimationFrame(draw);
    }

    // 简化的单帧绘制
    drawFrame() {
        if (!this.canvas || !this.ctx || !this.video || this.video.readyState < 2) {
            return;
        }

        try {
            // 清除画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // 保存当前画布状态
            this.ctx.save();

            // 水平翻转画布以取消镜像效果
            this.ctx.scale(-1, 1);
            this.ctx.translate(-this.canvas.width, 0);

            // 绘制视频帧（现在是非镜像的）
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            // 恢复画布状态
            this.ctx.restore();

            // 绘制姿态（如果启用且不是仅视频模式）
            if (this.showSkeleton && this.poses.length > 0 && !this.videoOnlyMode) {
                this.drawEnhancedPose(this.poses[0]);
            }

            // 绘制手部检测结果（如果有外部手部检测器）
            if (this.externalHandDetector && this.externalHandDetector.drawHands) {
                this.externalHandDetector.drawEnhancedHands();
            }

        } catch (error) {
            console.error('绘制失败:', error);
        }
    }





    // 姿态绘制（只显示关键点，参考测试页面）
    drawEnhancedPose(pose) {
        if (!pose || !this.ctx) return;

        // ml5.js 0.12.2版本的数据结构：pose.pose.keypoints
        let keypoints;
        if (pose.pose && pose.pose.keypoints) {
            keypoints = pose.pose.keypoints;
        } else if (pose.keypoints) {
            keypoints = pose.keypoints;
        } else {
            console.warn('无法找到关键点数据');
            return;
        }

        // 首次绘制时输出调试信息
        if (!this._drawDebugLogged) {
            const visibleKeypoints = keypoints.filter(kp => (kp.confidence || kp.score) > 0.5);
            console.log(`开始绘制姿态关键点，可见关键点: ${visibleKeypoints.length}/${keypoints.length}`);
            console.log('关键点示例:', keypoints[0]);
            this._drawDebugLogged = true;
        }

        // 只绘制关键点（不绘制骨架线）
        this.drawEnhancedKeypoints(keypoints);
    }

    // 保留原版姿态绘制（向后兼容）
    drawPose(pose) {
        this.drawEnhancedPose(pose);
    }

    // 优化的骨架绘制
    drawSkeleton(keypoints) {
        const connections = [
            [0, 1], [0, 2], [1, 3], [2, 4], // 头部
            [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // 手臂
            [5, 11], [6, 12], [11, 12], // 躯干
            [11, 13], [13, 15], [12, 14], [14, 16] // 腿部
        ];

        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        connections.forEach(([startIdx, endIdx]) => {
            const startPoint = keypoints[startIdx];
            const endPoint = keypoints[endIdx];

            if (startPoint && endPoint) {
                const startConfidence = startPoint.confidence || startPoint.score || 0;
                const endConfidence = endPoint.confidence || endPoint.score || 0;

                if (startConfidence > 0.5 && endConfidence > 0.5) {
                    this.ctx.moveTo(
                        startPoint.position.x,
                        startPoint.position.y
                    );
                    this.ctx.lineTo(
                        endPoint.position.x,
                        endPoint.position.y
                    );
                }
            }
        });

        this.ctx.stroke();
    }

    // 生成骨架连接（用于新API）
    generateSkeleton(keypoints) {
        // BodyPose关键点连接定义
        const connections = [
            [0, 1], [0, 2], [1, 3], [2, 4], // 头部
            [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // 手臂
            [5, 11], [6, 12], [11, 12], // 躯干
            [11, 13], [13, 15], [12, 14], [14, 16] // 腿部
        ];

        const skeleton = [];
        connections.forEach(([startIdx, endIdx]) => {
            const startPoint = keypoints[startIdx];
            const endPoint = keypoints[endIdx];
            if (startPoint && endPoint) {
                skeleton.push([startPoint, endPoint]);
            }
        });

        return skeleton;
    }





    // 获取特定关键点
    getKeypoint(pose, partName) {
        if (!pose || !pose.pose || !pose.pose.keypoints) return null;
        
        const keypoint = pose.pose.keypoints.find(kp => kp.part === partName);
        return keypoint && keypoint.score > 0.5 ? keypoint : null;
    }

    // 获取当前姿态数据
    getCurrentPose() {
        return this.poses.length > 0 ? this.poses[0] : null;
    }

    // 清理资源
    cleanup() {
        this.stopDetection();
        
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        this.video = null;
        this.bodyPose = null;
        this.canvas = null;
        this.ctx = null;
        this.poses = [];
    }

    // 设置回调函数
    setPoseCallback(callback) {
        this.onPoseDetected = callback;
    }



    setModelReadyCallback(callback) {
        this.onModelReady = callback;
    }

    setErrorCallback(callback) {
        this.onError = callback;
    }

    // 骨架绘制
    drawEnhancedSkeleton(keypoints) {
        const connections = [
            [0, 1], [0, 2], [1, 3], [2, 4], // 头部
            [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // 手臂
            [5, 11], [6, 12], [11, 12], // 躯干
            [11, 13], [13, 15], [12, 14], [14, 16] // 腿部
        ];

        // 设置简洁的线条样式
        this.ctx.lineWidth = this.skeletonWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.skeletonColor;

        connections.forEach(([startIdx, endIdx]) => {
            const startPoint = keypoints[startIdx];
            const endPoint = keypoints[endIdx];

            if (startPoint && endPoint) {
                const startConfidence = startPoint.confidence || startPoint.score || 0;
                const endConfidence = endPoint.confidence || endPoint.score || 0;

                if (startConfidence > 0.5 && endConfidence > 0.5) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(startPoint.position.x, startPoint.position.y);
                    this.ctx.lineTo(endPoint.position.x, endPoint.position.y);
                    this.ctx.stroke();
                }
            }
        });
    }

    // 关键点绘制（参考测试页面的绿色关键点）
    drawEnhancedKeypoints(keypoints) {
        this.ctx.fillStyle = '#00ff00'; // 绿色关键点，与测试页面一致
        let drawnCount = 0;
        keypoints.forEach((keypoint) => {
            const confidence = keypoint.confidence || keypoint.score || 0;
            if (confidence > 0.1) { // 降低阈值，与测试页面一致
                this.ctx.beginPath();
                this.ctx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI); // 增大半径，与测试页面一致
                this.ctx.fill();
                drawnCount++;
            }
        });

        // 首次绘制时输出调试信息（减少输出）
        if (!this._keypointDrawDebugLogged && drawnCount > 0) {
            console.log(`✅ 成功绘制 ${drawnCount}/${keypoints.length} 个姿态关键点`);
            this._keypointDrawDebugLogged = true;
        }
    }


}

// 导出类
window.PoseDetector = PoseDetector;
