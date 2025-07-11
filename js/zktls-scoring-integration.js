/**
 * zkTLS Scoring Integration
 * 将zkTLS证明系统与现有评分系统集成
 */

class ZKTLSScoringIntegration {
    constructor(scoringSystem, zkTLSIntegration) {
        this.scoringSystem = scoringSystem;
        this.zkTLSIntegration = zkTLSIntegration;
        this.config = ZKTLSConfig;
        
        // 证明生成配置
        this.proofConfig = {
            autoGenerate: false, // 是否自动生成证明
            minScoreForProof: 75, // 生成证明的最低分数
            minDurationForProof: 3, // 生成证明的最低持续时间（秒）
            minAccuracyForProof: 80, // 生成证明的最低准确度
            cooldownPeriod: 30000, // 证明生成冷却时间（毫秒）
        };
        
        // 状态跟踪
        this.lastProofTime = 0;
        this.pendingProofs = new Map();
        this.proofQueue = [];
        
        console.log('ZKTLSScoringIntegration 初始化');
    }

    /**
     * 检查是否可以生成证明
     */
    canGenerateProof(scoreData) {
        const now = Date.now();
        
        // 检查冷却时间
        if (now - this.lastProofTime < this.proofConfig.cooldownPeriod) {
            return {
                canGenerate: false,
                reason: '证明生成冷却中',
                remainingTime: this.proofConfig.cooldownPeriod - (now - this.lastProofTime)
            };
        }

        // 检查zkTLS服务状态
        if (!this.zkTLSIntegration.canGenerateProof()) {
            return {
                canGenerate: false,
                reason: this.zkTLSIntegration.getInitializationError() || 'zkTLS服务未就绪'
            };
        }

        // 检查分数要求 - 修复数据映射问题
        const proofData = {
            score: scoreData.currentScore,
            duration: scoreData.holdTime || 0, // 使用实际持续时间而不是durationScore
            accuracy: scoreData.accuracy
        };

        console.log('🔍 证明条件检查:', {
            current: proofData,
            requirements: this.config.conditions,
            scoreData: scoreData
        });

        const checks = this.config.checkProofConditions(proofData);

        if (!checks.passed) {
            const failedChecks = Object.entries(checks.checks)
                .filter(([key, passed]) => !passed)
                .map(([key]) => key);
            
            return {
                canGenerate: false,
                reason: `未满足证明条件: ${failedChecks.join(', ')}`,
                requirements: checks.requirements,
                current: {
                    score: scoreData.currentScore,
                    duration: scoreData.duration,
                    accuracy: scoreData.accuracy
                }
            };
        }

        return { canGenerate: true };
    }

    /**
     * 生成姿态成就证明
     */
    async generatePoseProof(poseKey, scoreData) {
        try {
            const canGenerate = this.canGenerateProof(scoreData);
            if (!canGenerate.canGenerate) {
                throw new Error(canGenerate.reason);
            }

            console.log('开始生成姿态证明:', poseKey, scoreData);

            // 准备证明数据
            const poseData = {
                poseName: poseKey,
                score: scoreData.currentScore,
                duration: scoreData.duration,
                accuracy: scoreData.accuracy,
                stability: scoreData.stability,
                timestamp: Date.now(),
                userAddress: this.zkTLSIntegration.userAddress,
                level: scoreData.level,
                combo: scoreData.combo,
                totalScore: scoreData.totalScore
            };

            // 生成证明
            const proof = await this.zkTLSIntegration.generatePoseProof(poseData);
            
            // 更新状态
            this.lastProofTime = Date.now();
            
            // 触发成就检查
            this.checkProofAchievements(proof);
            
            console.log('✅ 姿态证明生成成功:', proof.id);
            
            return proof;

        } catch (error) {
            console.error('❌ 生成姿态证明失败:', error);
            throw error;
        }
    }

    /**
     * 自动证明生成检查
     */
    checkAutoProofGeneration(poseKey, scoreData) {
        if (!this.proofConfig.autoGenerate) {
            return false;
        }

        const canGenerate = this.canGenerateProof(scoreData);
        if (canGenerate.canGenerate) {
            // 添加到队列，避免阻塞主线程
            this.queueProofGeneration(poseKey, scoreData);
            return true;
        }

        return false;
    }

    /**
     * 队列化证明生成
     */
    queueProofGeneration(poseKey, scoreData) {
        const proofRequest = {
            id: this.generateRequestId(),
            poseKey,
            scoreData: { ...scoreData },
            timestamp: Date.now()
        };

        this.proofQueue.push(proofRequest);
        
        // 异步处理队列
        setTimeout(() => this.processProofQueue(), 100);
    }

