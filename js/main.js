// 主应用类
class RhythmPoseApp {
    constructor() {
        this.poseDefinitions = new PoseDefinitions();
        this.poseDetector = new PoseDetector();
        this.handDetector = new HandDetector();
        this.mediaPipeHandDetector = new MediaPipeHandDetector();
        this.scoringSystem = new ScoringSystem(this.poseDefinitions);

        this.isInitialized = false;
        this.isDetecting = false;
        this.currentPoseKey = 'tree';
        this.currentDetectionMode = 'pose';

        // UI 元素
        this.elements = {};

        this.init();
    }

    // 初始化应用
    async init() {
        this.initializeElements();
        this.setupEventListeners();
        this.setupCallbacks();
        this.updateUI();
        await this.checkCameraSupport();

        console.log('Rhythm Pose 应用初始化完成');
    }

    // 检查摄像头支持
    async checkCameraSupport() {
        // 强制使用CPU后端避免WebGL问题
        if (typeof tf !== 'undefined') {
            try {
                await tf.setBackend('cpu');
                console.log('✅ 强制使用CPU后端，避免WebGL问题');
            } catch (error) {
                console.warn('设置CPU后端失败:', error);
            }
        }

        // 检查ml5.js库
        if (typeof ml5 === 'undefined') {
            this.updateStatus('model', '库未加载', 'error');
            this.elements.poseFeedback.textContent = 'ml5.js库未加载，请检查网络连接并刷新页面';
            this.elements.cameraBtn.disabled = true;
            this.elements.startBtn.disabled = true;
            return false;
        }

        // 检查PoseNet功能 (ml5.js 0.12.2版本)
        if (typeof ml5.poseNet !== 'function') {
            this.updateStatus('model', '功能不可用', 'error');
            this.elements.poseFeedback.textContent = 'PoseNet功能不可用，请检查ml5.js版本';
            this.elements.cameraBtn.disabled = true;
            this.elements.startBtn.disabled = true;
            return false;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.updateStatus('camera', '不支持', 'error');
            this.elements.poseFeedback.textContent = '您的浏览器不支持摄像头访问，请使用现代浏览器';
            this.elements.cameraBtn.disabled = true;
            this.elements.startBtn.disabled = true;
            return false;
        }

        // 检查是否为HTTPS或localhost
        const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (!isSecure) {
            this.updateStatus('camera', '需要HTTPS', 'error');
            this.elements.poseFeedback.textContent = '摄像头访问需要HTTPS环境，请使用https://或localhost访问';
            this.elements.cameraBtn.disabled = true;
            return false;
        }

        // 检查手势检测功能
        this.checkHandDetectionSupport();

        this.updateStatus('model', '已就绪', 'ready');
        this.elements.poseFeedback.textContent = '点击"启用摄像头"开始使用';
        return true;
    }

    // 检查手势检测支持
    async checkHandDetectionSupport() {
        try {
            // 检查ml5.js HandPose
            const hasML5HandPose = typeof ml5 !== 'undefined' && typeof ml5.handPose === 'function';

            // 检查MediaPipe Hands
            const hasMediaPipe = typeof Hands !== 'undefined';

            if (hasML5HandPose || hasMediaPipe) {
                console.log('手势检测功能可用');
                this.handDetectionSupported = true;
            } else {
                console.warn('手势检测功能不可用，将只支持姿态检测');
                this.handDetectionSupported = false;
                this.hideHandDetectionOptions();
            }
        } catch (error) {
            console.error('检查手势检测支持时出错:', error);
            this.handDetectionSupported = false;
            this.hideHandDetectionOptions();
        }
    }

    // 隐藏手部检测选项
    hideHandDetectionOptions() {
        const modeSelect = this.elements.modeSelect;
        // 移除手部相关选项
        for (let i = modeSelect.options.length - 1; i >= 0; i--) {
            const option = modeSelect.options[i];
            if (option.value === 'hands' || option.value === 'both') {
                modeSelect.removeChild(option);
            }
        }
        // 确保选择的是pose模式
        modeSelect.value = 'pose';
        this.changeDetectionMode('pose');
    }

