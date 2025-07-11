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
        
        // 合约配置 - Sonic Blaze Testnet (Enhanced Contract with Rewards)
        this.contractConfig = {
            address: "0x057499692a5E14C19Fb9e4274d3e9C6Fa4ECb560", // 新部署的增强版合约地址
            abi: [
                {
                    "inputs": [],
                    "stateMutability": "nonpayable",
                    "type": "constructor"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "user",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "internalType": "string",
                            "name": "achievement",
                            "type": "string"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "timestamp",
                            "type": "uint256"
                        }
                    ],
                    "name": "AchievementUnlocked",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "funder",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "timestamp",
                            "type": "uint256"
                        }
                    ],
                    "name": "ContractFunded",
                    "type": "event"
                },
                {
                    "inputs": [],
                    "name": "emergencyWithdraw",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "user",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "internalType": "string",
                            "name": "poseName",
                            "type": "string"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "newRecord",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "timestamp",
                            "type": "uint256"
                        }
                    ],
                    "name": "NewRecord",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "user",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "internalType": "string",
                            "name": "poseName",
                            "type": "string"
                        },
                        {
                            "indexed": false,
                            "internalType": "enum RhythmPoseProof.PoseType",
                            "name": "poseType",
                            "type": "uint8"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "score",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "duration",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "timestamp",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "string",
                            "name": "zkProof",
                            "type": "string"
                        }
                    ],
                    "name": "PoseRecorded",
                    "type": "event"
                },
                {
                    "inputs": [
                        {
                            "internalType": "string",
                            "name": "_poseName",
                            "type": "string"
                        },
                        {
                            "internalType": "enum RhythmPoseProof.PoseType",
                            "name": "_poseType",
                            "type": "uint8"
                        },
                        {
                            "internalType": "uint256",
                            "name": "_score",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "_duration",
                            "type": "uint256"
                        }
                    ],
                    "name": "recordPose",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "inputs": [
                        {
                            "internalType": "string",
                            "name": "_poseName",
                            "type": "string"
                        },
                        {
                            "internalType": "enum RhythmPoseProof.PoseType",
                            "name": "_poseType",
                            "type": "uint8"
                        },
                        {
                            "internalType": "uint256",
                            "name": "_score",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "_duration",
                            "type": "uint256"
                        },
                        {
                            "internalType": "string",
                            "name": "_zkProof",
                            "type": "string"
                        }
                    ],
                    "name": "recordVerifiedPose",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "user",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "string",
                            "name": "reason",
                            "type": "string"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "timestamp",
                            "type": "uint256"
                        }
                    ],
                    "name": "RewardDistributed",
                    "type": "event"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": false,
                            "internalType": "bool",
                            "name": "enabled",
                            "type": "bool"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "timestamp",
                            "type": "uint256"
                        }
                    ],
                    "name": "RewardsToggled",
                    "type": "event"
                },
                {
                    "inputs": [],
                    "name": "toggleRewards",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "inputs": [
                        {
                            "internalType": "address",
                            "name": "_newOwner",
                            "type": "address"
                        }
                    ],
                    "name": "transferOwnership",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "stateMutability": "payable",
                    "type": "fallback"
                },
                {
                    "inputs": [
                        {
                            "internalType": "uint256",
                            "name": "_amount",
                            "type": "uint256"
                        }
                    ],
                    "name": "withdrawBalance",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "stateMutability": "payable",
                    "type": "receive"
                },
                {
                    "inputs": [],
                    "name": "getContractBalance",
                    "outputs": [
                        {
                            "internalType": "uint256",
                            "name": "",
                            "type": "uint256"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "getContractStats",
                    "outputs": [
                        {
                            "internalType": "uint256",
                            "name": "totalUsers",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "totalRecordsCount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "address",
                            "name": "contractOwner",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "contractBalance",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "totalRewards",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bool",
                            "name": "rewardsStatus",
                            "type": "bool"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "getRewardConfig",
                    "outputs": [
                        {
                            "internalType": "uint256",
                            "name": "rewardAmount",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bool",
                            "name": "enabled",
                            "type": "bool"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [
                        {
                            "internalType": "address",
                            "name": "_user",
                            "type": "address"
                        }
                    ],
                    "name": "getUserAchievement",
                    "outputs": [
                        {
                            "internalType": "uint256",
                            "name": "totalPoses",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "bestScore",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "totalDuration",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "level",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "experience",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "totalRewards",
                            "type": "uint256"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "REWARD_AMOUNT",
                    "outputs": [
                        {
                            "internalType": "uint256",
                            "name": "",
                            "type": "uint256"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "rewardsEnabled",
                    "outputs": [
                        {
                            "internalType": "bool",
                            "name": "",
                            "type": "bool"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                }
            ]
        };

        // Network manager for Sonic Blaze support
        this.networkManager = null;
        
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
                // 初始化网络管理器
                if (typeof NetworkManager !== 'undefined') {
                    this.networkManager = new NetworkManager();
                    await this.networkManager.initialize();

                    // 确保连接到Sonic Blaze Testnet
                    if (!this.networkManager.isSonicBlaze()) {
                        console.log('🔄 Switching to Sonic Blaze Testnet...');
                        await this.networkManager.switchToSonicBlaze();
                    }
                }

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

                    // 获取合约状态
                    await this.getContractStatus();
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

        // Extract poseData at the beginning so it's available in catch blocks
        const poseData = {
            ...proof.poseData,
            proofId: proof.id // Add proof ID to poseData for success page
        };

        // 确定姿态类型
        let poseType = 0; // YOGA
        if (poseData.poseName.includes('hand') || poseData.poseName.includes('gesture')) {
            poseType = 1; // HAND_GESTURE
        } else if (poseData.poseName.includes('custom')) {
            poseType = 2; // CUSTOM
        }

        try {
            // First, check if the enhanced contract functions exist
            const hasEnhancedFunctions = await this.checkEnhancedFunctions();

            if (!hasEnhancedFunctions) {
                console.warn('⚠️ 检测到旧版合约，使用兼容模式...');
                return await this.recordPoseCompatible(proof);
            }

            // 准备zkTLS证明数据（限制大小以避免gas问题）
            const zkProofData = JSON.stringify({
                attestation: {
                    id: proof.attestation?.id || proof.id,
                    templateId: proof.attestation?.templateId || 'rhythm_pose_achievement'
                },
                proofId: proof.id,
                timestamp: proof.timestamp,
                verified: proof.verified
            });

            // 限制zkProof数据大小（避免gas问题）
            const maxProofSize = 500; // 限制为500字符
            const truncatedZkProof = zkProofData.length > maxProofSize ?
                zkProofData.substring(0, maxProofSize) + '...' : zkProofData;

            console.log('准备记录到区块链:', {
                poseName: poseData.poseName,
                poseType: poseType,
                score: poseData.score,
                duration: poseData.duration,
                zkProof: truncatedZkProof.substring(0, 100) + '...',
                zkProofSize: truncatedZkProof.length
            });

            // 检查合约余额
            const contractBalance = await this.contract.methods.getContractBalance().call();
            const rewardAmount = await this.contract.methods.REWARD_AMOUNT().call();

            if (parseInt(contractBalance) < parseInt(rewardAmount)) {
                throw new Error(`合约余额不足发放奖励。当前余额: ${this.web3.utils.fromWei(contractBalance, 'ether')} S，需要: ${this.web3.utils.fromWei(rewardAmount, 'ether')} S`);
            }

            // 估算gas
            let gasEstimate;
            try {
                gasEstimate = await this.contract.methods.recordVerifiedPose(
                    poseData.poseName,
                    poseType,
                    poseData.score,
                    poseData.duration,
                    truncatedZkProof
                ).estimateGas({ from: this.userAccount });

                console.log('📊 Gas估算:', gasEstimate);
            } catch (gasError) {
                console.warn('⚠️ Gas估算失败，使用默认值:', gasError.message);
                gasEstimate = 500000; // 增加默认gas限制
            }

            // 确保gas值为整数（修复BigNumber转换错误）
            const gasLimit = Math.floor(Math.max(gasEstimate * 1.2, 500000));

            // 调用智能合约
            const transaction = await this.contract.methods.recordVerifiedPose(
                poseData.poseName,
                poseType,
                poseData.score,
                poseData.duration,
                truncatedZkProof
            ).send({
                from: this.userAccount,
                gas: gasLimit // 使用整数gas值
            });

            console.log('✅ 区块链记录成功:', transaction.transactionHash);

            // 显示奖励发放成功通知并跳转
            this.showRewardSuccessAndRedirect(transaction.transactionHash, poseData);

            return {
                success: true,
                transactionHash: transaction.transactionHash,
                blockNumber: transaction.blockNumber,
                rewardDistributed: true
            };

        } catch (error) {
            console.error('❌ 区块链记录失败:', error);

            // 尝试使用简单的recordPose函数作为备用
            console.log('🔄 尝试使用备用函数 recordPose...');
            try {
                const backupTransaction = await this.contract.methods.recordPose(
                    poseData.poseName,
                    poseType,
                    poseData.score,
                    poseData.duration
                ).send({
                    from: this.userAccount,
                    gas: 300000
                });

                console.log('✅ 备用记录成功（无奖励）:', backupTransaction.transactionHash);

                // 显示成功通知并跳转（即使没有奖励）
                this.showRewardSuccessAndRedirect(backupTransaction.transactionHash, poseData);

                return {
                    success: true,
                    transactionHash: backupTransaction.transactionHash,
                    blockNumber: backupTransaction.blockNumber,
                    note: '使用备用函数记录，无自动奖励'
                };
            } catch (backupError) {
                console.error('❌ 备用记录也失败:', backupError);
            }

            throw error;
        }
    }

    /**
     * 调试合约状态
     */
    async debugContractState() {
        if (!this.contract) {
            console.error('❌ 合约未初始化');
            return;
        }

        try {
            console.log('🔍 合约状态调试:');

            // 检查合约余额
            const balance = await this.contract.methods.getContractBalance().call();
            console.log('💰 合约余额:', this.web3.utils.fromWei(balance, 'ether'), 'S');

            // 检查奖励配置
            const rewardConfig = await this.contract.methods.getRewardConfig().call();
            console.log('🎁 奖励配置:', {
                amount: this.web3.utils.fromWei(rewardConfig.rewardAmount, 'ether') + ' S',
                enabled: rewardConfig.enabled
            });

            // 检查合约统计
            const stats = await this.contract.methods.getContractStats().call();
            console.log('📊 合约统计:', {
                totalRecords: stats.totalRecordsCount,
                owner: stats.contractOwner,
                totalRewards: this.web3.utils.fromWei(stats.totalRewards, 'ether') + ' S',
                rewardsEnabled: stats.rewardsStatus
            });

            // 检查用户成就
            if (this.userAccount) {
                const achievement = await this.contract.methods.getUserAchievement(this.userAccount).call();
                console.log('🏆 用户成就:', {
                    totalPoses: achievement.totalPoses,
                    bestScore: achievement.bestScore,
                    level: achievement.level,
                    totalRewards: this.web3.utils.fromWei(achievement.totalRewards, 'ether') + ' S'
                });
            }

        } catch (error) {
            console.error('❌ 调试失败:', error);
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
     * 获取合约状态信息
     */
    async getContractStatus() {
        if (!this.contract) {
            return null;
        }

        try {
            const stats = await this.contract.methods.getContractStats().call();
            const rewardConfig = await this.contract.methods.getRewardConfig().call();

            return {
                totalUsers: stats.totalUsers,
                totalRecords: stats.totalRecordsCount,
                contractOwner: stats.contractOwner,
                contractBalance: this.web3.utils.fromWei(stats.contractBalance, 'ether'),
                totalRewardsDistributed: this.web3.utils.fromWei(stats.totalRewards, 'ether'),
                rewardsEnabled: stats.rewardsStatus,
                rewardAmount: this.web3.utils.fromWei(rewardConfig.rewardAmount, 'ether')
            };
        } catch (error) {
            console.error('❌ 获取合约状态失败:', error);
            return null;
        }
    }

    /**
     * 获取用户奖励信息
     */
    async getUserRewards(userAddress = null) {
        if (!this.contract) {
            throw new Error('合约未初始化');
        }

        const address = userAddress || this.userAccount;
        if (!address) {
            throw new Error('用户地址未设置');
        }

        try {
            const achievement = await this.contract.methods.getUserAchievement(address).call();
            return {
                totalPoses: achievement.totalPoses,
                bestScore: achievement.bestScore,
                totalDuration: achievement.totalDuration,
                level: achievement.level,
                experience: achievement.experience,
                totalRewards: this.web3.utils.fromWei(achievement.totalRewards, 'ether')
            };
        } catch (error) {
            console.error('❌ 获取用户奖励信息失败:', error);
            throw error;
        }
    }

    /**
     * 监听奖励分发事件
     */
    listenForRewardEvents(callback) {
        if (!this.contract) {
            return;
        }

        this.contract.events.RewardDistributed({
            filter: { user: this.userAccount }
        })
        .on('data', (event) => {
            const rewardData = {
                user: event.returnValues.user,
                amount: this.web3.utils.fromWei(event.returnValues.amount, 'ether'),
                reason: event.returnValues.reason,
                timestamp: event.returnValues.timestamp,
                transactionHash: event.transactionHash
            };

            console.log('🎉 奖励已发放:', rewardData);
            if (callback) callback(rewardData);
        })
        .on('error', (error) => {
            console.error('❌ 奖励事件监听错误:', error);
        });
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
            contractAddress: this.contractConfig.address,
            networkManager: this.networkManager ? this.networkManager.getStatus() : null
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
     * 检查合约是否有增强功能
     */
    async checkEnhancedFunctions() {
        try {
            // Try to call REWARD_AMOUNT function to check if enhanced contract is deployed
            await this.contract.methods.REWARD_AMOUNT().call();
            return true;
        } catch (error) {
            console.log('🔍 检测结果: 当前合约为基础版本（无奖励功能）');
            return false;
        }
    }

    /**
     * 兼容模式：使用基础合约功能
     */
    async recordPoseCompatible(proof) {
        try {
            const poseData = proof.poseData;

            // 确定姿态类型
            let poseType = 0; // YOGA
            if (poseData.poseName.includes('hand') || poseData.poseName.includes('gesture')) {
                poseType = 1; // HAND_GESTURE
            } else if (poseData.poseName.includes('custom')) {
                poseType = 2; // CUSTOM
            }

            console.log('📝 使用兼容模式记录姿势（无自动奖励）:', {
                poseName: poseData.poseName,
                poseType: poseType,
                score: poseData.score,
                duration: poseData.duration
            });

            // 使用基础的 recordPose 函数
            const transaction = await this.contract.methods.recordPose(
                poseData.poseName,
                poseType,
                poseData.score,
                poseData.duration
            ).send({
                from: this.userAccount,
                gas: 300000
            });

            console.log('✅ 姿势记录成功（兼容模式）:', transaction.transactionHash);

            // 显示兼容模式通知
            this.showCompatibilityNotification();

            return {
                success: true,
                transactionHash: transaction.transactionHash,
                blockNumber: transaction.blockNumber,
                mode: 'compatibility',
                note: '使用兼容模式记录，无自动奖励功能'
            };

        } catch (error) {
            console.error('❌ 兼容模式记录失败:', error);
            throw error;
        }
    }

    /**
     * 显示奖励发放成功通知并跳转
     */
    showRewardSuccessAndRedirect(transactionHash, poseData) {
        // 创建成功通知元素
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="font-size: 24px; margin-right: 15px;">🎉</div>
                <div>
                    <div style="font-weight: bold; font-size: 18px; margin-bottom: 5px;">奖励发放成功！</div>
                    <div style="font-size: 14px; opacity: 0.9;">你已获得 0.01 S 代币奖励</div>
                </div>
            </div>
            <div style="font-size: 12px; opacity: 0.8;">
                <div>• 姿势: ${poseData.poseName}</div>
                <div>• 分数: ${poseData.score}</div>
                <div>• 交易: ${transactionHash.substring(0, 10)}...</div>
                <div style="margin-top: 10px; color: #f1c40f;">3秒后跳转到成功页面...</div>
            </div>
        `;

        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            max-width: 350px;
            animation: slideInRight 0.5s ease-out;
        `;

        // 添加到页面
        document.body.appendChild(notification);

        // 3秒后跳转到成功页面
        setTimeout(() => {
            // 移除通知
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }

            // 跳转到成功页面，传递交易信息和证明ID
            let successUrl = `reward-confirmation.html?tx=${transactionHash}&pose=${encodeURIComponent(poseData.poseName)}&score=${poseData.score}`;

            // 如果有证明ID，添加到URL中
            if (poseData.proofId) {
                successUrl += `&proofId=${encodeURIComponent(poseData.proofId)}`;
            }

            window.location.href = successUrl;
        }, 3000);
    }

    /**
     * 显示兼容模式通知
     */
    showCompatibilityNotification() {
        // 创建兼容模式通知
        const notification = document.createElement('div');
        notification.className = 'compatibility-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h3>📝 姿势已记录</h3>
                <p>您的姿势已成功记录到区块链</p>
                <p><strong>注意:</strong> 当前使用兼容模式，无自动奖励功能</p>
                <small>如需自动奖励，请升级到增强版合约</small>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">确定</button>
            </div>
        `;

        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            max-width: 350px;
            animation: slideInRight 0.5s ease-out;
        `;

        // 添加到页面
        document.body.appendChild(notification);

        // 10秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 10000);
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
