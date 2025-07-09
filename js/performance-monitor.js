// 性能监控工具
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            detectionTime: [],
            scoringTime: [],
            renderTime: [],
            totalFrameTime: []
        };
        this.maxSamples = 60; // 保存最近60帧的数据
        this.isEnabled = false;
        this.startTime = 0;
        this.frameCount = 0;
        this.lastReportTime = 0;

        // FPS计算相关
        this.fpsFrameCount = 0;
        this.fpsStartTime = 0;
        this.currentFPS = 0;
    }

    // 启用性能监控
    enable() {
        this.isEnabled = true;
        this.lastReportTime = performance.now();
        console.log('🔍 性能监控已启用');
    }

    // 禁用性能监控
    disable() {
        this.isEnabled = false;
        console.log('🔍 性能监控已禁用');
    }

    // 开始计时
    startTiming(label) {
        if (!this.isEnabled) return null;
        return {
            label: label,
            startTime: performance.now()
        };
    }

    // 结束计时并记录
    endTiming(timer) {
        if (!this.isEnabled || !timer) return;
        
        const endTime = performance.now();
        const duration = endTime - timer.startTime;
        
        // 记录到对应的指标数组
        if (this.metrics[timer.label]) {
            this.metrics[timer.label].push(duration);
            
            // 保持数组大小
            if (this.metrics[timer.label].length > this.maxSamples) {
                this.metrics[timer.label].shift();
            }
        }
    }

    // 记录帧开始
    frameStart() {
        if (!this.isEnabled) return null;
        this.startTime = performance.now();
        this.frameCount++;
        return this.startTime;
    }

    // 记录帧结束
    frameEnd() {
        if (!this.isEnabled || !this.startTime) return;

        const now = performance.now();
        const frameTime = now - this.startTime;
        this.metrics.totalFrameTime.push(frameTime);

        if (this.metrics.totalFrameTime.length > this.maxSamples) {
            this.metrics.totalFrameTime.shift();
        }

        // 计算实际FPS
        this.fpsFrameCount++;
        if (this.fpsStartTime === 0) {
            this.fpsStartTime = now;
        }

        // 每秒更新一次FPS
        const fpsElapsed = now - this.fpsStartTime;
        if (fpsElapsed >= 1000) {
            this.currentFPS = (this.fpsFrameCount * 1000) / fpsElapsed;
            this.fpsFrameCount = 0;
            this.fpsStartTime = now;
        }

        // 每3秒输出一次性能报告，减少频率
        if (now - this.lastReportTime >= 3000) {
            this.generateReport();
            this.lastReportTime = now;
        }
    }

    // 生成性能报告
    generateReport() {
        if (!this.isEnabled) return;

        const report = {
            frameCount: this.frameCount,
            averageFrameTime: this.getAverage('totalFrameTime'),
            averageDetectionTime: this.getAverage('detectionTime'),
            averageScoringTime: this.getAverage('scoringTime'),
            averageRenderTime: this.getAverage('renderTime'),
            fps: this.calculateFPS()
        };

        console.group('📊 性能报告');
        console.log(`总帧数: ${report.frameCount}`);
        console.log(`平均帧时间: ${report.averageFrameTime.toFixed(2)}ms`);
        console.log(`平均检测时间: ${report.averageDetectionTime.toFixed(2)}ms`);
        console.log(`平均评分时间: ${report.averageScoringTime.toFixed(2)}ms`);
        console.log(`平均渲染时间: ${report.averageRenderTime.toFixed(2)}ms`);
        console.log(`实际FPS: ${report.fps.toFixed(1)}`);
        
        // 性能警告
        if (report.averageFrameTime > 33.33) {
            console.warn('⚠️ 帧时间过长，可能影响流畅度');
        }
        if (report.averageScoringTime > 10) {
            console.warn('⚠️ 评分计算时间过长');
        }
        if (report.fps < 20) {
            console.warn('⚠️ FPS过低，建议优化');
        }
        
        console.groupEnd();

        return report;
    }

    // 计算平均值
    getAverage(metricName) {
        const data = this.metrics[metricName];
        if (!data || data.length === 0) return 0;
        
        const sum = data.reduce((a, b) => a + b, 0);
        return sum / data.length;
    }

    // 计算FPS（使用实际计数方法）
    calculateFPS() {
        return Math.round(this.currentFPS * 10) / 10; // 保留一位小数
    }

    // 获取性能建议
    getPerformanceAdvice() {
        const report = this.generateReport();
        const advice = [];

        if (report.averageFrameTime > 33.33) {
            advice.push('考虑降低检测频率或减少计算复杂度');
        }
        
        if (report.averageScoringTime > 10) {
            advice.push('优化评分算法，减少不必要的计算');
        }
        
        if (report.averageDetectionTime > 20) {
            advice.push('考虑使用更轻量的AI模型或降低输入分辨率');
        }
        
        if (report.averageRenderTime > 10) {
            advice.push('优化渲染逻辑，减少绘制操作');
        }

        return advice;
    }

    // 重置统计数据
    reset() {
        this.metrics = {
            detectionTime: [],
            scoringTime: [],
            renderTime: [],
            totalFrameTime: []
        };
        this.frameCount = 0;
        this.fpsFrameCount = 0;
        this.fpsStartTime = 0;
        this.currentFPS = 0;
        this.lastReportTime = performance.now();
        console.log('🔄 性能监控数据已重置');
    }

    // 导出性能数据
    exportData() {
        return {
            timestamp: new Date().toISOString(),
            frameCount: this.frameCount,
            metrics: { ...this.metrics },
            summary: {
                averageFrameTime: this.getAverage('totalFrameTime'),
                averageDetectionTime: this.getAverage('detectionTime'),
                averageScoringTime: this.getAverage('scoringTime'),
                averageRenderTime: this.getAverage('renderTime'),
                fps: this.calculateFPS()
            }
        };
    }
}

// 创建全局性能监控实例
window.performanceMonitor = new PerformanceMonitor();

// 导出类
window.PerformanceMonitor = PerformanceMonitor;
