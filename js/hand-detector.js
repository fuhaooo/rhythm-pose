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

        // KNN分类器用于自定义手势识别
        this.knnClassifier = null;
        this.useKNN = false; // 是否使用KNN分类器
        this.gestureHistory = []; // 手势历史记录用于平滑
        this.historyLength = 5; // 历史记录长度
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

            // 初始化KNN分类器
            if (typeof ml5.KNNClassifier === 'function') {
                this.knnClassifier = ml5.KNNClassifier();
                console.log('KNN分类器已初始化');
            }

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
        if (!hands || hands.length === 0) {
            console.log('HandDetector: 没有检测到手部');
            return;
        }

        console.log('HandDetector: 检测到', hands.length, '只手');

        // 检查是否需要检测Diamond Hands（需要双手）
        const currentGesture = this.getCurrentTargetGesture();
        if (currentGesture === 'diamond-hands' && hands.length >= 2) {
            const diamondResult = this.detectDiamondHands(hands);
            const gestures = [{
                name: 'diamond-hands',
                confidence: diamondResult.confidence,
                detected: diamondResult.detected,
                feedback: diamondResult.feedback,
                details: diamondResult.details
            }];

            // 触发回调
            if (this.onHandDetected) {
                this.onHandDetected(hands, gestures);
            }
            return;
        }

        // 识别常规手势
        const gestures = hands.map(hand => {
            const gesture = this.recognizeGesture(hand);
            console.log('HandDetector: 识别手势:', gesture);
            return gesture;
        });

        // 触发回调
        if (this.onHandDetected) {
            console.log('HandDetector: 触发回调，手势:', gestures);
            this.onHandDetected(hands, gestures);
        } else {
            console.warn('HandDetector: 没有设置回调函数');
        }
    }

    // 获取当前目标手势（需要从主应用获取）
    getCurrentTargetGesture() {
        // 这个方法需要与主应用集成
        if (typeof window !== 'undefined' && window.rhythmPoseApp) {
            return window.rhythmPoseApp.currentPoseKey;
        }
        return null;
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

        // 计算手指是否伸直（简化版本，更容易触发）
        const isThumbUp = thumb_tip.x > thumb_ip.x + 5; // 拇指向右伸展
        const isIndexUp = index_tip.y < index_pip.y - 5; // 降低阈值
        const isMiddleUp = middle_tip.y < middle_pip.y - 5;
        const isRingUp = ring_tip.y < ring_pip.y - 5;
        const isPinkyUp = pinky_tip.y < pinky_pip.y - 5;

        // 计算手指数量
        const fingersUp = [isThumbUp, isIndexUp, isMiddleUp, isRingUp, isPinkyUp].filter(Boolean).length;

        // 计算检测质量（基于关键点的平均置信度）
        const avgConfidence = this.calculateAverageConfidence(keypoints);
        const qualityBonus = this.gestureConfig.dynamicConfidence ?
            (avgConfidence > 0.8 ? this.gestureConfig.qualityBonus : 0) : 0;

        // 简化的手势识别逻辑（更容易触发）
        console.log('手指状态:', { isThumbUp, isIndexUp, isMiddleUp, isRingUp, isPinkyUp, fingersUp });

        if (isThumbUp && fingersUp <= 2) {
            return { name: 'thumbs-up', confidence: 0.9 + qualityBonus };
        } else if (isIndexUp && isMiddleUp && fingersUp <= 3) {
            return { name: 'peace', confidence: 0.9 + qualityBonus };
        } else if (fingersUp === 0) {
            return { name: 'fist', confidence: 0.9 + qualityBonus };
        } else if (fingersUp >= 4) {
            return { name: 'open-palm', confidence: 0.8 + qualityBonus };
        } else if (isIndexUp && fingersUp <= 2) {
            return { name: 'pointing', confidence: 0.8 + qualityBonus };
        } else if (isThumbUp && isIndexUp && isPinkyUp) {
            return { name: 'rock-sign', confidence: 0.8 + qualityBonus };
        } else if (this.detectOKSign(keypoints)) {
            return { name: 'ok-sign', confidence: 0.8 + qualityBonus };
        } else if (this.detectHeartSign(keypoints)) {
            return { name: 'heart-sign', confidence: 0.8 + qualityBonus };
        } else if (fingersUp >= 3) {
            // 可能是挥手或其他手势
            return { name: 'wave', confidence: 0.6 + qualityBonus };
        } else {
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

    // 检测Diamond Hands手势（需要双手）
    detectDiamondHands(hands) {
        // 必须检测到双手
        if (!hands || hands.length < 2) {
            return { detected: false, confidence: 0, feedback: '需要检测到双手' };
        }

        const leftHand = hands.find(h => h.handedness === 'Left') || hands[0];
        const rightHand = hands.find(h => h.handedness === 'Right') || hands[1];

        if (!leftHand.keypoints || !rightHand.keypoints ||
            leftHand.keypoints.length < 21 || rightHand.keypoints.length < 21) {
            return { detected: false, confidence: 0, feedback: '手部关键点检测不完整' };
        }

        let score = 0;
        let feedback = [];

        // 1. 检查手指尖接触（形成钻石形状）
        const fingerContactResult = this.checkFingerContact(leftHand.keypoints, rightHand.keypoints);
        if (fingerContactResult.detected) {
            score += 30;
            feedback.push('✓ 手指尖接触良好');
        } else {
            feedback.push('✗ 手指尖需要相触形成钻石形状');
        }

        // 2. 检查手腕高度（胸前位置）
        const wristHeightResult = this.checkWristHeight(leftHand.keypoints, rightHand.keypoints);
        if (wristHeightResult.valid) {
            score += 25;
            feedback.push('✓ 手腕高度正确');
        } else {
            feedback.push('✗ 手腕应在胸前高度（0.3-0.7相对位置）');
        }

        // 3. 检查肘部角度（80-120度）
        const elbowAngleResult = this.checkElbowAngles(leftHand.keypoints, rightHand.keypoints);
        if (elbowAngleResult.valid) {
            score += 25;
            feedback.push('✓ 肘部角度正确');
        } else {
            feedback.push('✗ 肘部应张开80-120度');
        }

        // 4. 检查手势对称性
        const symmetryResult = this.checkHandSymmetry(leftHand.keypoints, rightHand.keypoints);
        if (symmetryResult.symmetric) {
            score += 20;
            feedback.push('✓ 手势对称');
        } else {
            feedback.push('✗ 双手应保持对称');
        }

        const confidence = score / 100;
        const detected = confidence >= 0.75; // 75%阈值

        return {
            detected,
            confidence,
            score,
            feedback: feedback.join('; '),
            details: {
                fingerContact: fingerContactResult,
                wristHeight: wristHeightResult,
                elbowAngle: elbowAngleResult,
                symmetry: symmetryResult
            }
        };
    }

    // 检查手指尖接触
    checkFingerContact(leftKeypoints, rightKeypoints) {
        // 获取双手的指尖位置
        const leftFingerTips = [
            leftKeypoints[4],  // 拇指尖
            leftKeypoints[8],  // 食指尖
            leftKeypoints[12], // 中指尖
            leftKeypoints[16], // 无名指尖
            leftKeypoints[20]  // 小指尖
        ];

        const rightFingerTips = [
            rightKeypoints[4],  // 拇指尖
            rightKeypoints[8],  // 食指尖
            rightKeypoints[12], // 中指尖
            rightKeypoints[16], // 无名指尖
            rightKeypoints[20]  // 小指尖
        ];

        let contactCount = 0;
        let minDistance = Infinity;
        const contactThreshold = 30; // 像素距离阈值

        // 检查每个手指尖之间的距离
        for (let i = 0; i < leftFingerTips.length; i++) {
            for (let j = 0; j < rightFingerTips.length; j++) {
                const distance = Math.sqrt(
                    Math.pow(leftFingerTips[i].x - rightFingerTips[j].x, 2) +
                    Math.pow(leftFingerTips[i].y - rightFingerTips[j].y, 2)
                );

                minDistance = Math.min(minDistance, distance);

                if (distance < contactThreshold) {
                    contactCount++;
                }
            }
        }

        // 至少需要2个接触点形成钻石形状
        const detected = contactCount >= 2 && minDistance < contactThreshold;

        return {
            detected,
            contactCount,
            minDistance,
            threshold: contactThreshold
        };
    }

    // 检查手腕高度
    checkWristHeight(leftKeypoints, rightKeypoints) {
        const leftWrist = leftKeypoints[0];  // 手腕
        const rightWrist = rightKeypoints[0]; // 手腕

        // 计算相对高度（假设视频高度为参考）
        const videoHeight = this.video ? this.video.videoHeight : 480;
        const leftRelativeHeight = leftWrist.y / videoHeight;
        const rightRelativeHeight = rightWrist.y / videoHeight;

        // 检查是否在0.3-0.7范围内（胸前高度）
        const leftValid = leftRelativeHeight >= 0.3 && leftRelativeHeight <= 0.7;
        const rightValid = rightRelativeHeight >= 0.3 && rightRelativeHeight <= 0.7;

        return {
            valid: leftValid && rightValid,
            leftHeight: leftRelativeHeight,
            rightHeight: rightRelativeHeight,
            targetRange: [0.3, 0.7]
        };
    }

    // 检查肘部角度
    checkElbowAngles(leftKeypoints, rightKeypoints) {
        // 对于手部检测，我们需要估算肘部位置
        // 使用手腕和中指根部来估算手臂方向
        const leftWrist = leftKeypoints[0];
        const leftMiddleMcp = leftKeypoints[9];
        const rightWrist = rightKeypoints[0];
        const rightMiddleMcp = rightKeypoints[9];

        // 计算手臂向量（简化估算）
        const leftArmVector = {
            x: leftWrist.x - leftMiddleMcp.x,
            y: leftWrist.y - leftMiddleMcp.y
        };

        const rightArmVector = {
            x: rightWrist.x - rightMiddleMcp.x,
            y: rightWrist.y - rightMiddleMcp.y
        };

        // 计算手臂与水平线的角度
        const leftAngle = Math.abs(Math.atan2(leftArmVector.y, leftArmVector.x) * 180 / Math.PI);
        const rightAngle = Math.abs(Math.atan2(rightArmVector.y, rightArmVector.x) * 180 / Math.PI);

        // 检查角度是否在80-120度范围内（简化检查）
        const leftValid = leftAngle >= 30 && leftAngle <= 150; // 放宽范围
        const rightValid = rightAngle >= 30 && rightAngle <= 150;

        return {
            valid: leftValid && rightValid,
            leftAngle,
            rightAngle,
            targetRange: [80, 120]
        };
    }

    // 检查手势对称性
    checkHandSymmetry(leftKeypoints, rightKeypoints) {
        const leftWrist = leftKeypoints[0];
        const rightWrist = rightKeypoints[0];

        // 检查手腕高度差异
        const heightDifference = Math.abs(leftWrist.y - rightWrist.y);
        const maxHeightDiff = 50; // 像素

        // 检查手腕水平距离（应该适中）
        const horizontalDistance = Math.abs(leftWrist.x - rightWrist.x);
        const minHorizontalDist = 100; // 最小距离
        const maxHorizontalDist = 300; // 最大距离

        const heightSymmetric = heightDifference < maxHeightDiff;
        const distanceAppropriate = horizontalDistance >= minHorizontalDist &&
                                   horizontalDistance <= maxHorizontalDist;

        return {
            symmetric: heightSymmetric && distanceAppropriate,
            heightDifference,
            horizontalDistance,
            thresholds: {
                maxHeightDiff,
                minHorizontalDist,
                maxHorizontalDist
            }
        };
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

    // 改进的拇指检测方法
    isThumbExtended(thumbTip, thumbIp, keypoints) {
        const wrist = keypoints[0];
        const thumbMcp = keypoints[2];

        // 计算拇指的方向向量
        const thumbDirection = {
            x: thumbTip.x - thumbMcp.x,
            y: thumbTip.y - thumbMcp.y
        };

        // 计算手腕到拇指根部的向量
        const wristToThumb = {
            x: thumbMcp.x - wrist.x,
            y: thumbMcp.y - wrist.y
        };

        // 拇指伸直的判断：拇指尖应该远离手腕
        const thumbLength = Math.sqrt(thumbDirection.x ** 2 + thumbDirection.y ** 2);
        const distanceFromWrist = Math.sqrt((thumbTip.x - wrist.x) ** 2 + (thumbTip.y - wrist.y) ** 2);

        return thumbLength > 20 && distanceFromWrist > 60;
    }

    // 计算两点间距离
    calculateDistance(point1, point2) {
        return Math.sqrt(
            Math.pow(point1.x - point2.x, 2) +
            Math.pow(point1.y - point2.y, 2)
        );
    }

    // 计算角度
    calculateAngle(center, point) {
        return Math.atan2(point.y - center.y, point.x - center.x) * 180 / Math.PI;
    }

    // 计算手势方向
    calculateHandOrientation(keypoints) {
        const wrist = keypoints[0];
        const middleMcp = keypoints[9];

        const angle = Math.atan2(middleMcp.y - wrist.y, middleMcp.x - wrist.x);
        return Math.abs(Math.sin(angle)); // 返回垂直程度
    }

    // 提取手部特征用于KNN分类
    extractHandFeatures(keypoints) {
        const features = [];

        // 添加所有关键点的相对位置
        const wrist = keypoints[0];
        for (let i = 1; i < keypoints.length; i++) {
            features.push(keypoints[i].x - wrist.x);
            features.push(keypoints[i].y - wrist.y);
        }

        // 添加手指间的距离
        const fingerTips = [4, 8, 12, 16, 20]; // 手指尖的索引
        for (let i = 0; i < fingerTips.length; i++) {
            for (let j = i + 1; j < fingerTips.length; j++) {
                const dist = this.calculateDistance(keypoints[fingerTips[i]], keypoints[fingerTips[j]]);
                features.push(dist);
            }
        }

        return features;
    }

    // 训练KNN分类器的方法
    trainGesture(gestureName, keypoints) {
        if (!this.knnClassifier) {
            console.warn('KNN分类器未初始化');
            return;
        }

        const features = this.extractHandFeatures(keypoints);
        this.knnClassifier.addExample(features, gestureName);
        console.log(`已添加手势训练数据: ${gestureName}`);
    }

    // 启用KNN分类器
    enableKNN() {
        this.useKNN = true;
        console.log('已启用KNN手势识别');
    }

    // 禁用KNN分类器
    disableKNN() {
        this.useKNN = false;
        console.log('已禁用KNN手势识别');
    }

    // 保存KNN模型
    saveKNNModel() {
        if (!this.knnClassifier) return null;
        return this.knnClassifier.save();
    }

    // 加载KNN模型
    loadKNNModel(modelData) {
        if (!this.knnClassifier) return;
        this.knnClassifier.load(modelData);
        this.useKNN = true;
        console.log('KNN模型已加载');
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
