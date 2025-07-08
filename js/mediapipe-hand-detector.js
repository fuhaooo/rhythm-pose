// MediaPipe 手部检测器类
class MediaPipeHandDetector {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.hands = null;
        this.camera = null;
        this.handResults = [];
        this.isDetecting = false;
        this.showSkeleton = true;
        
        // 回调函数
        this.onHandDetected = null;
        this.onModelReady = null;
        this.onError = null;
        
        // 调试标志
        this._firstHandDetection = false;
        this._handDrawLogged = false;
    }
    
    // 设置视频源
    setVideo(video) {
        this.video = video;
    }
    
    // 设置画布
    setCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    // 设置是否显示手部骨骼
    setShowSkeleton(show) {
        this.showSkeleton = show;
        console.log('MediaPipe手部骨骼显示设置为:', show);
    }
    
    // 初始化MediaPipe Hands
    async initHandDetection() {
        try {
            console.log('正在初始化MediaPipe手部检测...');

            // 检查MediaPipe是否可用
            if (typeof Hands === 'undefined') {
                console.warn('MediaPipe Hands库未加载，将跳过手部检测');
                return false;
            }

            // 添加超时机制
            const initPromise = this._initializeHands();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('MediaPipe初始化超时')), 10000);
            });

            await Promise.race([initPromise, timeoutPromise]);
            return true;

        } catch (error) {
            console.error('MediaPipe Hands初始化失败:', error);
            if (this.onError) {
                this.onError(error.message);
            }
            return false; // 不抛出错误，而是返回false
        }
    }

    // 实际的初始化方法
    async _initializeHands() {
        // 使用稳定版本的CDN路径
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 0, // 降低复杂度提高稳定性
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults((results) => {
            this.onResults(results);
        });

        console.log('MediaPipe Hands初始化完成');

        if (this.onModelReady) {
            this.onModelReady();
        }
    }
    
    // 开始检测
    async startDetection() {
        try {
            if (!this.video || !this.hands) {
                throw new Error('视频或Hands模型未初始化');
            }

            console.log('启动MediaPipe手部检测');

            // 不使用MediaPipe的Camera类，而是通过外部调用进行检测
            // 这样可以避免与pose-detector的绘制循环冲突
            this.isDetecting = true;

            // 启动检测循环
            this.startDetectionLoop();

            // 重置调试标志
            this._firstHandDetection = false;
            this._handDrawLogged = false;

            console.log('MediaPipe手部检测已启动（协调模式）');
            return true;

        } catch (error) {
            console.error('启动MediaPipe手部检测失败:', error);
            if (this.onError) {
                this.onError(error.message);
            }
            return false;
        }
    }

    // 启动检测循环（与pose-detector协调）
    startDetectionLoop() {
        const detectFrame = async () => {
            if (!this.isDetecting) return;

            if (this.video && this.video.readyState >= 2) {
                try {
                    await this.hands.send({image: this.video});
                } catch (error) {
                    console.error('MediaPipe手部检测帧处理失败:', error);
                }
            }

            // 使用较低的频率进行检测，避免性能问题
            setTimeout(() => {
                if (this.isDetecting) {
                    requestAnimationFrame(detectFrame);
                }
            }, 33); // 约30fps
        };

        detectFrame();
    }
    
    // 停止检测
    stopDetection() {
        this.isDetecting = false;

        // 不再需要停止camera，因为我们使用协调模式
        this.camera = null;

        this.handResults = [];
        console.log('MediaPipe手部检测已停止');
    }
    
    // 处理检测结果
    onResults(results) {
        this.handResults = results.multiHandLandmarks || [];
        
        // 调试信息（仅在首次检测时输出）
        if (this.handResults.length > 0 && !this._firstHandDetection) {
            console.log('首次检测到手部数据，手部数量:', this.handResults.length);
            console.log('手部数据结构:', this.handResults[0]);
            this._firstHandDetection = true;
        }
        
        // 调用回调函数
        if (this.onHandDetected && this.handResults.length > 0) {
            this.onHandDetected(this.handResults);
        }
    }
    
    // 绘制手部关键点
    drawHands() {
        if (!this.showSkeleton || !this.handResults || this.handResults.length === 0) {
            return;
        }

        // 首次绘制时输出调试信息
        if (!this._handDrawLogged) {
            console.log('开始绘制MediaPipe手部，手部数量:', this.handResults.length);
            this._handDrawLogged = true;
        }

        this.handResults.forEach(landmarks => {
            this.drawHand(landmarks);
        });
    }

    // 增强版手部绘制
    drawEnhancedHands() {
        if (!this.showSkeleton || !this.handResults || this.handResults.length === 0) {
            return;
        }

        // 首次绘制时输出调试信息
        if (!this._handDrawLogged) {
            console.log('开始绘制增强版MediaPipe手部，手部数量:', this.handResults.length);
            this._handDrawLogged = true;
        }

        this.handResults.forEach((landmarks) => {
            this.drawEnhancedHand(landmarks);
        });
    }
    
    // 绘制单个手部
    drawHand(landmarks) {
        if (!landmarks || !this.canvas) return;
        
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // 绘制关键点
        landmarks.forEach(landmark => {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.beginPath();
            this.ctx.arc(
                canvasWidth - landmark.x * canvasWidth,  // 镜像翻转
                landmark.y * canvasHeight,
                5, 0, 2 * Math.PI
            );
            this.ctx.fill();
        });
        
        // 绘制连接线
        this.drawHandConnections(landmarks);
    }
    
    // 绘制手部连接线
    drawHandConnections(landmarks) {
        const connections = [
            // 拇指
            [0, 1], [1, 2], [2, 3], [3, 4],
            // 食指
            [0, 5], [5, 6], [6, 7], [7, 8],
            // 中指
            [0, 9], [9, 10], [10, 11], [11, 12],
            // 无名指
            [0, 13], [13, 14], [14, 15], [15, 16],
            // 小指
            [0, 17], [17, 18], [18, 19], [19, 20]
        ];
        
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        connections.forEach(([startIdx, endIdx]) => {
            const startPoint = landmarks[startIdx];
            const endPoint = landmarks[endIdx];
            
            if (startPoint && endPoint) {
                this.ctx.beginPath();
                this.ctx.moveTo(
                    canvasWidth - startPoint.x * canvasWidth,  // 镜像翻转
                    startPoint.y * canvasHeight
                );
                this.ctx.lineTo(
                    canvasWidth - endPoint.x * canvasWidth,   // 镜像翻转
                    endPoint.y * canvasHeight
                );
                this.ctx.stroke();
            }
        });
    }
    
    // 清理资源
    cleanup() {
        this.stopDetection();
        
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.hands = null;
        this.handResults = [];
    }
    
    // 设置回调函数
    setHandCallback(callback) {
        this.onHandDetected = callback;
    }
    
    setModelReadyCallback(callback) {
        this.onModelReady = callback;
    }
    
    setErrorCallback(callback) {
        this.onError = callback;
    }

    // 单个手部绘制
    drawEnhancedHand(landmarks) {
        if (!landmarks || !this.canvas) return;

        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        // 绘制连接线（包含骨架结构）
        this.drawEnhancedHandConnections(landmarks);

        // 绘制简洁的关键点
        landmarks.forEach((landmark) => {
            // 绘制关键点
            this.ctx.fillStyle = '#00ff00';
            this.ctx.beginPath();
            this.ctx.arc(
                canvasWidth - landmark.x * canvasWidth,  // 镜像翻转
                landmark.y * canvasHeight,
                3, 0, 2 * Math.PI
            );
            this.ctx.fill();
        });
    }

    // 手部连接线绘制（正确的骨架结构）
    drawEnhancedHandConnections(landmarks) {
        const connections = [
            // 手腕到手掌基部的连接
            [0, 1], [0, 5], [0, 9], [0, 13], [0, 17],

            // 拇指骨架
            [1, 2], [2, 3], [3, 4],

            // 食指骨架
            [5, 6], [6, 7], [7, 8],

            // 中指骨架
            [9, 10], [10, 11], [11, 12],

            // 无名指骨架
            [13, 14], [14, 15], [15, 16],

            // 小指骨架
            [17, 18], [18, 19], [19, 20],

            // 手掌横向连接线
            [5, 9], [9, 13], [13, 17]
        ];

        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        // 设置简洁的线条样式
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#00ddff';

        connections.forEach(([startIdx, endIdx]) => {
            const startLandmark = landmarks[startIdx];
            const endLandmark = landmarks[endIdx];

            if (startLandmark && endLandmark) {
                this.ctx.beginPath();
                this.ctx.moveTo(
                    canvasWidth - startLandmark.x * canvasWidth,
                    startLandmark.y * canvasHeight
                );
                this.ctx.lineTo(
                    canvasWidth - endLandmark.x * canvasWidth,
                    endLandmark.y * canvasHeight
                );
                this.ctx.stroke();
            }
        });
    }

    // 绘制手部轮廓（精确外轮廓）
    drawHandOutline(landmarks, animationTime) {
        if (!landmarks || landmarks.length < 21) return;

        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        // 创建手部外轮廓路径（按照手的实际外形）
        const outlinePoints = this.calculateHandOutline(landmarks);

        if (outlinePoints.length < 3) return;

        // 动画效果的线条宽度和颜色
        const animatedWidth = 3 + Math.sin(animationTime * 3) * 1;
        const pulseAlpha = 0.7 + Math.sin(animationTime * 4) * 0.3;

        // 设置轮廓样式 - 多层效果
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // 外层发光效果
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = animatedWidth + 4;
        this.ctx.globalAlpha = 0.2 * pulseAlpha;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 25;

        // 绘制平滑的手部轮廓
        this.ctx.beginPath();

        // 转换坐标并开始路径
        const firstPoint = outlinePoints[0];
        this.ctx.moveTo(
            canvasWidth - firstPoint.x * canvasWidth,
            firstPoint.y * canvasHeight
        );

        // 使用二次贝塞尔曲线创建平滑轮廓
        for (let i = 1; i < outlinePoints.length; i++) {
            const current = outlinePoints[i];
            const next = outlinePoints[(i + 1) % outlinePoints.length];

            const currentX = canvasWidth - current.x * canvasWidth;
            const currentY = current.y * canvasHeight;
            const nextX = canvasWidth - next.x * canvasWidth;
            const nextY = next.y * canvasHeight;

            // 计算控制点以创建平滑曲线
            const controlX = (currentX + nextX) / 2;
            const controlY = (currentY + nextY) / 2;

            this.ctx.quadraticCurveTo(currentX, currentY, controlX, controlY);
        }

        this.ctx.closePath();
        this.ctx.stroke();

        // 中层轮廓
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = animatedWidth;
        this.ctx.globalAlpha = 0.6 * pulseAlpha;
        this.ctx.shadowBlur = 15;
        this.ctx.stroke();

        // 内层核心轮廓
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = animatedWidth - 1;
        this.ctx.globalAlpha = pulseAlpha;
        this.ctx.shadowBlur = 8;
        this.ctx.stroke();

        // 重置效果
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1.0;
    }

    // 计算手部精确外轮廓点（改进的手形轮廓）
    calculateHandOutline(landmarks) {
        const outlinePoints = [];

        // 从手腕开始，按顺时针方向构建轮廓
        outlinePoints.push(landmarks[0]); // 手腕

        // 拇指侧轮廓
        outlinePoints.push(landmarks[1]); // 拇指根部
        outlinePoints.push(landmarks[2]); // 拇指第一关节
        outlinePoints.push(landmarks[3]); // 拇指第二关节
        outlinePoints.push(landmarks[4]); // 拇指尖

        // 从拇指尖到食指尖的过渡
        const thumbToIndex = this.interpolatePoint(landmarks[4], landmarks[8], 0.5);
        outlinePoints.push(thumbToIndex);

        // 手指尖轮廓
        outlinePoints.push(landmarks[8]);  // 食指尖
        outlinePoints.push(landmarks[12]); // 中指尖
        outlinePoints.push(landmarks[16]); // 无名指尖
        outlinePoints.push(landmarks[20]); // 小指尖

        // 小指侧轮廓
        outlinePoints.push(landmarks[19]); // 小指第二关节
        outlinePoints.push(landmarks[18]); // 小指第一关节
        outlinePoints.push(landmarks[17]); // 小指根部

        // 手掌底部轮廓
        const palmBottom1 = this.interpolatePoint(landmarks[17], landmarks[0], 0.25);
        const palmBottom2 = this.interpolatePoint(landmarks[17], landmarks[0], 0.5);
        const palmBottom3 = this.interpolatePoint(landmarks[17], landmarks[0], 0.75);

        outlinePoints.push(palmBottom1);
        outlinePoints.push(palmBottom2);
        outlinePoints.push(palmBottom3);

        return outlinePoints;
    }

    // 凸包算法（Graham扫描法）
    convexHull(points) {
        if (points.length < 3) return points;

        // 找到最下方的点（y最大），如果有多个则选择最左边的
        let bottom = 0;
        for (let i = 1; i < points.length; i++) {
            if (points[i].y > points[bottom].y ||
                (points[i].y === points[bottom].y && points[i].x < points[bottom].x)) {
                bottom = i;
            }
        }

        // 将最下方的点移到第一个位置
        [points[0], points[bottom]] = [points[bottom], points[0]];

        // 按极角排序
        const p0 = points[0];
        points.slice(1).sort((a, b) => {
            const angleA = Math.atan2(a.y - p0.y, a.x - p0.x);
            const angleB = Math.atan2(b.y - p0.y, b.x - p0.x);
            return angleA - angleB;
        });

        // Graham扫描
        const hull = [points[0], points[1]];

        for (let i = 2; i < points.length; i++) {
            while (hull.length > 1 &&
                   this.crossProduct(hull[hull.length-2], hull[hull.length-1], points[i]) <= 0) {
                hull.pop();
            }
            hull.push(points[i]);
        }

        return hull;
    }

    // 计算叉积（用于判断转向）
    crossProduct(o, a, b) {
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    }

    // 在两点之间插值
    interpolatePoint(point1, point2, ratio) {
        return {
            x: point1.x + (point2.x - point1.x) * ratio,
            y: point1.y + (point2.y - point1.y) * ratio
        };
    }

    // 设置显示控制
    setShowSkeleton(show) {
        this.showSkeleton = show;
    }
}
