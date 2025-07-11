/**
 * Smart Contract Integration with zkTLS
 * 将zkTLS证明与智能合约集成，实现链上验证
 */

class SmartContractIntegration {
    constructor(zkTLSIntegration) {
        this.zkTLSIntegration = zkTLSIntegration;
        this.web3 = null;
        this.contract = null;
        this.userAccount = null;
        
        // 合约配置 (需要根据实际部署更新)
        this.contractConfig = {
            address: "0x...", // 合约地址，需要部署后更新
            abi: [
                // 简化的ABI，实际使用时需要完整的ABI
                {
                    "inputs": [
                        {"name": "_poseName", "type": "string"},
                        {"name": "_poseType", "type": "uint8"},
                        {"name": "_score", "type": "uint256"},
                        {"name": "_duration", "type": "uint256"},
                        {"name": "_zkProof", "type": "string"}
                    ],
                    "name": "recordVerifiedPose",
                    "outputs": [],
                    "type": "function"
                },
                {
                    "inputs": [{"name": "_user", "type": "address"}],
                    "name": "getUserAchievement",
                    "outputs": [
                        {"name": "totalPoses", "type": "uint256"},
                        {"name": "bestScore", "type": "uint256"},
                        {"name": "totalDuration", "type": "uint256"},
                        {"name": "level", "type": "uint256"},
                        {"name": "experience", "type": "uint256"}
                    ],
                    "type": "function"
                }
            ]
        };
        
        this.isInitialized = false;
        console.log('SmartContractIntegration 初始化');
    }