    // 初始化UI元素引用
    initializeElements() {
        this.elements = {
            cameraStatus: document.getElementById('camera-status'),
            modelStatus: document.getElementById('model-status'),
            detectionStatus: document.getElementById('detection-status'),
            cameraBtn: document.getElementById('camera-btn'),
            startBtn: document.getElementById('start-btn'),
            stopBtn: document.getElementById('stop-btn'),
            resetBtn: document.getElementById('reset-btn'),
            modeSelect: document.getElementById('mode-select'),
            poseSelect: document.getElementById('pose-select'),
            showSkeleton: document.getElementById('show-skeleton'),
            poseInstructions: document.getElementById('pose-instructions'),
            poseFeedback: document.getElementById('pose-feedback'),
            currentScore: document.getElementById('current-score'),
            bestScore: document.getElementById('best-score'),
            accuracyScore: document.getElementById('accuracy-score'),
            stabilityScore: document.getElementById('stability-score'),
            durationScore: document.getElementById('duration-score')
        };
    }

    // 设置事件监听器
    setupEventListeners() {
        // 摄像头开关按钮
        this.elements.cameraBtn.addEventListener('click', () => {
            this.toggleCamera();
        });

        // 开始按钮
        this.elements.startBtn.addEventListener('click', () => {
            this.startDetection();
        });

        // 停止按钮
        this.elements.stopBtn.addEventListener('click', () => {
            this.stopDetection();
        });

        // 重置按钮
        this.elements.resetBtn.addEventListener('click', () => {
            this.resetApp();
        });

        // 检测模式选择
        this.elements.modeSelect.addEventListener('change', (e) => {
            this.changeDetectionMode(e.target.value);
        });

        // 动作选择
        this.elements.poseSelect.addEventListener('change', (e) => {
            this.changePose(e.target.value);
        });

        // 显示控制开关
        this.elements.showSkeleton.addEventListener('change', (e) => {
            this.toggleSkeletonDisplay(e.target.checked);
        });

        // 页面卸载时清理资源
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // 初始化骨骼显示状态
        const showSkeletonChecked = this.elements.showSkeleton.checked;
        this.toggleSkeletonDisplay(showSkeletonChecked);
        console.log('初始化骨骼显示状态:', showSkeletonChecked);
    }

    // 设置回调函数
    setupCallbacks() {
        // 姿态检测回调
        this.poseDetector.setPoseCallback((pose) => {
            this.onPoseDetected(pose);
        });

        // 手势检测回调
        this.handDetector.setHandCallback((hands, gestures) => {
            this.onHandDetected(hands, gestures);
        });

        // MediaPipe手部检测回调
        this.mediaPipeHandDetector.setHandCallback((hands) => {
            this.onMediaPipeHandDetected(hands);
        });

        // 模型就绪回调
        this.poseDetector.setModelReadyCallback(() => {
            this.onModelReady();
        });

        this.handDetector.setModelReadyCallback(() => {
            this.onHandModelReady();
        });

        this.mediaPipeHandDetector.setModelReadyCallback(() => {
            this.onMediaPipeHandModelReady();
        });

        // 错误回调
        this.poseDetector.setErrorCallback((error) => {
            this.onError(error);
        });

        this.handDetector.setErrorCallback((error) => {
            this.onError(error);
        });

        this.mediaPipeHandDetector.setErrorCallback((error) => {
            this.onError(error);
        });
    }

    // 切换摄像头开关
    async toggleCamera() {
        if (this.poseDetector.video && this.poseDetector.video.srcObject) {
            // 关闭摄像头
            this.closeCamera();
        } else {
            // 启用摄像头
            await this.enableCamera();
        }
    }

