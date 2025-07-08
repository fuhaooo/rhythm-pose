// 评分系统类
class ScoringSystem {
    constructor(poseDefinitions) {
        this.poseDefinitions = poseDefinitions;
        this.currentPose = null;
        this.currentScore = 0;
        this.bestScore = 0;
        this.accuracyScore = 0;
        this.stabilityScore = 0;
        this.durationScore = 0;
        
        // 姿态历史记录（用于稳定性计算）
        this.poseHistory = [];
        this.maxHistoryLength = 30; // 保存30帧的历史
        
        // 计时器
        this.startTime = null;
        this.holdTime = 0;
        this.isHolding = false;
        
        // 阈值设置
        this.thresholds = {
            angleAccuracy: 15, // 角度误差阈值（度）
            positionAccuracy: 50, // 位置误差阈值（像素）
            stabilityWindow: 10, // 稳定性检测窗口（帧数）
            minHoldTime: 3 // 最小保持时间（秒）
        };
    }

    // 设置当前要检测的动作
    setCurrentPose(poseKey) {
        this.currentPose = this.poseDefinitions.getPose(poseKey);
        this.resetScores();
    }

    // 重置分数
    resetScores() {
        this.currentScore = 0;
        this.accuracyScore = 0;
        this.stabilityScore = 0;
        this.durationScore = 0;
        this.poseHistory = [];
        this.startTime = null;
        this.holdTime = 0;
        this.isHolding = false;
    }

    // 评估姿态并计算分数
    evaluatePose(detectedPose) {
        if (!this.currentPose || !detectedPose) {
            return this.getScoreData();
        }

        // 添加到历史记录
        this.addToHistory(detectedPose);

        // 计算各项分数
        this.accuracyScore = this.calculateAccuracy(detectedPose);
        this.stabilityScore = this.calculateStability();
        this.durationScore = this.calculateDuration();

        // 计算总分
        this.currentScore = this.calculateTotalScore();

        // 更新最佳分数
        if (this.currentScore > this.bestScore) {
            this.bestScore = this.currentScore;
        }

        return this.getScoreData();
    }

    // 计算准确度分数
    calculateAccuracy(detectedPose) {
        if (!detectedPose.pose || !detectedPose.pose.keypoints) {
            return 0;
        }

        const keypoints = detectedPose.pose.keypoints;
        const poseKey = this.getCurrentPoseKey();
        
        switch (poseKey) {
            case 'tree':
                return this.evaluateTreePose(keypoints);
            case 'warrior':
                return this.evaluateWarriorPose(keypoints);
            case 'plank':
                return this.evaluatePlankPose(keypoints);
            case 'squat':
                return this.evaluateSquatPose(keypoints);
            case 'jumping-jacks':
                return this.evaluateJumpingJacks(keypoints);
            default:
                return 0;
        }
    }

    // 评估树式姿态
    evaluateTreePose(keypoints) {
        let score = 0;
        let checks = 0;

        // 获取关键点
        const leftAnkle = this.getKeypoint(keypoints, 'leftAnkle');
        const rightAnkle = this.getKeypoint(keypoints, 'rightAnkle');
        const leftKnee = this.getKeypoint(keypoints, 'leftKnee');
        const rightKnee = this.getKeypoint(keypoints, 'rightKnee');
        const leftHip = this.getKeypoint(keypoints, 'leftHip');
        const rightHip = this.getKeypoint(keypoints, 'rightHip');
        const leftShoulder = this.getKeypoint(keypoints, 'leftShoulder');
        const rightShoulder = this.getKeypoint(keypoints, 'rightShoulder');
        const leftWrist = this.getKeypoint(keypoints, 'leftWrist');
        const rightWrist = this.getKeypoint(keypoints, 'rightWrist');

        // 检查支撑腿是否直立
        if (leftKnee && leftHip && leftAnkle) {
            const leftLegAngle = this.poseDefinitions.calculateAngle(leftHip.position, leftKnee.position, leftAnkle.position);
            if (leftLegAngle > 160) {
                score += 25;
            }
            checks++;
        }

        // 检查手臂是否举起
        if (leftShoulder && leftWrist && rightShoulder && rightWrist) {
            const leftArmHeight = leftShoulder.position.y - leftWrist.position.y;
            const rightArmHeight = rightShoulder.position.y - rightWrist.position.y;
            if (leftArmHeight > 50 && rightArmHeight > 50) {
                score += 25;
            }
            checks++;
        }

        // 检查身体平衡
        if (leftShoulder && rightShoulder) {
            const shoulderTilt = Math.abs(leftShoulder.position.y - rightShoulder.position.y);
            if (shoulderTilt < 20) {
                score += 25;
            }
            checks++;
        }

        // 检查弯曲腿的位置（简化检测）
        if (rightKnee && rightAnkle) {
            const rightFootHeight = rightAnkle.position.y;
            const rightKneeHeight = rightKnee.position.y;
            if (rightKneeHeight < rightFootHeight - 50) {
                score += 25;
            }
            checks++;
        }

        return checks > 0 ? score : 0;
    }

