/**
 * zkTLS Debug Monitor
 * 实时监控和显示证明生成条件
 */

class ZKTLSDebugMonitor {
    constructor(scoringSystem, zkTLSScoringIntegration) {
        this.scoringSystem = scoringSystem;
        this.zkTLSScoringIntegration = zkTLSScoringIntegration;
        this.config = window.ZKTLSConfig;
        this.isVisible = false;
        this.updateInterval = null;
        
        this.createDebugUI();
        this.setupEventListeners();
        
        console.log('🔍 zkTLS Debug Monitor 初始化');
    }

    createDebugUI() {
        // 创建调试面板
        const debugPanel = document.createElement('div');
        debugPanel.id = 'zktls-debug-panel';
        debugPanel.innerHTML = `
            <div class="debug-header">
                <h4>🔍 zkTLS 证明条件监控</h4>
                <button id="toggle-debug" class="debug-toggle">隐藏</button>
            </div>
            <div class="debug-content">
                <div class="requirements-section">
                    <h5>📋 要求条件</h5>
                    <div class="requirement-item">
                        <span class="label">最低分数:</span>
                        <span id="req-score" class="value">${this.config.conditions.minScore}</span>
                    </div>
                    <div class="requirement-item">
                        <span class="label">最低持续时间:</span>
                        <span id="req-duration" class="value">${this.config.conditions.minDuration}秒</span>
                    </div>
                    <div class="requirement-item">
                        <span class="label">最低准确度:</span>
                        <span id="req-accuracy" class="value">${this.config.conditions.minAccuracy}%</span>
                    </div>
                </div>

                <div class="current-section">
                    <h5>📊 当前数值</h5>
                    <div class="current-item">
                        <span class="label">当前分数:</span>
                        <span id="current-score" class="value">0</span>
                        <span id="score-status" class="status">❌</span>
                    </div>
                    <div class="current-item">
                        <span class="label">持续时间:</span>
                        <span id="current-duration" class="value">0秒</span>
                        <span id="duration-status" class="status">❌</span>
                    </div>
                    <div class="current-item">
                        <span class="label">准确度:</span>
                        <span id="current-accuracy" class="value">0%</span>
                        <span id="accuracy-status" class="status">❌</span>
                    </div>
                </div>

                <div class="detailed-section">
                    <h5>🔬 详细信息</h5>
                    <div class="detail-item">
                        <span class="label">准确度分数:</span>
                        <span id="accuracy-score" class="value">0</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">稳定性分数:</span>
                        <span id="stability-score" class="value">0</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">持续时间分数:</span>
                        <span id="duration-score" class="value">0</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">实际持续时间:</span>
                        <span id="hold-time" class="value">0秒</span>
                    </div>
                </div>

                <div class="proof-section">
                    <h5>🎯 证明状态</h5>
                    <div class="proof-status">
                        <span id="proof-eligible" class="proof-indicator">❌ 不满足条件</span>
                    </div>
                    <div class="proof-actions">
                        <button id="test-proof-conditions" class="debug-btn">测试证明条件</button>
                        <button id="adjust-thresholds" class="debug-btn">调整阈值</button>
                    </div>
                </div>

                <div class="tips-section">
                    <h5>💡 提示</h5>
                    <div id="debug-tips" class="tips-content">
                        <p>开始检测姿态以查看实时数据...</p>
                    </div>
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            #zktls-debug-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 350px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                border-radius: 10px;
                padding: 15px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                z-index: 10000;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .debug-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                border-bottom: 1px solid #444;
                padding-bottom: 10px;
            }
            
            .debug-header h4 {
                margin: 0;
                color: #8A2BE2;
            }
            
            .debug-toggle {
                background: #8A2BE2;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 10px;
            }
            
            .requirements-section, .current-section, .detailed-section, .proof-section, .tips-section {
                margin-bottom: 15px;
                padding: 10px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 5px;
            }
            
            .requirements-section h5, .current-section h5, .detailed-section h5, .proof-section h5, .tips-section h5 {
                margin: 0 0 10px 0;
                color: #4CAF50;
            }
            
            .requirement-item, .current-item, .detail-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;
            }
            
            .label {
                color: #ccc;
            }
            
            .value {
                color: #fff;
                font-weight: bold;
            }
            
            .status {
                font-size: 14px;
                margin-left: 10px;
            }
            
            .proof-indicator {
                display: block;
                text-align: center;
                padding: 10px;
                border-radius: 5px;
                background: rgba(255, 0, 0, 0.2);
                color: #ff6b6b;
                font-weight: bold;
            }
            
            .proof-indicator.eligible {
                background: rgba(0, 255, 0, 0.2);
                color: #51cf66;
            }
            
            .proof-actions {
                display: flex;
                gap: 10px;
                margin-top: 10px;
            }
            
            .debug-btn {
                flex: 1;
                background: #007bff;
                color: white;
                border: none;
                padding: 8px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 10px;
            }
            
            .debug-btn:hover {
                background: #0056b3;
            }
            
            .tips-content {
                font-size: 11px;
                line-height: 1.4;
                color: #ffd43b;
            }
            
            .hidden {
                display: none;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(debugPanel);
    }

    setupEventListeners() {
        // 切换显示/隐藏
        document.getElementById('toggle-debug').addEventListener('click', () => {
            this.toggleVisibility();
        });

        // 测试证明条件
        document.getElementById('test-proof-conditions').addEventListener('click', () => {
            this.testProofConditions();
        });

        // 调整阈值
        document.getElementById('adjust-thresholds').addEventListener('click', () => {
            this.showThresholdAdjustment();
        });
    }

    startMonitoring() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            this.updateDisplay();
        }, 100); // 每100ms更新一次

        console.log('🔍 开始监控证明条件');
    }

    stopMonitoring() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('🔍 停止监控证明条件');
    }

    updateDisplay() {
        if (!this.scoringSystem) return;

        const scoreData = this.scoringSystem.getScoreData();
        const requirements = this.config.conditions;

        // 更新当前数值
        document.getElementById('current-score').textContent = scoreData.currentScore;
        document.getElementById('current-duration').textContent = `${scoreData.holdTime?.toFixed(1) || 0}秒`;
        document.getElementById('current-accuracy').textContent = `${scoreData.accuracy}%`;

        // 更新详细信息
        document.getElementById('accuracy-score').textContent = scoreData.accuracy;
        document.getElementById('stability-score').textContent = scoreData.stability;
        document.getElementById('duration-score').textContent = scoreData.duration;
        document.getElementById('hold-time').textContent = `${scoreData.holdTime?.toFixed(1) || 0}秒`;

        // 更新状态指示器
        const scoreOK = scoreData.currentScore >= requirements.minScore;
        const durationOK = (scoreData.holdTime || 0) >= requirements.minDuration;
        const accuracyOK = scoreData.accuracy >= requirements.minAccuracy;

        document.getElementById('score-status').textContent = scoreOK ? '✅' : '❌';
        document.getElementById('duration-status').textContent = durationOK ? '✅' : '❌';
        document.getElementById('accuracy-status').textContent = accuracyOK ? '✅' : '❌';

        // 更新证明状态
        const allConditionsMet = scoreOK && durationOK && accuracyOK;
        const proofIndicator = document.getElementById('proof-eligible');
        
        if (allConditionsMet) {
            proofIndicator.textContent = '✅ 满足证明条件';
            proofIndicator.className = 'proof-indicator eligible';
        } else {
            const failedConditions = [];
            if (!scoreOK) failedConditions.push('分数');
            if (!durationOK) failedConditions.push('持续时间');
            if (!accuracyOK) failedConditions.push('准确度');
            
            proofIndicator.textContent = `❌ 缺少: ${failedConditions.join(', ')}`;
            proofIndicator.className = 'proof-indicator';
        }

        // 更新提示
        this.updateTips(scoreData, requirements, { scoreOK, durationOK, accuracyOK });
    }

    updateTips(scoreData, requirements, status) {
        const tipsElement = document.getElementById('debug-tips');
        const tips = [];

        if (!status.scoreOK) {
            const needed = requirements.minScore - scoreData.currentScore;
            tips.push(`🎯 需要提高 ${needed.toFixed(1)} 分才能达到最低分数要求`);
        }

        if (!status.durationOK) {
            const needed = requirements.minDuration - (scoreData.holdTime || 0);
            tips.push(`⏱️ 需要再保持 ${needed.toFixed(1)} 秒才能满足持续时间要求`);
        }

        if (!status.accuracyOK) {
            const needed = requirements.minAccuracy - scoreData.accuracy;
            tips.push(`🎯 需要提高 ${needed.toFixed(1)}% 准确度才能满足要求`);
        }

        if (tips.length === 0) {
            tips.push('🎉 所有条件都已满足！可以生成证明了！');
        }

        // 添加实用建议
        if (scoreData.accuracy < 70) {
            tips.push('💡 建议：调整姿势以提高准确度，确保关键点位置正确');
        }

        if ((scoreData.holdTime || 0) < 2) {
            tips.push('💡 建议：保持姿势稳定，避免频繁移动');
        }

        tipsElement.innerHTML = tips.map(tip => `<p>${tip}</p>`).join('');
    }

    testProofConditions() {
        if (!this.zkTLSScoringIntegration) {
            alert('zkTLS评分集成未初始化');
            return;
        }

        const scoreData = this.scoringSystem.getScoreData();
        const canGenerate = this.zkTLSScoringIntegration.canGenerateProof(scoreData);

        const result = {
            canGenerate: canGenerate.canGenerate,
            reason: canGenerate.reason || '满足所有条件',
            current: {
                score: scoreData.currentScore,
                duration: scoreData.holdTime || 0,
                accuracy: scoreData.accuracy
            },
            requirements: this.config.conditions
        };

        console.log('🧪 证明条件测试结果:', result);
        alert(`测试结果:\n${canGenerate.canGenerate ? '✅ 可以生成证明' : '❌ ' + canGenerate.reason}\n\n详细信息请查看控制台`);
    }

    showThresholdAdjustment() {
        const newMinScore = prompt('设置最低分数要求 (当前: ' + this.config.conditions.minScore + ')', this.config.conditions.minScore);
        const newMinDuration = prompt('设置最低持续时间要求 (秒, 当前: ' + this.config.conditions.minDuration + ')', this.config.conditions.minDuration);
        const newMinAccuracy = prompt('设置最低准确度要求 (当前: ' + this.config.conditions.minAccuracy + ')', this.config.conditions.minAccuracy);

        if (newMinScore !== null) this.config.conditions.minScore = parseFloat(newMinScore);
        if (newMinDuration !== null) this.config.conditions.minDuration = parseFloat(newMinDuration);
        if (newMinAccuracy !== null) this.config.conditions.minAccuracy = parseFloat(newMinAccuracy);

        // 更新显示
        document.getElementById('req-score').textContent = this.config.conditions.minScore;
        document.getElementById('req-duration').textContent = this.config.conditions.minDuration + '秒';
        document.getElementById('req-accuracy').textContent = this.config.conditions.minAccuracy + '%';

        console.log('🔧 阈值已调整:', this.config.conditions);
        alert('阈值已更新！新设置将立即生效。');
    }

    toggleVisibility() {
        const panel = document.getElementById('zktls-debug-panel');
        const content = panel.querySelector('.debug-content');
        const toggle = document.getElementById('toggle-debug');

        if (this.isVisible) {
            content.classList.add('hidden');
            toggle.textContent = '显示';
            this.isVisible = false;
        } else {
            content.classList.remove('hidden');
            toggle.textContent = '隐藏';
            this.isVisible = true;
        }
    }

    show() {
        document.getElementById('zktls-debug-panel').style.display = 'block';
        this.isVisible = true;
    }

    hide() {
        document.getElementById('zktls-debug-panel').style.display = 'none';
        this.isVisible = false;
    }

    destroy() {
        this.stopMonitoring();
        const panel = document.getElementById('zktls-debug-panel');
        if (panel) {
            panel.remove();
        }
    }
}

// 导出类
window.ZKTLSDebugMonitor = ZKTLSDebugMonitor;