    // 启用摄像头
    async enableCamera() {
        try {
            console.log('启用摄像头');
            this.elements.cameraBtn.disabled = true;
            this.elements.cameraBtn.textContent = '启用中...';
            this.updateStatus('camera', '启用中...', 'loading');
            this.elements.poseFeedback.textContent = '正在启用摄像头，请允许权限...';

            // 初始化摄像头并显示画面
            await this.poseDetector.initCamera();

            // 设置手势检测器的视频源
            if (this.handDetectionSupported) {
                this.handDetector.setVideo(this.poseDetector.video);
            }

            // 设置MediaPipe手部检测器的视频源和画布
            this.mediaPipeHandDetector.setVideo(this.poseDetector.video);
            this.mediaPipeHandDetector.setCanvas(this.poseDetector.canvas);

            // 设置pose-detector的外部手部检测器引用
            this.poseDetector.setExternalHandDetector(this.mediaPipeHandDetector);

            this.updateStatus('camera', '已连接', 'connected');
            this.elements.poseFeedback.textContent = '摄像头已启用！现在可以开始检测了。';
            this.elements.startBtn.disabled = false;
            this.elements.cameraBtn.textContent = '关闭摄像头';

            console.log('摄像头启用成功');

        } catch (error) {
            console.error('摄像头启用失败:', error);
            this.updateStatus('camera', '启用失败', 'error');
            this.elements.poseFeedback.textContent = '摄像头启用失败: ' + error.message;
            this.elements.cameraBtn.textContent = '启用摄像头';
        } finally {
            this.elements.cameraBtn.disabled = false;
        }
    }

    // 关闭摄像头
    closeCamera() {
        console.log('关闭摄像头');

        // 停止检测
        if (this.isDetecting) {
            this.stopDetection();
        }

        // 关闭摄像头流
        if (this.poseDetector.video && this.poseDetector.video.srcObject) {
            const tracks = this.poseDetector.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.poseDetector.video.srcObject = null;
        }

        // 清空画布
        const container = document.getElementById('video-wrapper');
        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 400px; color: #6c757d; font-size: 1.2rem;">摄像头已关闭</div>';

        // 更新状态
        this.updateStatus('camera', '未连接', '');
        this.elements.poseFeedback.textContent = '点击"启用摄像头"开始使用';
        this.elements.cameraBtn.textContent = '启用摄像头';
        this.elements.startBtn.disabled = true;

        console.log('摄像头已关闭');
    }

    // 初始化AI模型
    async initAIModels() {
        const mode = this.currentDetectionMode;

        // 初始化BodyPose（姿态检测）
        if ((mode === 'pose' || mode === 'both') && !this.poseDetector.bodyPose) {
            console.log('开始加载BodyPose模型');
            this.updateStatus('model', '加载BodyPose...', 'loading');
            this.elements.poseFeedback.textContent = '正在加载BodyPose模型，请稍候...';

            try {
                await this.poseDetector.initPoseNet();
                console.log('BodyPose模型加载成功');
            } catch (error) {
                console.error('BodyPose加载失败:', error);
                throw new Error('BodyPose模型加载失败: ' + error.message);
            }
        }

        // 初始化手势检测
        if ((mode === 'hands' || mode === 'both') && this.handDetectionSupported) {
            console.log('开始加载手势检测模型');
            this.updateStatus('model', '加载手势检测...', 'loading');
            this.elements.poseFeedback.textContent = '正在加载手势检测模型，请稍候...';

            try {
                await this.handDetector.initHandDetection();
                console.log('手势检测模型加载成功');
            } catch (error) {
                console.error('手势检测加载失败:', error);
                // 手势检测失败时降级到只使用姿态检测
                if (mode === 'hands') {
                    this.currentDetectionMode = 'pose';
                    await this.initAIModels(); // 重新初始化
                    return;
                }
            }
        }

        // 初始化MediaPipe手部检测
        if (mode === 'hands' || mode === 'both') {
            console.log('开始加载MediaPipe手部检测模型');
            this.updateStatus('model', '加载MediaPipe手部检测...', 'loading');
            this.elements.poseFeedback.textContent = '正在加载MediaPipe手部检测模型，请稍候...';

            try {
                const success = await this.mediaPipeHandDetector.initHandDetection();
                if (success) {
                    console.log('MediaPipe手部检测模型加载成功');
                } else {
                    console.warn('MediaPipe手部检测加载失败，将使用ml5.js手势检测');
                    // 如果只选择了手势模式，降级到姿态检测
                    if (mode === 'hands') {
                        this.currentDetectionMode = 'pose';
                        this.elements.poseFeedback.textContent = 'MediaPipe加载失败，已切换到姿态检测模式';
                        await this.initAIModels(); // 重新初始化
                        return;
                    }
                }
            } catch (error) {
                console.error('MediaPipe手部检测初始化错误:', error);
                // 同样的降级逻辑
                if (mode === 'hands') {
                    this.currentDetectionMode = 'pose';
                    this.elements.poseFeedback.textContent = 'MediaPipe初始化失败，已切换到姿态检测模式';
                    await this.initAIModels();
                    return;
                }
            }
        }

        this.updateStatus('model', '已就绪', 'ready');
    }

