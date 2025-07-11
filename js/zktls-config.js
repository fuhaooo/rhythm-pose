/**
 * zkTLS Configuration for Rhythm Pose
 * 配置zkTLS相关参数和模板
 */

const ZKTLSConfig = {
    // 应用配置
    app: {
        // 应用ID - 从Primus平台获取
        appId: "0x4f809dcaaa7f15943e6899ebb918d4d347049d30",
        
        // 应用密钥 - 注意：生产环境中应该在后端处理，不应暴露在前端
        appSecret: "0x2074e458ba966b455576b98789dc3b5536aa359dfc03caef212ed2f8f419d60a",
        
        // 工作模式
        workMode: "proxytls", // 可选: "proxytls", "directtls"
        
        // 环境配置
        environment: "testnet", // 可选: "mainnet", "testnet"
    },

    // 模板配置
    templates: {
        // 姿态成就证明模板
        poseAchievement: {
            id: "rhythm_pose_achievement",
            name: "Rhythm Pose Achievement",
            description: "验证用户完成特定姿态动作的成就",
            fields: [
                {
                    name: "pose_name",
                    type: "string",
                    description: "姿态名称"
                },
                {
                    name: "score",
                    type: "number",
                    description: "得分 (0-100)"
                },
                {
                    name: "duration",
                    type: "number",
                    description: "持续时间 (秒)"
                },
                {
                    name: "accuracy",
                    type: "number",
                    description: "准确度 (0-100)"
                },
                {
                    name: "stability",
                    type: "number",
                    description: "稳定性 (0-100)"
                },
                {
                    name: "timestamp",
                    type: "number",
                    description: "时间戳"
                },
                {
                    name: "user_address",
                    type: "string",
                    description: "用户钱包地址"
                }
            ]
        },

        // 高分记录证明模板
        highScore: {
            id: "rhythm_pose_high_score",
            name: "Rhythm Pose High Score",
            description: "验证用户创造高分记录",
            fields: [
                {
                    name: "pose_name",
                    type: "string",
                    description: "姿态名称"
                },
                {
                    name: "score",
                    type: "number",
                    description: "得分"
                },
                {
                    name: "previous_record",
                    type: "number",
                    description: "之前的记录"
                },
                {
                    name: "improvement",
                    type: "number",
                    description: "提升幅度"
                },
                {
                    name: "timestamp",
                    type: "number",
                    description: "时间戳"
                }
            ]
        },

        // 连续成就证明模板
        streakAchievement: {
            id: "rhythm_pose_streak",
            name: "Rhythm Pose Streak Achievement",
            description: "验证用户连续完成动作的成就",
            fields: [
                {
                    name: "streak_count",
                    type: "number",
                    description: "连击次数"
                },
                {
                    name: "pose_types",
                    type: "array",
                    description: "涉及的姿态类型"
                },
                {
                    name: "total_score",
                    type: "number",
                    description: "总得分"
                },
                {
                    name: "average_score",
                    type: "number",
                    description: "平均得分"
                },
                {
                    name: "duration",
                    type: "number",
                    description: "总持续时间"
                }
            ]
        }
    },

    // 证明条件配置
    conditions: {
        // 最低分数要求
        minScore: 75,
        
        // 最低持续时间要求 (秒)
        minDuration: 3,
        
        // 最低准确度要求
        minAccuracy: 80,
        
        // 高分记录阈值
        highScoreThreshold: 90,
        
        // 连击成就阈值
        streakThresholds: [5, 10, 20, 50, 100]
    },

    // UI配置
    ui: {
        // 证明生成按钮文本
        generateProofText: "生成zkTLS证明",
        
        // 验证按钮文本
        verifyProofText: "验证证明",
        
        // 状态文本
        statusTexts: {
            initializing: "正在初始化zkTLS...",
            ready: "zkTLS已就绪",
            generating: "正在生成证明...",
            verifying: "正在验证证明...",
            success: "操作成功",
            error: "操作失败"
        },
        
        // 错误消息
        errorMessages: {
            sdkNotLoaded: "zkTLS SDK未加载，请检查网络连接",
            initFailed: "zkTLS初始化失败",
            noUserAddress: "请先连接钱包",
            scoreNotMet: "得分未达到证明要求",
            durationNotMet: "持续时间未达到要求",
            generateFailed: "证明生成失败",
            verifyFailed: "证明验证失败"
        }
    },

    // 开发配置
    development: {
        // 是否启用调试日志
        enableDebugLogs: true,
        
        // 是否使用模拟数据
        useMockData: false,
        
        // 模拟延迟 (毫秒)
        mockDelay: 1000,
        
        // 测试用户地址
        testUserAddress: "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87"
    },

    // 网络配置
    network: {
        // API端点
        endpoints: {
            mainnet: "https://api.primuslabs.org",
            testnet: "https://testnet-api.primuslabs.org"
        },
        
        // 超时设置 (毫秒)
        timeout: 30000,
        
        // 重试次数
        retryAttempts: 3,
        
        // 重试延迟 (毫秒)
        retryDelay: 1000
    },

    // 存储配置
    storage: {
        // 本地存储键名
        keys: {
            userAddress: "zktls_user_address",
            proofHistory: "zktls_proof_history",
            settings: "zktls_settings"
        },
        
        // 最大存储的证明数量
        maxProofHistory: 100,
        
        // 数据过期时间 (毫秒)
        dataExpiry: 7 * 24 * 60 * 60 * 1000 // 7天
    }
};

// 获取当前环境的配置
ZKTLSConfig.getCurrentConfig = function() {
    const env = this.app.environment;
    return {
        ...this,
        apiEndpoint: this.network.endpoints[env],
        isProduction: env === "mainnet"
    };
};

// 验证配置
ZKTLSConfig.validate = function() {
    const errors = [];
    
    if (!this.app.appId) {
        errors.push("缺少应用ID");
    }
    
    if (!this.app.appSecret) {
        errors.push("缺少应用密钥");
    }
    
    if (!this.templates.poseAchievement.id) {
        errors.push("缺少姿态成就模板ID");
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

// 获取模板配置
ZKTLSConfig.getTemplate = function(templateName) {
    return this.templates[templateName] || null;
};

// 检查是否满足证明条件
ZKTLSConfig.checkProofConditions = function(poseData) {
    const conditions = this.conditions;
    const checks = {
        score: poseData.score >= conditions.minScore,
        duration: poseData.duration >= conditions.minDuration,
        accuracy: poseData.accuracy >= conditions.minAccuracy
    };
    
    return {
        passed: Object.values(checks).every(check => check),
        checks: checks,
        requirements: conditions
    };
};

// 导出配置
window.ZKTLSConfig = ZKTLSConfig;
