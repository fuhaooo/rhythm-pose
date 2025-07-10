// macOS风格视觉反馈系统
class VisualFeedbackSystem {
    constructor() {
        this.container = null;
        this.activeAnimations = new Set();
        this.gestureEmojis = {
            'thumbs-up': '👍',
            'peace': '✌️',
            'heart-sign': '💖',
            'ok-sign': '👌',
            'wave': '👋',
            'fist': '✊',
            'open-palm': '🖐️',
            'rock-sign': '🤘',
            'pray-sign': '🙏',
            'high-five': '🙌',
            'spider-sign': '🕷️',
            'call-me': '🤙',
            'gun-sign': '👉',
            'pointing': '☝️',
            'rock-on': '🤘',
            'three-fingers': '🤟',
            'four-fingers': '🖖'
        };
        
        this.poseEmojis = {
            'tree': '🌳',
            'warrior': '⚔️',
            'plank': '💪',
            'squat': '🏋️',
            'jumping-jacks': '🤸',
            'cat': '🐱',
            'cobra': '🐍',
            'pigeon': '🕊️',
            'sidePlank': '💪',
            'bow': '🏹',
            'eagle': '🦅',
            'dancer': '💃'
        };
        
        this.achievementSounds = {
            perfect: '✨',
            good: '⭐',
            combo: '🔥',
            levelUp: '🎉'
        };
        
        this.init();
    }

    // 初始化反馈系统
    init() {
        this.createContainer();
        this.addStyles();
    }