    // 开始检测
    async startDetection() {
        try {
            console.log('用户点击开始检测');

            // 检查摄像头是否已启用
            if (!this.poseDetector.video || !this.poseDetector.video.srcObject) {
                this.elements.poseFeedback.textContent = '请先启用摄像头';
                return;
            }

            this.updateStatus('detection', '初始化中...', 'loading');
            this.elements.startBtn.disabled = true;

            // 初始化AI模型
            await this.initAIModels();

            // 开始检测
            console.log('开始检测，模式:', this.currentDetectionMode);

            let detectionStarted = false;

            // 启动姿态检测
            if (this.currentDetectionMode === 'pose' || this.currentDetectionMode === 'both') {
                if (this.poseDetector.startDetection()) {
                    detectionStarted = true;
                    console.log('姿态检测已启动');
                }
            }

            // 启动手势检测（仅在手势模式下）
            if (this.currentDetectionMode === 'hands') {
                // 在手势模式下也需要启动pose-detector来提供绘制循环
                if (this.poseDetector.startDetection()) {
                    detectionStarted = true;
                    console.log('绘制循环已启动（手势模式）');
                }

                if (this.handDetectionSupported && this.handDetector.startDetection()) {
                    detectionStarted = true;
                    console.log('手势检测已启动');
                }

                // 初始化并启动MediaPipe手部检测
                try {
                    await this.mediaPipeHandDetector.initHandDetection();
                    if (await this.mediaPipeHandDetector.startDetection()) {
                        detectionStarted = true;
                        console.log('MediaPipe手部检测已启动');
                    }
                } catch (error) {
                    console.warn('MediaPipe手部检测启动失败:', error);
                }
            }

            if (detectionStarted) {
                this.isDetecting = true;
                this.updateStatus('detection', '检测中', 'connected');
                this.elements.stopBtn.disabled = false;
                this.elements.startBtn.disabled = true;

                // 设置当前动作
                this.scoringSystem.setCurrentPose(this.currentPoseKey);
                this.elements.poseFeedback.textContent = '检测已开始，请按照指导完成动作';
            } else {
                throw new Error('无法启动检测');
            }
        } catch (error) {
            console.error('启动检测失败:', error);
            this.onError(error.message || '启动失败');
            this.elements.startBtn.disabled = false;
            this.updateStatus('detection', '启动失败', 'error');
        }
    }

    // 停止检测
    stopDetection() {
        this.poseDetector.stopDetection();
        if (this.handDetectionSupported) {
            this.handDetector.stopDetection();
        }
        // 停止MediaPipe手部检测
        this.mediaPipeHandDetector.stopDetection();
        this.isDetecting = false;

        this.updateStatus('detection', '已停止', 'ready');
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;

        console.log('停止检测');
    }

    // 重置应用
    resetApp() {
        this.stopDetection();
        this.scoringSystem.resetScores();
        this.updateScoreDisplay({
            currentScore: 0,
            bestScore: 0,
            accuracy: 0,
            stability: 0,
            duration: 0,
            holdTime: 0
        });

        // 如果摄像头已启用，显示相应提示
        if (this.poseDetector.video && this.poseDetector.video.srcObject) {
            this.elements.poseFeedback.textContent = '已重置，可以重新开始检测';
        } else {
            this.elements.poseFeedback.textContent = '点击"启用摄像头"开始使用';
        }

        console.log('应用已重置');
    }

    // 切换检测模式
    changeDetectionMode(mode) {
        this.currentDetectionMode = mode;

        // 更新pose-detector的检测模式
        this.poseDetector.setDetectionMode(mode);

        // 根据模式更新动作选项
        this.updatePoseOptions(mode);

        // 如果正在检测，需要重新初始化模型
        if (this.isDetecting) {
            this.elements.poseFeedback.textContent = '检测模式已切换，请重新开始检测';
            this.stopDetection();
        }

        console.log('检测模式切换为:', mode);
    }