    /**
     * 初始化Web3和智能合约
     */
    async initialize() {
        try {
            // 检查是否有Web3提供者
            if (typeof window.ethereum !== 'undefined') {
                // 使用MetaMask
                this.web3 = new Web3(window.ethereum);
                
                // 请求账户访问
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                if (accounts.length > 0) {
                    this.userAccount = accounts[0];
                    console.log('连接的账户:', this.userAccount);
                }
                
                // 初始化合约实例
                if (this.contractConfig.address !== "0x...") {
                    this.contract = new this.web3.eth.Contract(
                        this.contractConfig.abi,
                        this.contractConfig.address
                    );
                    console.log('智能合约已连接:', this.contractConfig.address);
                }
                
                this.isInitialized = true;
                console.log('✅ 智能合约集成初始化成功');
                return true;
                
            } else {
                throw new Error('未检测到Web3提供者 (MetaMask)');
            }
        } catch (error) {
            console.error('❌ 智能合约集成初始化失败:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    /**
     * 记录带zkTLS证明的姿态成就到区块链
     */
    async recordVerifiedPose(proof) {
        if (!this.isInitialized || !this.contract) {
            throw new Error('智能合约未初始化');
        }

        try {
            const poseData = proof.poseData;
            
            // 确定姿态类型
            let poseType = 0; // YOGA
            if (poseData.poseName.includes('hand') || poseData.poseName.includes('gesture')) {
                poseType = 1; // HAND_GESTURE
            } else if (poseData.poseName.includes('custom')) {
                poseType = 2; // CUSTOM
            }

            // 准备zkTLS证明数据
            const zkProofData = JSON.stringify({
                attestation: proof.attestation,
                proofId: proof.id,
                timestamp: proof.timestamp,
                verified: proof.verified
            });

            console.log('准备记录到区块链:', {
                poseName: poseData.poseName,
                poseType: poseType,
                score: poseData.score,
                duration: poseData.duration,
                zkProof: zkProofData.substring(0, 100) + '...'
            });

            // 调用智能合约
            const transaction = await this.contract.methods.recordVerifiedPose(
                poseData.poseName,
                poseType,
                poseData.score,
                poseData.duration,
                zkProofData
            ).send({
                from: this.userAccount,
                gas: 300000 // 估算的gas限制
            });

            console.log('✅ 区块链记录成功:', transaction.transactionHash);
            
            return {
                success: true,
                transactionHash: transaction.transactionHash,
                blockNumber: transaction.blockNumber
            };

        } catch (error) {
            console.error('❌ 区块链记录失败:', error);
            throw error;
        }
    }

    /**
     * 获取用户在区块链上的成就数据
     */
    async getUserAchievementFromChain(userAddress = null) {
        if (!this.isInitialized || !this.contract) {
            throw new Error('智能合约未初始化');
        }

        try {
            const address = userAddress || this.userAccount;
            if (!address) {
                throw new Error('用户地址未设置');
            }

            const result = await this.contract.methods.getUserAchievement(address).call();
            
            return {
                totalPoses: parseInt(result.totalPoses),
                bestScore: parseInt(result.bestScore),
                totalDuration: parseInt(result.totalDuration),
                level: parseInt(result.level),
                experience: parseInt(result.experience)
            };

        } catch (error) {
            console.error('❌ 获取链上成就数据失败:', error);
            throw error;
        }
    }

    /**
     * 验证zkTLS证明的有效性
     */
    async verifyProofOnChain(proof) {
        try {
            // 使用zkTLS集成验证证明
            const isValid = await this.zkTLSIntegration.verifyProof(proof.attestation);
            
            if (isValid) {
                console.log('✅ zkTLS证明验证成功');
                return true;
            } else {
                console.log('❌ zkTLS证明验证失败');
                return false;
            }
        } catch (error) {
            console.error('❌ 证明验证过程出错:', error);
            return false;
        }
    }

    /**
     * 批量上传证明到区块链
     */
    async batchUploadProofs(proofs) {
        const results = [];
        
        for (const proof of proofs) {
            try {
                // 验证证明
                const isValid = await this.verifyProofOnChain(proof);
                if (!isValid) {
                    results.push({
                        proofId: proof.id,
                        success: false,
                        error: '证明验证失败'
                    });
                    continue;
                }

                // 上传到区块链
                const result = await this.recordVerifiedPose(proof);
                results.push({
                    proofId: proof.id,
                    success: true,
                    transactionHash: result.transactionHash
                });

                // 添加延迟避免网络拥堵
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                results.push({
                    proofId: proof.id,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * 获取网络信息
     */
    async getNetworkInfo() {
        if (!this.web3) {
            return null;
        }

        try {
            const networkId = await this.web3.eth.net.getId();
            const blockNumber = await this.web3.eth.getBlockNumber();
            const gasPrice = await this.web3.eth.getGasPrice();

            return {
                networkId,
                blockNumber,
                gasPrice: this.web3.utils.fromWei(gasPrice, 'gwei') + ' Gwei'
            };
        } catch (error) {
            console.error('获取网络信息失败:', error);
            return null;
        }
    }

    /**
     * 获取用户余额
     */
    async getUserBalance() {
        if (!this.web3 || !this.userAccount) {
            return null;
        }

        try {
            const balance = await this.web3.eth.getBalance(this.userAccount);
            return this.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('获取用户余额失败:', error);
            return null;
        }
    }

    /**
     * 设置合约地址
     */
    setContractAddress(address) {
        this.contractConfig.address = address;
        
        if (this.web3 && address !== "0x...") {
            this.contract = new this.web3.eth.Contract(
                this.contractConfig.abi,
                address
            );
            console.log('合约地址已更新:', address);
        }
    }

    /**
     * 获取状态信息
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasWeb3: !!this.web3,
            hasContract: !!this.contract,
            userAccount: this.userAccount,
            contractAddress: this.contractConfig.address
        };
    }

    /**
     * 监听合约事件
     */
    setupEventListeners() {
        if (!this.contract) {
            return;
        }

        // 监听姿态记录事件
        this.contract.events.PoseRecorded({
            filter: { user: this.userAccount }
        })
        .on('data', (event) => {
            console.log('🎉 新的姿态记录事件:', event.returnValues);
            // 可以在这里触发UI更新
        })
        .on('error', (error) => {
            console.error('事件监听错误:', error);
        });

        // 监听成就解锁事件
        this.contract.events.AchievementUnlocked({
            filter: { user: this.userAccount }
        })
        .on('data', (event) => {
            console.log('🏆 新成就解锁:', event.returnValues);
            // 可以在这里显示成就通知
        })
        .on('error', (error) => {
            console.error('成就事件监听错误:', error);
        });
    }

    /**
     * 清理资源
     */
    cleanup() {
        if (this.contract) {
            // 停止事件监听
            this.contract.events.allEvents().removeAllListeners();
        }
        
        this.web3 = null;
        this.contract = null;
        this.userAccount = null;
        this.isInitialized = false;
        
        console.log('智能合约集成资源已清理');
    }
}

// 导出类
window.SmartContractIntegration = SmartContractIntegration;
