/**
 * zkTLS Integration Module for Rhythm Pose
 * Handles zkTLS proof generation and verification for pose achievements
 */

class ZKTLSIntegration {
    constructor() {
        this.primusZKTLS = null;
        this.isInitialized = false;
        // 使用全局配置
        this.config = window.ZKTLSConfig || {
            app: {
                appId: "0x4f809dcaaa7f15943e6899ebb918d4d347049d30",
                appSecret: "0x2074e458ba966b455576b98789dc3b5536aa359dfc03caef212ed2f8f419d60a",
                workMode: "proxytls",
                environment: "testnet"
            },
            templates: {
                poseAchievement: {
                    id: "rhythm_pose_achievement"
                }
            }
        };
        this.userAddress = null;
        this.proofHistory = [];
        
        console.log('ZKTLSIntegration 初始化');
    }

    /**
     * 初始化zkTLS服务
     */
    async initialize() {
        try {
            // 检查是否已加载zkTLS SDK
            if (typeof PrimusZKTLS === 'undefined') {
                throw new Error('zkTLS SDK未加载，请检查网络连接');
            }

            console.log('🔧 检测到 zkTLS 环境:', {
                hasPrimusZKTLS: typeof PrimusZKTLS !== 'undefined',
                hasEthers: typeof ethers !== 'undefined',
                wrapperVersion: window.ZKTLS_BROWSER_WRAPPER_VERSION || 'unknown'
            });

            // 初始化PrimusZKTLS实例
            this.primusZKTLS = new PrimusZKTLS();

            // 初始化认证，添加浏览器环境配置
            const initOptions = {
                platform: "pc",
                env: this.config.app.environment || "testnet"
            };

            const initResult = await this.primusZKTLS.init(
                this.config.app.appId,
                this.config.app.appSecret,
                initOptions
            );

            console.log('zkTLS初始化结果:', initResult);

            if (initResult && initResult.success) {
                this.isInitialized = true;
                console.log('✅ zkTLS服务初始化成功');
                return true;
            } else {
                throw new Error(`zkTLS初始化失败: ${initResult?.message || '未知错误'}`);
            }
        } catch (error) {
            console.error('❌ zkTLS初始化失败:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    /**
     * 设置用户地址
     */
    setUserAddress(address) {
        this.userAddress = address;
        console.log('设置用户地址:', address);
    }

    /**
     * 生成姿态成就证明
     */
    async generatePoseProof(poseData) {
        if (!this.isInitialized) {
            throw new Error('zkTLS服务未初始化');
        }

        if (!this.userAddress) {
            throw new Error('用户地址未设置');
        }

        try {
            console.log('开始生成姿态证明:', poseData);

            // 生成认证请求
            const templateId = this.config.templates?.poseAchievement?.id || "rhythm_pose_achievement";
            const request = this.primusZKTLS.generateRequestParams(
                templateId,
                this.userAddress
            );

            // 设置zkTLS模式
            request.setAttMode({
                algorithmType: this.config.app?.workMode || "proxytls",
            });

            // 设置认证条件 - 基于姿态数据
            const attConditions = [
                [
                    {
                        field: "pose_name",
                        op: "=",
                        value: poseData.poseName,
                    },
                    {
                        field: "score",
                        op: ">=",
                        value: poseData.score.toString(),
                    },
                    {
                        field: "duration",
                        op: ">=",
                        value: poseData.duration.toString(),
                    },
                    {
                        field: "timestamp",
                        op: "=",
                        value: poseData.timestamp.toString(),
                    }
                ],
            ];
            request.setAttConditions(attConditions);

            // 转换请求为字符串
            const requestStr = request.toJsonString();

            // 签名请求
            const signedRequestStr = await this.primusZKTLS.sign(requestStr);

            // 开始认证过程
            const attestation = await this.primusZKTLS.startAttestation(signedRequestStr);
            console.log('生成的认证:', attestation);

            // 验证签名
            const verifyResult = await this.primusZKTLS.verifyAttestation(attestation);
            console.log('验证结果:', verifyResult);

            if (verifyResult === true) {
                // 保存证明到历史记录
                const proof = {
                    id: this.generateProofId(),
                    poseData: poseData,
                    attestation: attestation,
                    timestamp: Date.now(),
                    verified: true
                };
                
                this.proofHistory.push(proof);
                console.log('✅ 姿态证明生成成功');
                
                return proof;
            } else {
                throw new Error('证明验证失败');
            }

        } catch (error) {
            console.error('❌ 生成姿态证明失败:', error);
            throw error;
        }
    }

    /**
     * 验证现有证明
     */
    async verifyProof(attestation) {
        if (!this.isInitialized) {
            throw new Error('zkTLS服务未初始化');
        }

        try {
            const verifyResult = await this.primusZKTLS.verifyAttestation(attestation);
            console.log('证明验证结果:', verifyResult);
            return verifyResult === true;
        } catch (error) {
            console.error('❌ 证明验证失败:', error);
            return false;
        }
    }

    /**
     * 获取证明历史
     */
    getProofHistory() {
        return this.proofHistory;
    }

    /**
     * 获取最新证明
     */
    getLatestProof() {
        return this.proofHistory.length > 0 ? 
            this.proofHistory[this.proofHistory.length - 1] : null;
    }

    /**
     * 清除证明历史
     */
    clearProofHistory() {
        this.proofHistory = [];
        console.log('证明历史已清除');
    }

    /**
     * 生成证明ID
     */
    generateProofId() {
        return 'proof_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 获取服务状态
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            userAddress: this.userAddress,
            proofCount: this.proofHistory.length,
            config: {
                appId: this.config.appId,
                templateId: this.config.templateId,
                workMode: this.config.workMode
            }
        };
    }

    /**
     * 导出证明数据
     */
    exportProofData() {
        return {
            userAddress: this.userAddress,
            proofs: this.proofHistory.map(proof => ({
                id: proof.id,
                poseName: proof.poseData.poseName,
                score: proof.poseData.score,
                duration: proof.poseData.duration,
                timestamp: proof.timestamp,
                verified: proof.verified
            }))
        };
    }

    /**
     * 格式化证明用于显示
     */
    formatProofForDisplay(proof) {
        if (!proof) return null;

        return {
            id: proof.id,
            poseName: proof.poseData.poseName,
            score: proof.poseData.score,
            duration: proof.poseData.duration,
            timestamp: new Date(proof.timestamp).toLocaleString('zh-CN'),
            verified: proof.verified ? '✅ 已验证' : '❌ 未验证'
        };
    }

    /**
     * 检查是否可以生成证明
     */
    canGenerateProof() {
        return this.isInitialized && this.userAddress;
    }

    /**
     * 获取错误信息
     */
    getInitializationError() {
        if (!this.isInitialized) {
            if (typeof PrimusZKTLS === 'undefined') {
                return 'zkTLS SDK未加载';
            }
            return 'zkTLS服务初始化失败';
        }
        if (!this.userAddress) {
            return '用户地址未设置';
        }
        return null;
    }
}

// 导出类供其他模块使用
window.ZKTLSIntegration = ZKTLSIntegration;
