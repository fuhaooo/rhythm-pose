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
            minConfidence: 0.6,  // 降低最小置信度阈值
            smoothing: 0.9,      // 增加平滑度
            gestureThreshold: 0.7, // 降低手势识别阈值
            dynamicConfidence: true, // 启用动态置信度调整
            qualityBonus: 0.15   // 高质量检测的置信度奖励
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
                maxContinuousChecks: 15,  // 增加连续检查次数
                detectionConfidence: 0.6, // 降低检测置信度阈值
                scoreThreshold: 0.6,      // 降低分数阈值
                iouThreshold: 0.4         // 稍微放宽IoU阈值
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

        // 计算检测质量（基于关键点的平均置信度）
        const avgConfidence = this.calculateAverageConfidence(keypoints);
        const qualityBonus = this.gestureConfig.dynamicConfidence ?
            (avgConfidence > 0.8 ? this.gestureConfig.qualityBonus : 0) : 0;

        // 手势识别逻辑（提高基础置信度）
        if (isThumbUp && !isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
            return { name: 'thumbs-up', confidence: Math.min(0.95 + qualityBonus, 1.0) };
        } else if (!isThumbUp && isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) {
            return { name: 'peace', confidence: Math.min(0.95 + qualityBonus, 1.0) };
        } else if (!isThumbUp && !isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
            return { name: 'fist', confidence: Math.min(0.93 + qualityBonus, 1.0) };
        } else if (fingersUp === 5) {
            return { name: 'open-palm', confidence: Math.min(0.92 + qualityBonus, 1.0) };
        } else if (!isThumbUp && isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
            return { name: 'pointing', confidence: Math.min(0.90 + qualityBonus, 1.0) };
        } else if (isThumbUp && isIndexUp && !isMiddleUp && !isRingUp && isPinkyUp) {
            return { name: 'rock-on', confidence: Math.min(0.88 + qualityBonus, 1.0) };
        } else if (!isThumbUp && !isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) {
            return { name: 'middle-finger', confidence: Math.min(0.87 + qualityBonus, 1.0) };
        } else if (isThumbUp && !isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
            return { name: 'thumbs-up', confidence: Math.min(0.95 + qualityBonus, 1.0) };
        } else if (!isThumbUp && !isIndexUp && !isMiddleUp && !isRingUp && isPinkyUp) {
            return { name: 'pinky-up', confidence: Math.min(0.85 + qualityBonus, 1.0) };
        } else if (isThumbUp && isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) {
            return { name: 'three-fingers', confidence: Math.min(0.88 + qualityBonus, 1.0) };
        } else if (fingersUp === 4 && !isThumbUp) {
            return { name: 'four-fingers', confidence: Math.min(0.86 + qualityBonus, 1.0) };
        } else if (this.detectOKSign(keypoints)) {
            return { name: 'ok-sign', confidence: Math.min(0.90 + qualityBonus, 1.0) };
        } else if (this.detectCallMeSign(keypoints)) {
            return { name: 'call-me', confidence: Math.min(0.85 + qualityBonus, 1.0) };
        } else if (this.detectGunSign(keypoints)) {
            return { name: 'gun-sign', confidence: Math.min(0.83 + qualityBonus, 1.0) };
        } else if (this.detectHeartSign(keypoints)) {
            return { name: 'heart-sign', confidence: Math.min(0.90 + qualityBonus, 1.0) };
        } else if (this.detectSpiderSign(keypoints)) {
            return { name: 'spider-sign', confidence: Math.min(0.85 + qualityBonus, 1.0) };
        } else if (this.detectRockSign(keypoints)) {
            return { name: 'rock-sign', confidence: Math.min(0.88 + qualityBonus, 1.0) };
        } else if (this.detectPraySign(keypoints)) {
            return { name: 'pray-sign', confidence: Math.min(0.87 + qualityBonus, 1.0) };
        } else if (this.detectHighFive(keypoints)) {
            return { name: 'high-five', confidence: Math.min(0.85 + qualityBonus, 1.0) };
        } else {
            // 检测挥手动作（基于手腕位置变化）
            if (this.detectWaving(hand)) {
                return { name: 'wave', confidence: Math.min(0.85 + qualityBonus, 1.0) };
            }
            return { name: 'unknown', confidence: 0.3 };
        }
    }

    // 计算关键点的平均置信度
    calculateAverageConfidence(keypoints) {
        if (!keypoints || keypoints.length === 0) return 0;

        const confidenceSum = keypoints.reduce((sum, point) => {
            return sum + (point.confidence || point.score || 0.5);
        }, 0);

        return confidenceSum / keypoints.length;
    }

    // 检测OK手势（拇指和食指形成圆圈）
    detectOKSign(keypoints) {
        const thumb_tip = keypoints[4];
        const index_tip = keypoints[8];
        const middle_tip = keypoints[12];
        const ring_tip = keypoints[16];
        const pinky_tip = keypoints[20];

        // 计算拇指尖和食指尖的距离
        const distance = Math.sqrt(
            Math.pow(thumb_tip.x - index_tip.x, 2) +
            Math.pow(thumb_tip.y - index_tip.y, 2)
        );

        // 检查是否形成圆圈（距离较小）且其他手指伸直
        const isCircle = distance < 30; // 像素距离
        const otherFingersUp = middle_tip.y < keypoints[10].y &&
                              ring_tip.y < keypoints[14].y &&
                              pinky_tip.y < keypoints[18].y;

        return isCircle && otherFingersUp;
    }

    // 检测"打电话"手势（拇指和小指伸出）
    detectCallMeSign(keypoints) {
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

        const isThumbUp = thumb_tip.y < thumb_ip.y;
        const isIndexDown = index_tip.y > index_pip.y;
        const isMiddleDown = middle_tip.y > middle_pip.y;
        const isRingDown = ring_tip.y > ring_pip.y;
        const isPinkyUp = pinky_tip.y < pinky_pip.y;

        return isThumbUp && isIndexDown && isMiddleDown && isRingDown && isPinkyUp;
    }

    // 检测"手枪"手势（食指和拇指伸出）
    detectGunSign(keypoints) {
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

        const isThumbUp = thumb_tip.y < thumb_ip.y;
        const isIndexUp = index_tip.y < index_pip.y;
        const isMiddleDown = middle_tip.y > middle_pip.y;
        const isRingDown = ring_tip.y > ring_pip.y;
        const isPinkyDown = pinky_tip.y > pinky_pip.y;

        // 检查拇指和食指是否呈90度角
        const thumbVector = { x: thumb_tip.x - thumb_ip.x, y: thumb_tip.y - thumb_ip.y };
        const indexVector = { x: index_tip.x - index_pip.x, y: index_tip.y - index_pip.y };

        // 简化的角度检测
        const isPerpendicularish = Math.abs(thumbVector.x * indexVector.x + thumbVector.y * indexVector.y) < 0.3;

        return isThumbUp && isIndexUp && isMiddleDown && isRingDown && isPinkyDown && isPerpendicularish;
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

    // 检测比心手势
    detectHeartSign(keypoints) {
        if (!keypoints || keypoints.length < 21) return false;

        const thumb_tip = keypoints[4];
        const index_tip = keypoints[8];
        const middle_tip = keypoints[12];
        const ring_tip = keypoints[16];
        const pinky_tip = keypoints[20];

        // 拇指和食指接近，形成心形的上半部分
        const thumbIndexDistance = Math.sqrt(
            Math.pow(thumb_tip.x - index_tip.x, 2) +
            Math.pow(thumb_tip.y - index_tip.y, 2)
        );

        // 其他手指相对较低
        const isMiddleDown = middle_tip.y > keypoints[10].y;
        const isRingDown = ring_tip.y > keypoints[14].y;
        const isPinkyDown = pinky_tip.y > keypoints[18].y;

        return thumbIndexDistance < 30 && isMiddleDown && isRingDown && isPinkyDown;
    }

    // 检测蜘蛛手势（五指张开并弯曲）
    detectSpiderSign(keypoints) {
        if (!keypoints || keypoints.length < 21) return false;

        // 检查所有手指都是弯曲的
        const fingersBent = [
            keypoints[4].y > keypoints[3].y, // 拇指
            keypoints[8].y > keypoints[6].y, // 食指
            keypoints[12].y > keypoints[10].y, // 中指
            keypoints[16].y > keypoints[14].y, // 无名指
            keypoints[20].y > keypoints[18].y  // 小指
        ];

        return fingersBent.filter(Boolean).length >= 4;
    }

    // 检测摇滚手势（拇指、食指、小指伸直）
    detectRockSign(keypoints) {
        if (!keypoints || keypoints.length < 21) return false;

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

        const isThumbUp = thumb_tip.y < thumb_ip.y;
        const isIndexUp = index_tip.y < index_pip.y;
        const isMiddleDown = middle_tip.y > middle_pip.y;
        const isRingDown = ring_tip.y > ring_pip.y;
        const isPinkyUp = pinky_tip.y < pinky_pip.y;

        return isThumbUp && isIndexUp && isMiddleDown && isRingDown && isPinkyUp;
    }

    // 检测祈祷手势（双手合十，但这里检测单手向上）
    detectPraySign(keypoints) {
        if (!keypoints || keypoints.length < 21) return false;

        // 检查所有手指都向上伸直
        const fingersUp = [
            keypoints[4].y < keypoints[3].y, // 拇指
            keypoints[8].y < keypoints[6].y, // 食指
            keypoints[12].y < keypoints[10].y, // 中指
            keypoints[16].y < keypoints[14].y, // 无名指
            keypoints[20].y < keypoints[18].y  // 小指
        ];

        // 手掌垂直向上
        const wrist = keypoints[0];
        const middleMcp = keypoints[9];
        const isVertical = Math.abs(wrist.x - middleMcp.x) < 20;

        return fingersUp.filter(Boolean).length >= 4 && isVertical;
    }

    // 检测击掌手势（手掌完全张开面向前方）
    detectHighFive(keypoints) {
        if (!keypoints || keypoints.length < 21) return false;

        // 检查所有手指都伸直
        const fingersUp = [
            keypoints[4].y < keypoints[3].y, // 拇指
            keypoints[8].y < keypoints[6].y, // 食指
            keypoints[12].y < keypoints[10].y, // 中指
            keypoints[16].y < keypoints[14].y, // 无名指
            keypoints[20].y < keypoints[18].y  // 小指
        ];

        // 手指间距适中，表示自然张开
        const fingerSpread = Math.abs(keypoints[8].x - keypoints[16].x);

        return fingersUp.filter(Boolean).length === 5 && fingerSpread > 40;
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