    /**
     * 处理证明队列
     */
    async processProofQueue() {
        if (this.proofQueue.length === 0) {
            return;
        }

        const request = this.proofQueue.shift();
        
        try {
            await this.generatePoseProof(request.poseKey, request.scoreData);
        } catch (error) {
            console.warn('队列证明生成失败:', error.message);
        }

        // 继续处理队列
        if (this.proofQueue.length > 0) {
            setTimeout(() => this.processProofQueue(), 1000);
        }
    }

    /**
     * 检查证明相关成就
     */
    checkProofAchievements(proof) {
        const proofHistory = this.zkTLSIntegration.getProofHistory();
        const proofCount = proofHistory.length;
        
        const newAchievements = [];

        // 首次证明成就
        if (proofCount === 1) {
            newAchievements.push({
                name: '区块链见证者',
                description: '生成第一个zkTLS证明',
                icon: '🔐',
                type: 'proof'
            });
        }

        // 证明数量成就
        if (proofCount === 5) {
            newAchievements.push({
                name: '证明收集者',
                description: '生成5个zkTLS证明',
                icon: '📜',
                type: 'proof'
            });
        } else if (proofCount === 10) {
            newAchievements.push({
                name: '证明专家',
                description: '生成10个zkTLS证明',
                icon: '🏆',
                type: 'proof'
            });
        } else if (proofCount === 25) {
            newAchievements.push({
                name: '证明大师',
                description: '生成25个zkTLS证明',
                icon: '👑',
                type: 'proof'
            });
        }

        // 高分证明成就
        if (proof.poseData.score >= 95) {
            newAchievements.push({
                name: '完美证明',
                description: '生成95分以上的证明',
                icon: '⭐',
                type: 'proof'
            });
        }

        // 添加成就到评分系统
        newAchievements.forEach(achievement => {
            this.addAchievementToScoringSystem(achievement);
        });
    }

    /**
     * 添加成就到评分系统
     */
    addAchievementToScoringSystem(achievement) {
        // 检查是否已存在
        const exists = this.scoringSystem.achievements.find(a => a.name === achievement.name);
        if (!exists) {
            this.scoringSystem.achievements.push(achievement);
            this.scoringSystem.newAchievements = this.scoringSystem.newAchievements || [];
            this.scoringSystem.newAchievements.push(achievement);
            console.log('🏆 新成就解锁:', achievement.name);
        }
    }

    /**
     * 获取证明统计
     */
    getProofStats() {
        const proofHistory = this.zkTLSIntegration.getProofHistory();
        
        return {
            totalProofs: proofHistory.length,
            verifiedProofs: proofHistory.filter(p => p.verified).length,
            averageScore: proofHistory.length > 0 ? 
                Math.round(proofHistory.reduce((sum, p) => sum + p.poseData.score, 0) / proofHistory.length) : 0,
            highestScore: proofHistory.length > 0 ? 
                Math.max(...proofHistory.map(p => p.poseData.score)) : 0,
            lastProofTime: this.lastProofTime,
            canGenerateNow: Date.now() - this.lastProofTime >= this.proofConfig.cooldownPeriod
        };
    }

    /**
     * 设置自动证明生成
     */
    setAutoProofGeneration(enabled) {
        this.proofConfig.autoGenerate = enabled;
        console.log('自动证明生成:', enabled ? '已启用' : '已禁用');
    }

    /**
     * 更新证明配置
     */
    updateProofConfig(config) {
        this.proofConfig = { ...this.proofConfig, ...config };
        console.log('证明配置已更新:', this.proofConfig);
    }

    /**
     * 生成请求ID
     */
    generateRequestId() {
        return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    /**
     * 获取冷却时间剩余
     */
    getCooldownRemaining() {
        const remaining = this.proofConfig.cooldownPeriod - (Date.now() - this.lastProofTime);
        return Math.max(0, remaining);
    }

    /**
     * 格式化冷却时间
     */
    formatCooldownTime(ms) {
        const seconds = Math.ceil(ms / 1000);
        return `${seconds}秒`;
    }

    /**
     * 清除证明队列
     */
    clearProofQueue() {
        this.proofQueue = [];
        console.log('证明队列已清除');
    }

    /**
     * 获取状态信息
     */
    getStatus() {
        return {
            zkTLSReady: this.zkTLSIntegration.isInitialized,
            autoGenerate: this.proofConfig.autoGenerate,
            queueLength: this.proofQueue.length,
            cooldownRemaining: this.getCooldownRemaining(),
            lastProofTime: this.lastProofTime,
            config: this.proofConfig
        };
    }
}

// 导出类
window.ZKTLSScoringIntegration = ZKTLSScoringIntegration;
