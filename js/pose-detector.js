// 增强版姿态检测器类
class PoseDetector {
    constructor() {
        this.video = null;
        this.bodyPose = null;
        this.poses = [];
        this.isDetecting = false;
        this.canvas = null;
        this.ctx = null;
        this.videoWidth = 640;
        this.videoHeight = 480;

        // 显示控制
        this.showSkeleton = true; // 是否显示骨骼和关节点

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

            // 水平翻转画布（镜像效果）
            this.ctx.save();
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(this.video, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
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

    // 初始化 BodyPose 模型 (新API)
    async initPoseNet() {
        console.log('正在加载 BodyPose 模型...');

        try {
            // 检查ml5和video是否可用
            if (typeof ml5 === 'undefined') {
                throw new Error('ml5.js库未加载');
            }

            if (typeof ml5.poseNet !== 'function') {
                throw new Error('ml5.poseNet功能不可用，请检查ml5.js版本');
            }

            if (!this.video) {
                throw new Error('视频元素未初始化');
            }

            console.log('开始创建PoseNet实例...');

            // 强制使用CPU后端避免WebGL问题
            if (typeof tf !== 'undefined') {
                await tf.setBackend('cpu');
                console.log('强制使用CPU后端，当前后端:', tf.getBackend());
            }

            // 使用ml5.js 0.12.2 API，简化配置避免WebGL问题
            this.bodyPose = await ml5.poseNet(this.video, {
                architecture: 'MobileNetV1',
                imageScaleFactor: 0.5,  // 增加缩放因子减少计算量
                outputStride: 16,
                flipHorizontal: false,
                minConfidence: this.poseConfig.minConfidence,
                maxPoseDetections: 1,   // 减少检测数量
                scoreThreshold: 0.5,
                detectionType: 'single'
            });

            // 设置事件监听器
            this.bodyPose.on('pose', (results) => {
                this.poses = results;

                // 调试信息（仅在首次检测时输出）
                if (results.length > 0 && !this._firstPoseDetection) {
                    console.log('✅ 首次检测到姿态数据，姿态数量:', results.length);
                    console.log('姿态数据结构:', results[0]);
                    this._firstPoseDetection = true;
                } else if (!this._noPoseWarning && results.length === 0) {
                    console.log('⚠️ 暂未检测到姿态');
                    this._noPoseWarning = true;
                }

                if (this.onPoseDetected && results.length > 0) {
                    this.onPoseDetected(results[0]);
                }
            });

            // 添加错误监听器
            this.bodyPose.on('error', (error) => {
                console.error('PoseNet错误:', error);
            });

            console.log('PoseNet 模型加载完成');
            return this.bodyPose;

        } catch (error) {
            console.error('PoseNet初始化失败:', error);
            throw new Error('PoseNet模型加载失败: ' + error.message);
        }
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
        if (!this.video || !this.bodyPose) {
            console.error('摄像头或BodyPose模型未初始化');
            console.log('video:', !!this.video, 'bodyPose:', !!this.bodyPose);
            return false;
        }

        console.log('开始姿态检测');
        console.log('showSkeleton:', this.showSkeleton);
        console.log('poses数组长度:', this.poses.length);
        console.log('canvas:', !!this.canvas, 'ctx:', !!this.ctx);

        // 在0.12.2版本中，PoseNet会自动开始检测
        // 事件监听器已在initPoseNet中设置
        console.log('PoseNet检测已启动（自动模式）');



        // 停止预览循环
        if (this.previewFrameId) {
            cancelAnimationFrame(this.previewFrameId);
            this.previewFrameId = null;
        }

        this.isDetecting = true;
        // 重置调试标志
        this._noPoseWarningLogged = false;
        this._skeletonDisabledLogged = false;
        this._handDrawLogged = false;

        // 启动优化的绘制循环
        this.startOptimizedDrawLoop();

        console.log('检测已启动');
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

        // 重新启动预览循环
        this.drawVideoFrame();

        console.log('检测已停止，恢复预览模式');
    }

    // 简化的绘制循环
    startOptimizedDrawLoop() {
        // 取消之前的动画帧
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        console.log('🎬 启动简化绘制循环');

        let frameCount = 0;

        const draw = () => {
            if (!this.isDetecting) {
                console.log('🛑 绘制循环停止');
                this.animationFrameId = null;
                return;
            }

            // 直接绘制，不限制帧率
            this.drawFrame();
            frameCount++;

            // 每60帧输出一次调试信息
            if (frameCount % 60 === 0) {
                console.log(`🎥 绘制帧数: ${frameCount}, 姿态数量: ${this.poses.length}`);
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

            // 绘制镜像视频帧
            this.ctx.save();
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(this.video, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();

            // 绘制姿态（如果启用）
            if (this.showSkeleton && this.poses.length > 0) {
                this.drawPose(this.poses[0]);
            }

            // 绘制手部检测结果（如果有外部手部检测器）
            if (this.externalHandDetector && this.externalHandDetector.drawHands) {
                this.externalHandDetector.drawHands();
            }

        } catch (error) {
            console.error('绘制失败:', error);
        }
    }





    // 优化的姿态绘制
    drawPose(pose) {
        if (!pose || !pose.keypoints || !this.ctx) return;

        const keypoints = pose.keypoints;

        // 首次绘制时输出调试信息
        if (!this._drawDebugLogged) {
            const visibleKeypoints = keypoints.filter(kp => kp.confidence > 0.5);
            console.log(`开始绘制姿态，可见关键点: ${visibleKeypoints.length}/${keypoints.length}`);
            this._drawDebugLogged = true;
        }

        // 批量绘制关键点以提高性能
        this.ctx.fillStyle = '#ff0000';
        keypoints.forEach((keypoint) => {
            if (keypoint.confidence > 0.5) {
                this.ctx.beginPath();
                this.ctx.arc(
                    this.canvas.width - keypoint.x,
                    keypoint.y,
                    5, 0, 2 * Math.PI
                );
                this.ctx.fill();
            }
        });

        // 优化的骨架连接线绘制
        this.drawSkeleton(keypoints);
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

            if (startPoint && endPoint &&
                startPoint.confidence > 0.5 && endPoint.confidence > 0.5) {
                this.ctx.moveTo(this.canvas.width - startPoint.x, startPoint.y);
                this.ctx.lineTo(this.canvas.width - endPoint.x, endPoint.y);
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
}

// 导出类
window.PoseDetector = PoseDetector;
