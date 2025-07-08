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
}
