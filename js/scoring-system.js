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

        // 游戏化元素
        this.combo = 0;              // 连击数
        this.maxCombo = 0;           // 最大连击数
        this.totalScore = 0;         // 总分
        this.level = 1;              // 等级
        this.experience = 0;         // 经验值
        this.achievements = [];      // 成就列表
        this.streakBonus = 1.0;      // 连击奖励倍数
        this.perfectCount = 0;       // 完美动作计数
        this.goodCount = 0;          // 良好动作计数

        // 姿态历史记录（用于稳定性计算）- 优化减少历史长度
        this.poseHistory = [];
        this.maxHistoryLength = 10; // 减少到10帧历史，降低内存使用

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

    // 评估姿态并计算分数（优化版本）
    evaluatePose(detectedPose) {
        if (!this.currentPose || !detectedPose) {
            return this.getScoreData();
        }

        // 添加到历史记录
        this.addToHistory(detectedPose);

        // 性能优化：减少计算频率
        this.frameCount = (this.frameCount || 0) + 1;

        // 准确度每帧计算（最重要）
        this.accuracyScore = this.calculateAccuracy(detectedPose);

        // 稳定性每3帧计算一次
        if (this.frameCount % 3 === 0) {
            this.stabilityScore = this.calculateStability();
        }

        // 持续时间每5帧计算一次
        if (this.frameCount % 5 === 0) {
            this.durationScore = this.calculateDuration();
        }

        // 计算总分
        this.currentScore = this.calculateTotalScore();

        // 游戏化逻辑每10帧计算一次
        if (this.frameCount % 10 === 0) {
            this.updateGameElements();
        }

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

    // 计算稳定性分数（优化版本）
    calculateStability() {
        if (this.poseHistory.length < this.thresholds.stabilityWindow) {
            return this.stabilityScore || 0; // 返回上次计算的值
        }

        // 优化：只计算最近3帧的变化，而不是10帧
        const recentPoses = this.poseHistory.slice(-3);
        if (recentPoses.length < 2) {
            return this.stabilityScore || 0;
        }

        // 简化计算：只比较最新的两帧
        const variation = this.calculatePoseVariationOptimized(
            recentPoses[recentPoses.length - 2],
            recentPoses[recentPoses.length - 1]
        );

        const stabilityScore = Math.max(0, 100 - variation);

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
        // 优化：只保存关键信息，减少内存占用
        const simplifiedPose = {
            pose: {
                keypoints: pose.pose.keypoints.filter(kp => kp.score > 0.5).map(kp => ({
                    part: kp.part,
                    position: { x: kp.position.x, y: kp.position.y },
                    score: kp.score
                }))
            }
        };

        this.poseHistory.push(simplifiedPose);
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

    // 优化版本的姿态变化计算 - 只计算关键点
    calculatePoseVariationOptimized(pose1, pose2) {
        if (!pose1.pose || !pose2.pose || !pose1.pose.keypoints || !pose2.pose.keypoints) {
            return 100;
        }

        // 只检查关键的身体部位，减少计算量
        const keyParts = ['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee'];
        let totalDistance = 0;
        let validPoints = 0;

        keyParts.forEach(partName => {
            const kp1 = pose1.pose.keypoints.find(kp => kp.part === partName);
            const kp2 = pose2.pose.keypoints.find(kp => kp.part === partName);

            if (kp1 && kp2 && kp1.score > 0.5 && kp2.score > 0.5) {
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
            holdTime: this.holdTime,
            // 游戏化数据
            combo: this.combo,
            maxCombo: this.maxCombo,
            totalScore: this.totalScore,
            level: this.level,
            experience: this.experience,
            achievements: this.achievements,
            streakBonus: this.streakBonus,
            perfectCount: this.perfectCount,
            goodCount: this.goodCount
        };
    }

    // 更新游戏化元素
    updateGameElements() {
        const scoreThreshold = 80; // 良好动作阈值
        const perfectThreshold = 95; // 完美动作阈值

        if (this.currentScore >= perfectThreshold) {
            this.combo++;
            this.perfectCount++;
            this.streakBonus = Math.min(this.streakBonus + 0.1, 3.0); // 最大3倍奖励
            this.checkAchievements('perfect');
        } else if (this.currentScore >= scoreThreshold) {
            this.combo++;
            this.goodCount++;
            this.streakBonus = Math.min(this.streakBonus + 0.05, 2.0); // 最大2倍奖励
            this.checkAchievements('good');
        } else {
            // 重置连击
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
                this.checkAchievements('combo');
            }
            this.combo = 0;
            this.streakBonus = 1.0;
        }

        // 计算经验值和等级
        const bonusScore = Math.floor(this.currentScore * this.streakBonus);
        this.experience += bonusScore;
        this.totalScore += bonusScore;

        // 等级提升
        const newLevel = Math.floor(this.experience / 1000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.checkAchievements('levelUp');
        }
    }

    // 检查成就
    checkAchievements(type) {
        const newAchievements = [];

        switch (type) {
            case 'perfect':
                if (this.perfectCount === 1) {
                    newAchievements.push({ name: '初次完美', description: '获得第一个完美动作', icon: '⭐' });
                } else if (this.perfectCount === 10) {
                    newAchievements.push({ name: '完美十连', description: '获得10个完美动作', icon: '🌟' });
                } else if (this.perfectCount === 50) {
                    newAchievements.push({ name: '完美大师', description: '获得50个完美动作', icon: '💫' });
                }
                break;

            case 'combo':
                if (this.maxCombo === 5) {
                    newAchievements.push({ name: '连击新手', description: '达成5连击', icon: '🔥' });
                } else if (this.maxCombo === 10) {
                    newAchievements.push({ name: '连击高手', description: '达成10连击', icon: '⚡' });
                } else if (this.maxCombo === 20) {
                    newAchievements.push({ name: '连击大师', description: '达成20连击', icon: '💥' });
                }
                break;

            case 'levelUp':
                if (this.level === 5) {
                    newAchievements.push({ name: '初级练习者', description: '达到5级', icon: '🥉' });
                } else if (this.level === 10) {
                    newAchievements.push({ name: '中级练习者', description: '达到10级', icon: '🥈' });
                } else if (this.level === 20) {
                    newAchievements.push({ name: '高级练习者', description: '达到20级', icon: '🥇' });
                }
                break;

            case 'good':
                if (this.goodCount === 20) {
                    newAchievements.push({ name: '稳定发挥', description: '获得20个良好动作', icon: '👍' });
                } else if (this.goodCount === 100) {
                    newAchievements.push({ name: '持之以恒', description: '获得100个良好动作', icon: '💪' });
                }
                break;
        }

        // 添加新成就
        newAchievements.forEach(achievement => {
            if (!this.achievements.find(a => a.name === achievement.name)) {
                this.achievements.push(achievement);
            }
        });
    }

    // 获取当前等级进度
    getLevelProgress() {
        const currentLevelExp = (this.level - 1) * 1000;
        const nextLevelExp = this.level * 1000;
        const progress = ((this.experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
        return Math.min(progress, 100);
    }

    // 获取连击奖励文本
    getComboText() {
        if (this.combo >= 20) return '🔥 超级连击！';
        if (this.combo >= 10) return '⚡ 连击中！';
        if (this.combo >= 5) return '🎯 连击！';
        return '';
    }

    // 重置游戏化数据
    resetGameData() {
        this.combo = 0;
        this.maxCombo = 0;
        this.totalScore = 0;
        this.level = 1;
        this.experience = 0;
        this.achievements = [];
        this.streakBonus = 1.0;
        this.perfectCount = 0;
        this.goodCount = 0;
    }
}

// 导出类
window.ScoringSystem = ScoringSystem;