    // 根据检测模式更新动作选项
    updatePoseOptions(mode) {
        const poseSelect = this.elements.poseSelect;
        poseSelect.innerHTML = '';

        if (mode === 'pose' || mode === 'both') {
            // 人体姿势动作
            const poseOptions = [
                { value: 'tree', text: '树式 (瑜伽)' },
                { value: 'warrior', text: '战士式 (瑜伽)' },
                { value: 'plank', text: '平板支撑' },
                { value: 'squat', text: '深蹲' },
                { value: 'jumping-jacks', text: '开合跳' }
            ];
            poseOptions.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.text;
                poseSelect.appendChild(optionElement);
            });
        }

        if (mode === 'hands' || mode === 'both') {
            // 手部动作
            const handOptions = [
                { value: 'wave', text: '挥手' },
                { value: 'thumbs-up', text: '点赞' },
                { value: 'peace', text: '比心/胜利手势' },
                { value: 'fist', text: '握拳' },
                { value: 'open-palm', text: '张开手掌' }
            ];
            handOptions.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.text;
                poseSelect.appendChild(optionElement);
            });
        }

        // 设置默认选项
        if (poseSelect.options.length > 0) {
            this.changePose(poseSelect.options[0].value);
        }
    }

    // 切换动作
    changePose(poseKey) {
        this.currentPoseKey = poseKey;
        const pose = this.poseDefinitions.getPose(poseKey);

        if (pose) {
            // 更新指导信息
            this.elements.poseInstructions.innerHTML = this.poseDefinitions.getInstructions(poseKey);

            // 重置评分系统
            this.scoringSystem.setCurrentPose(poseKey);

            console.log('切换到动作:', pose.name);
        } else {
            // 处理手部动作
            this.updateHandGestureInstructions(poseKey);
        }
    }

    // 更新手部动作指导
    updateHandGestureInstructions(gestureKey) {
        const instructions = {
            'wave': '1. 抬起右手<br>2. 手掌张开<br>3. 左右摆动手腕<br>4. 保持自然微笑',
            'thumbs-up': '1. 握拳<br>2. 竖起拇指<br>3. 其他手指弯曲<br>4. 保持姿势3秒',
            'peace': '1. 抬起手<br>2. 伸出食指和中指<br>3. 其他手指弯曲<br>4. 形成V字手势',
            'fist': '1. 五指弯曲<br>2. 握紧拳头<br>3. 拇指在外<br>4. 保持紧握状态',
            'open-palm': '1. 手掌完全张开<br>2. 五指分开<br>3. 手掌朝向摄像头<br>4. 保持稳定'
        };

        this.elements.poseInstructions.innerHTML = instructions[gestureKey] || '请选择一个手势';
        console.log('切换到手势:', gestureKey);
    }

    // 姿态检测回调
    onPoseDetected(pose) {
        if (!this.isDetecting) return;

        // 评估姿态并获取分数
        const scoreData = this.scoringSystem.evaluatePose(pose);

        // 更新UI显示
        this.updateScoreDisplay(scoreData);
        this.updateFeedback(scoreData);
    }

    // 手部检测回调
    onHandDetected(hands, gestures) {
        if (!this.isDetecting) return;

        // 更新反馈
        this.updateHandFeedback(hands, gestures);
    }

    // MediaPipe手部检测回调
    onMediaPipeHandDetected(hands) {
        if (!this.isDetecting) return;

        console.log('MediaPipe检测到手部:', hands.length);

        // 将MediaPipe手部数据转换为手势识别结果
        if (hands && hands.length > 0) {
            // 转换MediaPipe格式到标准格式
            const convertedHands = this.convertMediaPipeToStandardFormat(hands);

            // 进行手势识别
            const gestures = convertedHands.map(hand => this.recognizeGesture(hand.keypoints));

            // 更新手部反馈
            this.updateHandFeedback(convertedHands, gestures);
        } else {
            // 没有检测到手部
            this.elements.poseFeedback.textContent = '请将手放在摄像头前';
        }
    }

    // 将MediaPipe手部数据转换为标准格式
    convertMediaPipeToStandardFormat(mediaPipeHands) {
        return mediaPipeHands.map(landmarks => {
            // MediaPipe返回的是归一化坐标数组
            const keypoints = landmarks.map((landmark, index) => ({
                x: landmark.x,
                y: landmark.y,
                z: landmark.z || 0,
                confidence: 1.0, // MediaPipe通常不提供单个关键点的置信度
                name: this.getKeypointName(index)
            }));

            return {
                keypoints: keypoints,
                handedness: 'unknown', // MediaPipe可能提供这个信息，但这里简化处理
                confidence: 1.0
            };
        });
    }

    // 获取关键点名称
    getKeypointName(index) {
        const names = [
            'wrist', 'thumb_cmc', 'thumb_mcp', 'thumb_ip', 'thumb_tip',
            'index_mcp', 'index_pip', 'index_dip', 'index_tip',
            'middle_mcp', 'middle_pip', 'middle_dip', 'middle_tip',
            'ring_mcp', 'ring_pip', 'ring_dip', 'ring_tip',
            'pinky_mcp', 'pinky_pip', 'pinky_dip', 'pinky_tip'
        ];
        return names[index] || `point_${index}`;
    }

    // 手势模型就绪回调
    onHandModelReady() {
        console.log('手势检测模型已就绪');
    }

    // MediaPipe手部模型就绪回调
    onMediaPipeHandModelReady() {
        console.log('MediaPipe手部检测模型已就绪');
    }

    // 分析手部手势
    analyzeHandGestures(hands) {
        if (!hands || hands.length === 0) {
            return { detected: false, gesture: 'none', confidence: 0 };
        }

        const hand = hands[0]; // 分析第一只检测到的手
        if (!hand.keypoints || hand.keypoints.length < 21) {
            return { detected: false, gesture: 'none', confidence: 0 };
        }

        // 简单的手势识别逻辑
        const gesture = this.recognizeGesture(hand.keypoints);

        return {
            detected: true,
            gesture: gesture.name,
            confidence: gesture.confidence,
            handedness: hand.handedness || 'unknown'
        };
    }

    // 识别手势
    recognizeGesture(keypoints) {
        // 获取关键点位置
        const thumb_tip = keypoints[4];
        const thumb_ip = keypoints[3];
        const index_tip = keypoints[8];
        const index_pip = keypoints[6];
        const middle_tip = keypoints[12];
        const middle_pip = keypoints[10];
        const ring_tip = keypoints[16];
        const ring_pip = keypoints[14];
        const pinky_tip = keypoints[20];
        const pinky_pip = keypoints[18];

        // 检查手指是否伸直（简化判断）
        const isThumbUp = thumb_tip.y < thumb_ip.y;
        const isIndexUp = index_tip.y < index_pip.y;
        const isMiddleUp = middle_tip.y < middle_pip.y;
        const isRingUp = ring_tip.y < ring_pip.y;
        const isPinkyUp = pinky_tip.y < pinky_pip.y;

        // 简单的手势识别
        if (isThumbUp && !isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
            return { name: 'thumbs-up', confidence: 0.8 };
        } else if (!isThumbUp && isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) {
            return { name: 'peace', confidence: 0.8 };
        } else if (!isThumbUp && !isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
            return { name: 'fist', confidence: 0.8 };
        } else if (isThumbUp && isIndexUp && isMiddleUp && isRingUp && isPinkyUp) {
            return { name: 'open-palm', confidence: 0.8 };
        } else if (isIndexUp && isMiddleUp && isRingUp && isPinkyUp) {
            // 挥手手势：四个手指伸直（拇指可选）
            return { name: 'wave', confidence: 0.7 };
        } else {
            return { name: 'unknown', confidence: 0.3 };
        }
    }

    // 更新手部反馈
    updateHandFeedback(hands, gestures) {
        if (!hands || hands.length === 0) {
            this.elements.poseFeedback.textContent = '请将手放在摄像头前';
            return;
        }

        const currentGesture = this.currentPoseKey;
        let bestMatch = null;
        let bestConfidence = 0;

        // 找到最佳匹配的手势
        gestures.forEach(gesture => {
            if (gesture.confidence > bestConfidence) {
                bestMatch = gesture;
                bestConfidence = gesture.confidence;
            }
        });

        if (bestMatch) {
            if (bestMatch.name === currentGesture) {
                this.elements.poseFeedback.textContent =
                    `✅ 检测到正确手势: ${bestMatch.name} (置信度: ${(bestMatch.confidence * 100).toFixed(1)}%)`;

                // 更新评分（简化版）
                this.updateScoreDisplay({
                    currentScore: Math.round(bestMatch.confidence * 100),
                    bestScore: Math.max(this.scoringSystem.bestScore, Math.round(bestMatch.confidence * 100)),
                    accuracy: Math.round(bestMatch.confidence * 100),
                    stability: 85,
                    duration: 0,
                    holdTime: 0
                });
            } else {
                this.elements.poseFeedback.textContent =
                    `检测到手势: ${bestMatch.name}，目标手势: ${currentGesture}`;
            }
        } else {
            this.elements.poseFeedback.textContent = '未识别的手势，请尝试标准手势';
        }
    }

    // 模型就绪回调
    onModelReady() {
        this.updateStatus('model', '已就绪', 'ready');
        this.elements.startBtn.disabled = false;
        console.log('AI 模型已就绪');
    }

    // 错误处理回调
    onError(error) {
        console.error('应用错误:', error);
        this.updateStatus('detection', '错误', 'error');
        this.elements.poseFeedback.textContent = '错误: ' + error;
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
    }

    // 更新状态显示
    updateStatus(type, text, className) {
        const element = this.elements[type + 'Status'];
        if (element) {
            element.textContent = text;
            element.className = 'status ' + className;
        }
    }

    // 更新分数显示
    updateScoreDisplay(scoreData) {
        this.elements.currentScore.textContent = scoreData.currentScore;
        this.elements.bestScore.textContent = scoreData.bestScore;
        this.elements.accuracyScore.textContent = scoreData.accuracy + '%';
        this.elements.stabilityScore.textContent = scoreData.stability + '%';
        this.elements.durationScore.textContent = scoreData.holdTime.toFixed(1) + 's';
    }

    // 更新反馈信息
    updateFeedback(scoreData) {
        let feedback = '';
        
        if (scoreData.accuracy < 50) {
            feedback = '请调整姿势，注意动作要领';
        } else if (scoreData.accuracy < 70) {
            feedback = '姿势基本正确，继续保持';
        } else if (scoreData.accuracy < 85) {
            feedback = '很好！姿势很标准';
        } else {
            feedback = '完美！保持这个姿势';
        }

        if (scoreData.stability < 60) {
            feedback += '，尽量保持稳定';
        }

        if (scoreData.holdTime > 0) {
            feedback += ` (已保持 ${scoreData.holdTime.toFixed(1)}s)`;
        }

        this.elements.poseFeedback.textContent = feedback;
    }

    // 更新UI
    updateUI() {
        // 初始化检测模式
        this.changeDetectionMode('pose');

        // 设置默认动作
        this.changePose(this.currentPoseKey);
    }

    // 清理资源
    cleanup() {
        if (this.poseDetector) {
            this.poseDetector.cleanup();
        }
        console.log('应用资源已清理');
    }

    // 切换骨骼和关节点显示
    toggleSkeletonDisplay(show) {
        console.log('切换骨骼显示:', show);

        // 更新姿态检测器的显示设置
        this.poseDetector.setShowSkeleton(show);

        // 更新手势检测器的显示设置
        if (this.handDetectionSupported) {
            this.handDetector.setShowSkeleton(show);
        }

        // 更新MediaPipe手部检测器的显示设置
        this.mediaPipeHandDetector.setShowSkeleton(show);

        // 更新反馈信息
        if (show) {
            this.elements.poseFeedback.textContent = '已开启骨骼和关节点显示';
        } else {
            this.elements.poseFeedback.textContent = '已关闭骨骼和关节点显示';
        }

        // 如果摄像头已启用但未检测，给出提示
        if (this.poseDetector.video && this.poseDetector.video.srcObject && !this.isDetecting) {
            setTimeout(() => {
                if (this.currentDetectionMode === 'pose') {
                    this.elements.poseFeedback.textContent = '摄像头已启用，点击"开始检测"查看姿态识别';
                } else if (this.currentDetectionMode === 'hands') {
                    this.elements.poseFeedback.textContent = '摄像头已启用，点击"开始检测"查看手势识别';
                } else {
                    this.elements.poseFeedback.textContent = '摄像头已启用，点击"开始检测"开始识别';
                }
            }, 2000);
        }
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，初始化 Rhythm Pose 应用...');
    window.app = new RhythmPoseApp();
});
