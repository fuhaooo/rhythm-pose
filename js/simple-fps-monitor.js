// 简化的FPS监控器
class SimpleFPSMonitor {
    constructor() {
        this.frameCount = 0;
        this.startTime = performance.now();
        this.lastTime = this.startTime;
        this.fps = 0;
        this.isEnabled = false;
        
        // 性能指标
        this.detectionTimes = [];
        this.scoringTimes = [];
        this.renderTimes = [];
        this.maxSamples = 30;
    }

    enable() {
        this.isEnabled = true;
        this.reset();
        console.log('📊 简化FPS监控已启用');
    }

    disable() {
        this.isEnabled = false;
        console.log('📊 简化FPS监控已禁用');
    }

    reset() {
        this.frameCount = 0;
        this.startTime = performance.now();
        this.lastTime = this.startTime;
        this.fps = 0;
        this.detectionTimes = [];
        this.scoringTimes = [];
        this.renderTimes = [];
    }

    // 记录一帧
    recordFrame() {
        if (!this.isEnabled) return;
        
        const now = performance.now();
        this.frameCount++;
        
        // 每秒计算一次FPS
        const elapsed = now - this.startTime;
        if (elapsed >= 1000) {
            this.fps = (this.frameCount * 1000) / elapsed;
            
            // 每3秒输出一次报告
            if (this.frameCount % 90 === 0) { // 假设30FPS，3秒=90帧
                this.generateReport();
            }
            
            // 重置计数器
            this.frameCount = 0;
            this.startTime = now;
        }
        
        this.lastTime = now;
    }

    // 记录检测时间
    recordDetectionTime(time) {
        if (!this.isEnabled) return;
        this.detectionTimes.push(time);
        if (this.detectionTimes.length > this.maxSamples) {
            this.detectionTimes.shift();
        }
    }

    // 记录评分时间
    recordScoringTime(time) {
        if (!this.isEnabled) return;
        this.scoringTimes.push(time);
        if (this.scoringTimes.length > this.maxSamples) {
            this.scoringTimes.shift();
        }
    }

    // 记录渲染时间
    recordRenderTime(time) {
        if (!this.isEnabled) return;
        this.renderTimes.push(time);
        if (this.renderTimes.length > this.maxSamples) {
            this.renderTimes.shift();
        }
    }

    // 计算平均值
    getAverage(array) {
        if (array.length === 0) return 0;
        const sum = array.reduce((a, b) => a + b, 0);
        return sum / array.length;
    }

    // 生成报告
    generateReport() {
        if (!this.isEnabled) return;

        const avgDetection = this.getAverage(this.detectionTimes);
        const avgScoring = this.getAverage(this.scoringTimes);
        const avgRender = this.getAverage(this.renderTimes);

        console.group('📊 性能监控报告');
        console.log(`实际FPS: ${this.fps.toFixed(1)}`);
        console.log(`平均检测时间: ${avgDetection.toFixed(2)}ms`);
        console.log(`平均评分时间: ${avgScoring.toFixed(2)}ms`);
        console.log(`平均渲染时间: ${avgRender.toFixed(2)}ms`);
        
        // 性能警告
        if (this.fps < 20) {
            console.warn('⚠️ FPS过低，可能影响用户体验');
        }
        if (avgDetection > 30) {
            console.warn('⚠️ 检测时间过长，考虑优化AI模型');
        }
        if (avgScoring > 15) {
            console.warn('⚠️ 评分时间过长，考虑优化算法');
        }
        if (avgRender > 10) {
            console.warn('⚠️ 渲染时间过长，考虑优化绘制逻辑');
        }
        
        console.groupEnd();
    }

    // 获取当前FPS
    getCurrentFPS() {
        return this.fps;
    }
}

// 创建全局实例
window.simpleFPSMonitor = new SimpleFPSMonitor();

// 导出类
window.SimpleFPSMonitor = SimpleFPSMonitor;