    // 创建反馈容器
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'visual-feedback-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        `;
        document.body.appendChild(this.container);
    }

    // 添加样式
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .feedback-bubble {
                position: absolute;
                font-size: 48px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                animation: bubbleFloat 2s ease-out forwards;
                pointer-events: none;
                z-index: 10000;
            }

            .feedback-text {
                position: absolute;
                font-size: 24px;
                font-weight: bold;
                color: white;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                background: rgba(0,0,0,0.6);
                padding: 8px 16px;
                border-radius: 20px;
                animation: textSlideIn 1.5s ease-out forwards;
                pointer-events: none;
                z-index: 10000;
            }

            .achievement-banner {
                position: absolute;
                top: 20%;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px 40px;
                border-radius: 15px;
                font-size: 28px;
                font-weight: bold;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                animation: achievementPop 3s ease-out forwards;
                pointer-events: none;
                z-index: 10001;
            }

            .particle-effect {
                position: absolute;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                animation: particleFloat 2s ease-out forwards;
                pointer-events: none;
            }

            .combo-indicator {
                position: absolute;
                top: 15%;
                right: 5%;
                font-size: 36px;
                font-weight: bold;
                color: #ff6b6b;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                animation: comboGlow 1s ease-in-out infinite alternate;
                pointer-events: none;
                z-index: 10000;
            }

            @keyframes bubbleFloat {
                0% {
                    opacity: 1;
                    transform: translateY(0) scale(0.5);
                }
                50% {
                    opacity: 1;
                    transform: translateY(-100px) scale(1.2);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-200px) scale(0.8);
                }
            }

            @keyframes textSlideIn {
                0% {
                    opacity: 0;
                    transform: translateX(-50px) scale(0.8);
                }
                20% {
                    opacity: 1;
                    transform: translateX(0) scale(1.1);
                }
                80% {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translateX(50px) scale(0.9);
                }
            }

            @keyframes achievementPop {
                0% {
                    opacity: 0;
                    transform: translateX(-50%) scale(0.3);
                }
                20% {
                    opacity: 1;
                    transform: translateX(-50%) scale(1.1);
                }
                80% {
                    opacity: 1;
                    transform: translateX(-50%) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translateX(-50%) scale(0.8);
                }
            }

            @keyframes particleFloat {
                0% {
                    opacity: 1;
                    transform: translateY(0) rotate(0deg);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-150px) rotate(360deg);
                }
            }

            @keyframes comboGlow {
                0% {
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                    transform: scale(1);
                }
                100% {
                    text-shadow: 0 0 20px #ff6b6b, 2px 2px 4px rgba(0,0,0,0.5);
                    transform: scale(1.1);
                }
            }

            .level-up-effect {
                position: absolute;
                top: 30%;
                left: 50%;
                transform: translateX(-50%);
                font-size: 48px;
                font-weight: bold;
                background: linear-gradient(45deg, #ffd700, #ffed4e);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                animation: levelUpShine 2s ease-out forwards;
                pointer-events: none;
                z-index: 10001;
            }

            @keyframes levelUpShine {
                0% {
                    opacity: 0;
                    transform: translateX(-50%) scale(0.5);
                }
                50% {
                    opacity: 1;
                    transform: translateX(-50%) scale(1.2);
                }
                100% {
                    opacity: 0;
                    transform: translateX(-50%) scale(1);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 显示手势反馈
    showGestureFeedback(gestureName, confidence, position = null) {
        const emoji = this.gestureEmojis[gestureName];
        if (!emoji) return;

        // 创建emoji气泡
        this.createBubble(emoji, position);
        
        // 如果置信度很高，添加额外效果
        if (confidence > 0.9) {
            this.createParticleEffect(position, '#ffd700');
        }
    }

    // 显示姿势反馈
    showPoseFeedback(poseName, accuracy, position = null) {
        const emoji = this.poseEmojis[poseName];
        if (!emoji) return;

        this.createBubble(emoji, position);
        
        if (accuracy > 85) {
            this.createParticleEffect(position, '#4ecdc4');
        }
    }

    // 创建气泡效果
    createBubble(content, position = null) {
        const bubble = document.createElement('div');
        bubble.className = 'feedback-bubble';
        bubble.textContent = content;
        
        // 设置位置
        if (position) {
            bubble.style.left = position.x + 'px';
            bubble.style.top = position.y + 'px';
        } else {
            bubble.style.left = Math.random() * (window.innerWidth - 100) + 'px';
            bubble.style.top = Math.random() * (window.innerHeight - 100) + 'px';
        }
        
        this.container.appendChild(bubble);
        this.activeAnimations.add(bubble);
        
        // 2秒后移除
        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.parentNode.removeChild(bubble);
            }
            this.activeAnimations.delete(bubble);
        }, 2000);
    }

    // 创建粒子效果
    createParticleEffect(position, color) {
        const particleCount = 8;
        const centerX = position ? position.x : window.innerWidth / 2;
        const centerY = position ? position.y : window.innerHeight / 2;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle-effect';
            particle.style.backgroundColor = color;
            particle.style.left = centerX + (Math.random() - 0.5) * 100 + 'px';
            particle.style.top = centerY + (Math.random() - 0.5) * 100 + 'px';
            
            this.container.appendChild(particle);
            this.activeAnimations.add(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
                this.activeAnimations.delete(particle);
            }, 2000);
        }
    }

    // 显示成就横幅
    showAchievement(achievement) {
        const banner = document.createElement('div');
        banner.className = 'achievement-banner';
        banner.innerHTML = `
            <div style="font-size: 36px; margin-bottom: 10px;">${achievement.icon}</div>
            <div>${achievement.name}</div>
            <div style="font-size: 18px; opacity: 0.9; margin-top: 5px;">${achievement.description}</div>
        `;
        
        this.container.appendChild(banner);
        this.activeAnimations.add(banner);
        
        setTimeout(() => {
            if (banner.parentNode) {
                banner.parentNode.removeChild(banner);
            }
            this.activeAnimations.delete(banner);
        }, 3000);
    }

    // 显示连击指示器
    showComboIndicator(combo) {
        // 移除现有的连击指示器
        const existing = this.container.querySelector('.combo-indicator');
        if (existing) {
            existing.remove();
        }
        
        if (combo < 5) return; // 只在连击5次以上时显示
        
        const indicator = document.createElement('div');
        indicator.className = 'combo-indicator';
        indicator.textContent = `🔥 ${combo} COMBO!`;
        
        this.container.appendChild(indicator);
        this.activeAnimations.add(indicator);
        
        // 5秒后移除
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
            this.activeAnimations.delete(indicator);
        }, 5000);
    }

    // 显示等级提升效果
    showLevelUp(level) {
        const levelUpEffect = document.createElement('div');
        levelUpEffect.className = 'level-up-effect';
        levelUpEffect.innerHTML = `🎉 LEVEL ${level}! 🎉`;
        
        this.container.appendChild(levelUpEffect);
        this.activeAnimations.add(levelUpEffect);
        
        setTimeout(() => {
            if (levelUpEffect.parentNode) {
                levelUpEffect.parentNode.removeChild(levelUpEffect);
            }
            this.activeAnimations.delete(levelUpEffect);
        }, 2000);
    }

    // 清理所有动画
    clearAll() {
        this.activeAnimations.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.activeAnimations.clear();
    }

    // 销毁反馈系统
    destroy() {
        this.clearAll();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// 导出类
window.VisualFeedbackSystem = VisualFeedbackSystem;
