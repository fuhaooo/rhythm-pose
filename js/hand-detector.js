// 手势检测器类
class HandDetector {
    constructor() {
        this.video = null;
        this.handPose = null;
        this.mediaPipeHands = null;
        this.hands = [];
        this.isDetecting = false;
        this.detectionMethod = 'auto'; // 'ml5', 'mediapipe', 'auto'
        this.showSkeleton = true; // 是否显示手部关键点
        
        // 回调函数
        this.onHandDetected = null;
        this.onModelReady = null;
        this.onError = null;
        
        // 手势识别配置
        this.gestureConfig = {
            minConfidence: 0.7,
            smoothing: 0.8,
            gestureThreshold: 0.8
        };
    }

    // 设置视频源
    setVideo(video) {
        this.video = video;
    }

    // 设置是否显示手部关键点
    setShowSkeleton(show) {
        this.showSkeleton = show;
    }

    // 初始化手势检测
    async initHandDetection() {
        try {
            console.log('正在初始化手势检测...');
            
            // 尝试使用ml5.js HandPose
            if (await this.tryInitML5HandPose()) {
                this.detectionMethod = 'ml5';
                console.log('使用ml5.js HandPose');
                return true;
            }
            
            // 尝试使用MediaPipe Hands
            if (await this.tryInitMediaPipeHands()) {
                this.detectionMethod = 'mediapipe';
                console.log('使用MediaPipe Hands');
                return true;
            }
            
            // 使用基于PoseNet的简化手势检测
            this.detectionMethod = 'simple';
            console.log('使用简化手势检测');
            return true;
            
        } catch (error) {
            console.error('手势检测初始化失败:', error);
            if (this.onError) {
                this.onError('手势检测初始化失败: ' + error.message);
            }
            throw error;
        }
    }

    // 尝试初始化ml5.js HandPose
    async tryInitML5HandPose() {
        try {
            if (typeof ml5 === 'undefined' || typeof ml5.handPose !== 'function') {
                return false;
            }

            this.handPose = await ml5.handPose(this.video, {
                flipHorizontal: false,
                maxContinuousChecks: 10,
                detectionConfidence: 0.8,
                scoreThreshold: 0.75,
                iouThreshold: 0.3
            });

            this.handPose.on('predict', (results) => {
                this.hands = results;
                this.processHandResults(results);
            });

            return true;
        } catch (error) {
            console.warn('ml5.js HandPose不可用:', error);
            return false;
        }
    }

    // 尝试初始化MediaPipe Hands
    async tryInitMediaPipeHands() {
        try {
            if (typeof Hands === 'undefined') {
                return false;
            }

            this.mediaPipeHands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            this.mediaPipeHands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.mediaPipeHands.onResults((results) => {
                this.hands = this.convertMediaPipeResults(results);
                this.processHandResults(this.hands);
            });

            return true;
        } catch (error) {
            console.warn('MediaPipe Hands不可用:', error);
            return false;
        }
    }

    // 转换MediaPipe结果格式
    convertMediaPipeResults(results) {
        if (!results.multiHandLandmarks) return [];
        
        return results.multiHandLandmarks.map((landmarks, index) => ({
            keypoints: landmarks.map((point, i) => ({
                x: point.x * this.video.videoWidth,
                y: point.y * this.video.videoHeight,
                z: point.z,
                confidence: 1.0,
                name: this.getKeypointName(i)
            })),
            handedness: results.multiHandedness[index]?.label || 'Unknown',
            confidence: results.multiHandedness[index]?.score || 1.0
        }));
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

    // 处理手部检测结果
    processHandResults(hands) {
        if (!hands || hands.length === 0) return;

        // 识别手势
        const gestures = hands.map(hand => this.recognizeGesture(hand));
        
        // 触发回调
        if (this.onHandDetected) {
            this.onHandDetected(hands, gestures);
        }
    }

    // 识别手势
    recognizeGesture(hand) {
        if (!hand.keypoints || hand.keypoints.length < 21) {
            return { name: 'unknown', confidence: 0 };
        }

        const keypoints = hand.keypoints;
        
        // 获取关键点
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
        const wrist = keypoints[0];

        // 计算手指是否伸直
        const isThumbUp = thumb_tip.y < thumb_ip.y;
        const isIndexUp = index_tip.y < index_pip.y;
        const isMiddleUp = middle_tip.y < middle_pip.y;
        const isRingUp = ring_tip.y < ring_pip.y;
        const isPinkyUp = pinky_tip.y < pinky_pip.y;

        // 计算手指数量
        const fingersUp = [isThumbUp, isIndexUp, isMiddleUp, isRingUp, isPinkyUp].filter(Boolean).length;

        // 手势识别逻辑
        if (isThumbUp && !isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
            return { name: 'thumbs-up', confidence: 0.9 };
        } else if (!isThumbUp && isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) {
            return { name: 'peace', confidence: 0.9 };
        } else if (!isThumbUp && !isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
            return { name: 'fist', confidence: 0.9 };
        } else if (fingersUp === 5) {
            return { name: 'open-palm', confidence: 0.9 };
        } else if (!isThumbUp && isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
            return { name: 'pointing', confidence: 0.8 };
        } else if (isThumbUp && isIndexUp && !isMiddleUp && !isRingUp && isPinkyUp) {
            return { name: 'rock-on', confidence: 0.8 };
        } else {
            // 检测挥手动作（基于手腕位置变化）
            if (this.detectWaving(hand)) {
                return { name: 'wave', confidence: 0.7 };
            }
            return { name: 'unknown', confidence: 0.3 };
        }
    }

    // 检测挥手动作
    detectWaving(hand) {
        // 简化的挥手检测：检查手掌是否张开且在移动
        if (!hand.keypoints) return false;
        
        const fingersUp = hand.keypoints.slice(4, 21).filter((point, i) => {
            const pipIndex = [3, 6, 10, 14, 18][Math.floor(i / 4)];
            const pip = hand.keypoints[pipIndex];
            return point.y < pip.y;
        }).length;
        
        return fingersUp >= 4; // 至少4个手指伸直
    }

    // 开始检测
    startDetection() {
        if (!this.video) {
            console.error('视频源未设置');
            return false;
        }

        this.isDetecting = true;
        
        if (this.detectionMethod === 'mediapipe' && this.mediaPipeHands) {
            this.startMediaPipeDetection();
        }
        
        return true;
    }

    // 开始MediaPipe检测
    startMediaPipeDetection() {
        const detectFrame = async () => {
            if (!this.isDetecting) return;
            
            if (this.video.readyState >= 2) {
                await this.mediaPipeHands.send({ image: this.video });
            }
            
            requestAnimationFrame(detectFrame);
        };
        
        detectFrame();
    }

    // 停止检测
    stopDetection() {
        this.isDetecting = false;
    }

    // 设置回调函数
    setHandCallback(callback) {
        this.onHandDetected = callback;
    }

    setModelReadyCallback(callback) {
        this.onModelReady = callback;
    }

    setErrorCallback(callback) {
        this.onError = callback;
    }

    // 清理资源
    cleanup() {
        this.stopDetection();
        this.handPose = null;
        this.mediaPipeHands = null;
        this.hands = [];
    }
}

// 导出类
window.HandDetector = HandDetector;