    // 评估战士式姿态
    evaluateWarriorPose(keypoints) {
        let score = 0;
        
        // 获取关键点
        const leftKnee = this.getKeypoint(keypoints, 'leftKnee');
        const rightKnee = this.getKeypoint(keypoints, 'rightKnee');
        const leftHip = this.getKeypoint(keypoints, 'leftHip');
        const rightHip = this.getKeypoint(keypoints, 'rightHip');
        const leftAnkle = this.getKeypoint(keypoints, 'leftAnkle');
        const rightAnkle = this.getKeypoint(keypoints, 'rightAnkle');
        const leftWrist = this.getKeypoint(keypoints, 'leftWrist');
        const rightWrist = this.getKeypoint(keypoints, 'rightWrist');
        const leftShoulder = this.getKeypoint(keypoints, 'leftShoulder');
        const rightShoulder = this.getKeypoint(keypoints, 'rightShoulder');

        // 检查前腿弯曲角度
        if (leftKnee && leftHip && leftAnkle) {
            const frontLegAngle = this.poseDefinitions.calculateAngle(leftHip.position, leftKnee.position, leftAnkle.position);
            if (frontLegAngle >= 80 && frontLegAngle <= 100) {
                score += 30;
            }
        }

        // 检查后腿伸直
        if (rightKnee && rightHip && rightAnkle) {
            const backLegAngle = this.poseDefinitions.calculateAngle(rightHip.position, rightKnee.position, rightAnkle.position);
            if (backLegAngle > 160) {
                score += 30;
            }
        }

        // 检查手臂上举
        if (leftWrist && leftShoulder && rightWrist && rightShoulder) {
            const leftArmUp = leftShoulder.position.y - leftWrist.position.y > 100;
            const rightArmUp = rightShoulder.position.y - rightWrist.position.y > 100;
            if (leftArmUp && rightArmUp) {
                score += 40;
            }
        }

        return score;
    }

    // 评估平板支撑
    evaluatePlankPose(keypoints) {
        let score = 0;
        
        const leftShoulder = this.getKeypoint(keypoints, 'leftShoulder');
        const rightShoulder = this.getKeypoint(keypoints, 'rightShoulder');
        const leftHip = this.getKeypoint(keypoints, 'leftHip');
        const rightHip = this.getKeypoint(keypoints, 'rightHip');
        const leftAnkle = this.getKeypoint(keypoints, 'leftAnkle');
        const rightAnkle = this.getKeypoint(keypoints, 'rightAnkle');

        // 检查身体是否呈直线
        if (leftShoulder && leftHip && leftAnkle) {
            const bodyAngle = this.poseDefinitions.calculateAngle(leftShoulder.position, leftHip.position, leftAnkle.position);
            if (bodyAngle > 160) {
                score += 50;
            }
        }

        // 检查肩膀水平
        if (leftShoulder && rightShoulder) {
            const shoulderLevel = Math.abs(leftShoulder.position.y - rightShoulder.position.y);
            if (shoulderLevel < 20) {
                score += 25;
            }
        }

        // 检查臀部水平
        if (leftHip && rightHip) {
            const hipLevel = Math.abs(leftHip.position.y - rightHip.position.y);
            if (hipLevel < 20) {
                score += 25;
            }
        }

        return score;
    }

    // 评估深蹲
    evaluateSquatPose(keypoints) {
        let score = 0;
        
        const leftKnee = this.getKeypoint(keypoints, 'leftKnee');
        const rightKnee = this.getKeypoint(keypoints, 'rightKnee');
        const leftHip = this.getKeypoint(keypoints, 'leftHip');
        const rightHip = this.getKeypoint(keypoints, 'rightHip');
        const leftAnkle = this.getKeypoint(keypoints, 'leftAnkle');
        const rightAnkle = this.getKeypoint(keypoints, 'rightAnkle');

        // 检查膝盖弯曲角度
        if (leftKnee && leftHip && leftAnkle) {
            const leftKneeAngle = this.poseDefinitions.calculateAngle(leftHip.position, leftKnee.position, leftAnkle.position);
            if (leftKneeAngle >= 80 && leftKneeAngle <= 100) {
                score += 40;
            }
        }

        if (rightKnee && rightHip && rightAnkle) {
            const rightKneeAngle = this.poseDefinitions.calculateAngle(rightHip.position, rightKnee.position, rightAnkle.position);
            if (rightKneeAngle >= 80 && rightKneeAngle <= 100) {
                score += 40;
            }
        }

        // 检查臀部高度（大腿与地面平行）
        if (leftHip && rightHip && leftKnee && rightKnee) {
            const hipKneeLevel = Math.abs((leftHip.position.y + rightHip.position.y) / 2 - (leftKnee.position.y + rightKnee.position.y) / 2);
            if (hipKneeLevel < 30) {
                score += 20;
            }
        }

        return score;
    }

