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

        // 性能优化模式
        this.performanceMode = true; // 启用性能优化

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

            // 在预览模式下不绘制姿态数据，只显示纯净的视频画面
            // 姿态数据只在检测模式下显示

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
        if (this.detectionMode === 'pose') {
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

            // 移除 TensorFlow.js 后端设置，避免与 ml5.js 冲突
            // if (typeof tf !== 'undefined') {
            //     await tf.setBackend('cpu');
            //     console.log('强制使用CPU后端，当前后端:', tf.getBackend());
            // }

            // 检查可用的库 - 只使用 ml5.js 避免冲突
            console.log('检查可用库:');
            console.log('- ml5:', typeof ml5);
            console.log('- ml5.poseNet:', typeof ml5?.poseNet);

            // 只使用 ml5.js PoseNet（避免库冲突）
            if (typeof ml5 !== 'undefined' && typeof ml5.poseNet === 'function') {
                console.log('使用 ml5.js PoseNet（唯一方案）...');
                await this.initML5PoseNet();
                return this.bodyPose;
            }
            else {
                throw new Error('ml5.js 库不可用，请检查库加载');
            }

        } catch (error) {
            console.error('❌ 姿态检测初始化失败:', error);
            throw new Error('姿态检测模型加载失败: ' + error.message);
        }
    }

    // MediaPipe Pose 初始化（高性能模式）
    async initMediaPipePose() {
        const poseDetectionLib = window.poseDetection;
        this.detector = await poseDetectionLib.createDetector(
            poseDetectionLib.SupportedModels.BlazePose,
            {
                runtime: 'tfjs',
                modelType: 'lite',  // 使用轻量模型提高性能
                enableSmoothing: true,
                enableSegmentation: false  // 禁用分割以提高性能
            }
        );

        this.detectionMethod = 'mediapipe';
        console.log('MediaPipe Pose 初始化完成');
    }

    // TensorFlow.js PoseNet 初始化（备选方案）
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

    // 通用检测循环（支持MediaPipe和TensorFlow.js）
    async startUniversalDetection() {
        // 停止之前的检测循环
        if (this.tensorflowDetectionId) {
            cancelAnimationFrame(this.tensorflowDetectionId);
            this.tensorflowDetectionId = null;
        }

        let lastDetectionTime = 0;
        // 根据检测方法调整FPS：MediaPipe性能更好，可以用更高频率
        const detectionFPS = this.detectionMethod === 'mediapipe' ? 20 : 10;

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
                const poses = await this.detector.estimatePoses(this.video);



                if (poses && poses.length > 0) {
                    // 优化数据转换：根据检测方法处理不同格式
                    const canvasWidth = this.canvas.width;
                    const firstPose = poses[0];

                    // 调试：输出原始检测数据
                    if (!this._rawDataLogged) {
                        console.log('原始检测数据:', {
                            method: this.detectionMethod,
                            poseCount: poses.length,
                            keypointCount: firstPose.keypoints?.length,
                            firstKeypoint: firstPose.keypoints?.[0]
                        });
                        this._rawDataLogged = true;
                    }

                    // 根据检测方法转换数据格式
                    let optimizedKeypoints;

                    if (this.detectionMethod === 'mediapipe') {
                        // MediaPipe格式转换（更高效）
                        optimizedKeypoints = this.convertMediaPipeKeypoints(firstPose.keypoints, canvasWidth);
                    } else {
                        // TensorFlow.js格式转换
                        optimizedKeypoints = this.convertTensorFlowKeypoints(firstPose.keypoints, canvasWidth);
                    }

                    // 只保存一个姿态，减少内存使用
                    this.poses = [{
                        pose: {
                            keypoints: optimizedKeypoints,
                            score: firstPose.score || 0.8  // MediaPipe可能没有总体score
                        }
                    }];

                    // 调试信息（仅在首次检测时输出）
                    if (!this._firstPoseDetection) {
                        console.log('✅ 首次检测到姿态数据，姿态数量:', poses.length);
                        console.log('检测方法:', this.detectionMethod);
                        console.log('原始姿态数据:', firstPose);
                        console.log('转换后数据结构:', this.poses[0]);
                        console.log('关键点数量:', this.poses[0].pose.keypoints.length);
                        console.log('前3个关键点:', this.poses[0].pose.keypoints.slice(0, 3));
                        this._firstPoseDetection = true;
                    }

                    // 优化回调处理：减少回调频率，提高性能
                    this._callbackFrameCount = (this._callbackFrameCount || 0) + 1;

                    // 只在特定帧调用回调，减少评分系统负担
                    if (this._callbackFrameCount % 2 === 0 && this.onPoseDetected) {
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

    // MediaPipe关键点转换（修复版本）
    convertMediaPipeKeypoints(keypoints, canvasWidth) {
        const optimizedKeypoints = new Array(keypoints.length);

        for (let i = 0; i < keypoints.length; i++) {
            const kp = keypoints[i];

            // 调试：输出原始MediaPipe数据
            if (i === 0 && !this._mediapipeDebugLogged) {
                console.log('MediaPipe原始关键点数据:', kp);
                this._mediapipeDebugLogged = true;
            }

            optimizedKeypoints[i] = {
                part: this.getMediaPipePartName(i),
                position: {
                    // MediaPipe坐标已经是像素坐标，不需要乘以canvas尺寸
                    x: canvasWidth - kp.x,  // 只需要镜像翻转
                    y: kp.y
                },
                score: kp.visibility || kp.score || 0.8
            };
        }

        return optimizedKeypoints;
    }

    // TensorFlow.js关键点转换（优化版本）
    convertTensorFlowKeypoints(keypoints, canvasWidth) {
        const optimizedKeypoints = new Array(keypoints.length);

        for (let i = 0; i < keypoints.length; i++) {
            const kp = keypoints[i];
            optimizedKeypoints[i] = {
                part: kp.name,
                position: {
                    x: canvasWidth - kp.x,  // TensorFlow.js使用像素坐标
                    y: kp.y
                },
                score: kp.score
            };
        }

        return optimizedKeypoints;
    }

    // MediaPipe关键点索引到部位名称的映射
    getMediaPipePartName(index) {
        const mediaPipeMapping = [
            'nose', 'leftEyeInner', 'leftEye', 'leftEyeOuter', 'rightEyeInner',
            'rightEye', 'rightEyeOuter', 'leftEar', 'rightEar', 'leftMouth',
            'rightMouth', 'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow',
            'leftWrist', 'rightWrist', 'leftPinky', 'rightPinky', 'leftIndex',
            'rightIndex', 'leftThumb', 'rightThumb', 'leftHip', 'rightHip',
            'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle', 'leftHeel',
            'rightHeel', 'leftFootIndex', 'rightFootIndex'
        ];

        return mediaPipeMapping[index] || `point_${index}`;
    }

    // ml5.js PoseNet 初始化（参考页面方式）
    async initML5PoseNet() {
        return new Promise((resolve, reject) => {
            try {
                console.log('开始初始化 ml5.js PoseNet（参考页面方式）...');

                // 检查 ml5 是否可用
                if (typeof ml5 === 'undefined') {
                    throw new Error('ml5.js 库未加载');
                }

                if (typeof ml5.poseNet !== 'function') {
                    throw new Error('ml5.poseNet 不可用');
                }

                // 使用与参考页面完全相同的方式初始化
                this.bodyPose = ml5.poseNet(this.video, () => {
                    console.log('ml5.js PoseNet 模型加载完成');
                    this.detectionMethod = 'ml5';
                    resolve();
                });

                // 设置事件监听器 - 完全按照参考页面的方式
                this.bodyPose.on('pose', (results) => {
                    // 直接存储结果，与参考页面保持一致
                    this.poses = results;

                    // 回调处理 - 传递第一个姿态
                    if (results && results.length > 0 && this.onPoseDetected) {
                        this.onPoseDetected(results[0]);
                    }
                });

                // 添加错误监听器
                this.bodyPose.on('error', (error) => {
                    console.error('ml5.js PoseNet 错误:', error);
                    reject(error);
                });

            } catch (error) {
                console.error('❌ ml5.js PoseNet 初始化失败:', error);
                reject(error);
            }
        });
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

        if (this.detectionMethod === 'mediapipe') {
            console.log('MediaPipe Pose 检测已启动（高性能模式）');
            // 启动通用检测循环
            this.startUniversalDetection();
        } else if (this.detectionMethod === 'tensorflow') {
            console.log('TensorFlow.js 检测已启动');
            // 启动通用检测循环
            this.startUniversalDetection();
        } else if (this.detectionMethod === 'ml5') {
            console.log('ml5.js PoseNet检测已启动');
            // ml5.js 使用事件驱动，不需要手动循环
            if (!this.bodyPose) {
                console.error('ml5.js PoseNet 模型未初始化！');
                return false;
            }
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
        // 取消通用检测循环（支持MediaPipe和TensorFlow.js）
        if (this.tensorflowDetectionId) {
            cancelAnimationFrame(this.tensorflowDetectionId);
            this.tensorflowDetectionId = null;
        }

        // 清除姿态数据，确保关键点不再显示
        this.poses = [];

        // 清除画布上的关键点，只显示视频
        this.clearCanvasAndDrawVideo();

        // 重新启动预览循环
        this.drawVideoFrame();

        console.log('检测已停止，恢复预览模式');
    }

    // 清除画布并只绘制视频（无关键点）
    clearCanvasAndDrawVideo() {
        if (!this.canvas || !this.ctx || !this.video || this.video.readyState < 2) {
            return;
        }

        try {
            // 清除整个画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // 保存当前画布状态
            this.ctx.save();

            // 水平翻转画布以取消镜像效果
            this.ctx.scale(-1, 1);
            this.ctx.translate(-this.canvas.width, 0);

            // 只绘制视频帧，不绘制任何关键点
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            // 恢复画布状态
            this.ctx.restore();

        } catch (error) {
            console.error('清除画布失败:', error);
        }
    }

    // 优化的绘制循环（添加FPS限制和性能监控）
    startOptimizedDrawLoop() {
        // 取消之前的动画帧
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }



        let frameCount = 0;
        let lastFrameTime = 0;
        let fpsCounter = 0;
        let lastFpsTime = performance.now();

        // 优化FPS设置：降低渲染频率，提高性能
        const targetFPS = this.videoOnlyMode ? 15 : 20;

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

            // 绘制当前帧
            this.drawFrame();

            frameCount++;
            fpsCounter++;

            // 每秒计算一次实际FPS
            if (currentTime - lastFpsTime >= 1000) {
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

        // 绘制关键点
        this.drawEnhancedKeypoints(keypoints);

        // 如果启用骨架显示，也绘制骨架
        if (this.showSkeleton) {
            this.drawSkeleton(keypoints);
        }
    }

    // 保留原版姿态绘制（向后兼容）
    drawPose(pose) {
        this.drawEnhancedPose(pose);
    }

    // 优化的骨架绘制
    drawSkeleton(keypoints) {
        // 如果使用 ml5.js，使用其内置的骨架数据
        if (this.detectionMethod === 'ml5' && this.poses.length > 0 && this.poses[0].skeleton) {
            this.drawML5Skeleton(this.poses[0].skeleton);
            return;
        }

        // 其他方法使用手动定义的连接
        const connections = [
            [0, 1], [0, 2], [1, 3], [2, 4], // 头部
            [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // 手臂
            [5, 11], [6, 12], [11, 12], // 躯干
            [11, 13], [13, 15], [12, 14], [14, 16] // 腿部
        ];

        this.ctx.strokeStyle = '#ff0000'; // 红色骨架，与参考页面一致
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        connections.forEach(([startIdx, endIdx]) => {
            const startPoint = keypoints[startIdx];
            const endPoint = keypoints[endIdx];

            if (startPoint && endPoint) {
                const startConfidence = startPoint.confidence || startPoint.score || 0;
                const endConfidence = endPoint.confidence || endPoint.score || 0;

                if (startConfidence > 0.2 && endConfidence > 0.2) {
                    let startX = startPoint.position.x;
                    let startY = startPoint.position.y;
                    let endX = endPoint.position.x;
                    let endY = endPoint.position.y;

                    // 根据检测方法决定是否需要镜像翻转
                    if (this.detectionMethod !== 'ml5') {
                        startX = this.canvas.width - startX;
                        endX = this.canvas.width - endX;
                    }

                    this.ctx.moveTo(startX, startY);
                    this.ctx.lineTo(endX, endY);
                }
            }
        });

        this.ctx.stroke();
    }

    // ml5.js 专用骨架绘制（参考页面方式）
    drawML5Skeleton(skeleton) {
        this.ctx.strokeStyle = '#ff0000'; // 红色骨架，与参考页面一致
        this.ctx.lineWidth = 2; // 与参考页面一致的线宽

        skeleton.forEach(connection => {
            const [partA, partB] = connection;
            if (partA && partB) {
                this.ctx.beginPath();

                // 对于 ml5.js，由于主页面已经是镜像的，需要翻转坐标
                let aX = this.canvas.width - partA.position.x;
                let aY = partA.position.y;
                let bX = this.canvas.width - partB.position.x;
                let bY = partB.position.y;

                this.ctx.moveTo(aX, aY);
                this.ctx.lineTo(bX, bY);
                this.ctx.stroke();
            }
        });
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

    // 截图功能：捕获当前帧和关键点数据
    async captureFrame() {
        try {
            if (!this.video || !this.canvas || !this.ctx) {
                throw new Error('摄像头或画布未初始化');
            }

            if (this.video.readyState < 2) {
                throw new Error('视频未准备就绪');
            }

            // 创建临时画布用于截图
            const captureCanvas = document.createElement('canvas');
            captureCanvas.width = this.canvas.width;
            captureCanvas.height = this.canvas.height;
            const captureCtx = captureCanvas.getContext('2d');

            // 保存当前画布状态
            captureCtx.save();

            // 水平翻转画布以取消镜像效果（与显示保持一致）
            captureCtx.scale(-1, 1);
            captureCtx.translate(-captureCanvas.width, 0);

            // 绘制当前视频帧
            captureCtx.drawImage(this.video, 0, 0, captureCanvas.width, captureCanvas.height);

            // 恢复画布状态
            captureCtx.restore();

            // 获取图片数据
            const imageDataUrl = captureCanvas.toDataURL('image/jpeg', 0.8);

            // 获取当前关键点数据
            let keypoints = null;
            const currentPose = this.getCurrentPose();

            if (currentPose && currentPose.pose && currentPose.pose.keypoints) {
                // 转换关键点格式为标准格式
                keypoints = this.convertKeypointsForCapture(currentPose.pose.keypoints);
            }

            const result = {
                success: true,
                imageData: imageDataUrl,
                keypoints: keypoints,
                timestamp: new Date().toISOString(),
                videoSize: {
                    width: captureCanvas.width,
                    height: captureCanvas.height
                }
            };

            console.log('截图成功，关键点数量:', keypoints ? keypoints.length : 0);
            return result;

        } catch (error) {
            console.error('截图失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 转换关键点格式用于保存
    convertKeypointsForCapture(keypoints) {
        if (!keypoints || !Array.isArray(keypoints)) {
            return [];
        }

        return keypoints.map((kp, index) => {
            let x = kp.position ? kp.position.x : kp.x;
            let y = kp.position ? kp.position.y : kp.y;
            let confidence = kp.score || kp.confidence || 0;
            let name = kp.part || kp.name || `keypoint_${index}`;

            // 确保坐标是数字
            x = typeof x === 'number' ? x : 0;
            y = typeof y === 'number' ? y : 0;
            confidence = typeof confidence === 'number' ? confidence : 0;

            return {
                name: name,
                x: x,
                y: y,
                confidence: confidence,
                visible: confidence > 0.2
            };
        }).filter(kp => kp.confidence > 0.1); // 过滤掉置信度过低的关键点
    }

    // 对静态图片进行姿态检测
    async detectPoseInImage(imageElement) {
        try {
            if (!this.bodyPose && !this.detector) {
                throw new Error('姿态检测模型未初始化');
            }

            console.log('开始对图片进行姿态检测...');

            let poses = [];

            if (this.detectionMethod === 'ml5' && this.bodyPose) {
                // ml5.js对静态图片检测支持有限，直接返回失败
                console.log('ml5.js不支持静态图片检测，建议使用摄像头截图功能');
                poses = [];
            } else if (this.detector) {
                // 使用TensorFlow.js或MediaPipe检测
                poses = await this.detector.estimatePoses(imageElement);
            }

            if (poses && poses.length > 0) {
                const firstPose = poses[0];
                let keypoints = [];

                if (this.detectionMethod === 'ml5') {
                    // ml5.js格式
                    keypoints = firstPose.pose ? firstPose.pose.keypoints : firstPose.keypoints;
                } else {
                    // TensorFlow.js/MediaPipe格式
                    keypoints = firstPose.keypoints;
                }

                // 转换关键点格式
                const convertedKeypoints = this.convertKeypointsForCapture(keypoints);

                console.log('图片姿态检测成功，关键点数量:', convertedKeypoints.length);

                return {
                    success: true,
                    keypoints: convertedKeypoints,
                    confidence: firstPose.score || 0.8
                };
            } else {
                return {
                    success: false,
                    error: '未检测到姿态'
                };
            }

        } catch (error) {
            console.error('图片姿态检测失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
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

    // 关键点绘制（参考页面方式）
    drawEnhancedKeypoints(keypoints) {
        // 使用与参考页面完全相同的绘制方式
        this.ctx.fillStyle = '#ff0000'; // 红色关键点
        this.ctx.strokeStyle = 'transparent'; // 无边框

        let drawnCount = 0;
        let totalCount = 0;

        keypoints.forEach((keypoint, index) => {
            totalCount++;
            const confidence = keypoint.score || keypoint.confidence || 0;

            // 调试：输出前几个关键点的信息（仅一次）
            if (index < 3 && !this._keypointDebugLogged) {
                console.log(`关键点${index} (${keypoint.part}):`, {
                    position: keypoint.position,
                    confidence: confidence
                });
            }

            // 使用与参考页面相同的阈值和绘制方式
            if (confidence > 0.2) {
                this.ctx.beginPath();

                // 对于 ml5.js，由于主页面已经是镜像的，需要再次翻转来匹配参考页面效果
                let x = keypoint.position.x;
                let y = keypoint.position.y;

                // 主页面的画布已经是镜像的，所以 ml5.js 的坐标需要翻转
                if (this.detectionMethod === 'ml5') {
                    x = this.canvas.width - x; // 镜像翻转X坐标以匹配镜像画面
                }

                // 使用与参考页面相同的圆点大小
                this.ctx.arc(x, y, 5, 0, 2 * Math.PI); // 与参考页面一致的大小
                this.ctx.fill();
                drawnCount++;
            }
        });

        // 设置调试标志
        if (!this._keypointDebugLogged) {
            this._keypointDebugLogged = true;
        }

        // 首次绘制时输出调试信息（减少输出）
        if (!this._keypointDrawDebugLogged && drawnCount > 0) {
            console.log(`✅ 成功绘制 ${drawnCount}/${totalCount} 个姿态关键点 (方法: ${this.detectionMethod})`);
            this._keypointDrawDebugLogged = true;
        }
    }


}

// 导出类
window.PoseDetector = PoseDetector;