    // 评估开合跳（动态动作）
    evaluateJumpingJacks(keypoints) {
        // 开合跳需要特殊的动态评估逻辑
        // 这里简化为检查手臂和腿部的分开程度
        let score = 0;
        
        const leftWrist = this.getKeypoint(keypoints, 'leftWrist');
        const rightWrist = this.getKeypoint(keypoints, 'rightWrist');
        const leftAnkle = this.getKeypoint(keypoints, 'leftAnkle');
        const rightAnkle = this.getKeypoint(keypoints, 'rightAnkle');

        // 检查手臂分开
        if (leftWrist && rightWrist) {
            const armSpread = Math.abs(leftWrist.position.x - rightWrist.position.x);
            if (armSpread > 200) {
                score += 50;
            }
        }

        // 检查腿部分开
        if (leftAnkle && rightAnkle) {
            const legSpread = Math.abs(leftAnkle.position.x - rightAnkle.position.x);
            if (legSpread > 100) {
                score += 50;
            }
        }

        return score;
    }

    // 计算稳定性分数
    calculateStability() {
        if (this.poseHistory.length < this.thresholds.stabilityWindow) {
            return 0;
        }

        // 计算最近几帧的姿态变化
        const recentPoses = this.poseHistory.slice(-this.thresholds.stabilityWindow);
        let totalVariation = 0;
        let comparisons = 0;

        for (let i = 1; i < recentPoses.length; i++) {
            const variation = this.calculatePoseVariation(recentPoses[i-1], recentPoses[i]);
            totalVariation += variation;
            comparisons++;
        }

        const averageVariation = comparisons > 0 ? totalVariation / comparisons : 100;
        const stabilityScore = Math.max(0, 100 - averageVariation);
        
        return Math.round(stabilityScore);
    }

    // 计算持续时间分数
    calculateDuration() {
        if (!this.currentPose) return 0;

        // 如果准确度足够高，开始计时
        if (this.accuracyScore > 70) {
            if (!this.isHolding) {
                this.startTime = Date.now();
                this.isHolding = true;
            }
            this.holdTime = (Date.now() - this.startTime) / 1000;
        } else {
            this.isHolding = false;
            this.holdTime = 0;
        }

        const targetDuration = this.currentPose.duration || 30;
        const durationScore = Math.min(100, (this.holdTime / targetDuration) * 100);
        
        return Math.round(durationScore);
    }

    // 计算总分
    calculateTotalScore() {
        // 权重分配：准确度50%，稳定性30%，持续时间20%
        const totalScore = (this.accuracyScore * 0.5) + 
                          (this.stabilityScore * 0.3) + 
                          (this.durationScore * 0.2);
        
        return Math.round(totalScore);
    }

    // 辅助方法
    getKeypoint(keypoints, partName) {
        const keypoint = keypoints.find(kp => kp.part === partName);
        return keypoint && keypoint.score > 0.5 ? keypoint : null;
    }

    addToHistory(pose) {
        this.poseHistory.push(pose);
        if (this.poseHistory.length > this.maxHistoryLength) {
            this.poseHistory.shift();
        }
    }

    calculatePoseVariation(pose1, pose2) {
        // 简化的姿态变化计算
        if (!pose1.pose || !pose2.pose || !pose1.pose.keypoints || !pose2.pose.keypoints) {
            return 100;
        }

        let totalDistance = 0;
        let validPoints = 0;

        pose1.pose.keypoints.forEach(kp1 => {
            const kp2 = pose2.pose.keypoints.find(kp => kp.part === kp1.part);
            if (kp2 && kp1.score > 0.5 && kp2.score > 0.5) {
                const distance = this.poseDefinitions.calculateDistance(kp1.position, kp2.position);
                totalDistance += distance;
                validPoints++;
            }
        });

        return validPoints > 0 ? totalDistance / validPoints : 100;
    }

    getCurrentPoseKey() {
        // 从当前姿态定义中获取key（需要在设置时保存）
        for (const [key, pose] of Object.entries(this.poseDefinitions.poses)) {
            if (pose === this.currentPose) {
                return key;
            }
        }
        return null;
    }

    // 获取分数数据
    getScoreData() {
        return {
            currentScore: this.currentScore,
            bestScore: this.bestScore,
            accuracy: this.accuracyScore,
            stability: this.stabilityScore,
            duration: this.durationScore,
            holdTime: this.holdTime
        };
    }
}

// 导出类
window.ScoringSystem = ScoringSystem;
