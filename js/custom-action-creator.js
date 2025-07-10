// 自定义动作创建器类
class CustomActionCreator {
    constructor(customActionManager, poseDetector) {
        this.customActionManager = customActionManager;
        this.poseDetector = poseDetector;
        this.imageProcessor = new ImageProcessor(poseDetector);
        this.keypointEditor = null;
        
        this.currentMode = null; // 'camera' 或 'upload'
        this.currentImageData = null;
        this.currentKeypoints = [];

        this.isModalOpen = false;
        this.modal = null;

        // 添加关键点模式
        this.isAddPointMode = false;
        this.addPointListener = null;
        
        this.init();
    }

    // 初始化创建器
    init() {
        this.createModal();
    }

    // 创建模态对话框
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'custom-action-modal';
        this.modal.style.display = 'none';
        
        this.modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>创建自定义动作</h2>
                        <button class="modal-close" type="button">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <!-- 模式选择 -->
                        <div class="mode-selection">
                            <h3>选择创建方式</h3>
                            <div class="mode-buttons">
                                <button class="mode-btn" data-mode="camera">
                                    📷 摄像头截图
                                </button>
                                <button class="mode-btn" data-mode="upload">
                                    📁 上传图片
                                </button>
                            </div>
                        </div>

                        <!-- 摄像头模式 -->
                        <div class="camera-mode" style="display: none;">
                            <h3>摄像头截图</h3>
                            <div class="camera-preview-container">
                                <div class="camera-preview" id="camera-preview-area">
                                    <p>摄像头预览区域</p>
                                </div>
                            </div>
                            <p>请摆好姿势，然后点击截图按钮</p>
                            <div class="camera-controls">
                                <button class="capture-btn">📷 截图</button>
                                <button class="back-btn">← 返回</button>
                            </div>
                            <div class="capture-status"></div>
                        </div>

                        <!-- 上传模式 -->
                        <div class="upload-mode" style="display: none;">
                            <h3>上传图片</h3>
                            <div class="upload-notice">
                                <p>⚠️ <strong>注意</strong>：图片自动姿态检测功能有限，建议优先使用摄像头截图功能。</p>
                                <p>上传图片后需要手动添加和调整关键点。</p>
                            </div>
                            <div class="upload-area">
                                <input type="file" class="file-input" accept="image/*" style="display: none;">
                                <div class="upload-zone">
                                    <div class="upload-icon">📁</div>
                                    <p>点击选择图片或拖拽图片到此处</p>
                                    <p class="upload-hint">支持 JPG、PNG、WebP 格式，最大 10MB</p>
                                </div>
                            </div>
                            <button class="back-btn">← 返回</button>
                            <div class="upload-status"></div>
                        </div>

                        <!-- 编辑模式 -->
                        <div class="edit-mode" style="display: none;">
                            <h3>编辑关键点</h3>

                            <!-- 顶部工具栏 -->
                            <div class="edit-toolbar">
                                <div class="toolbar-left">
                                    <button class="detect-pose-btn">🔍 自动检测</button>
                                    <div class="tool-group">
                                        <button class="tool-btn move-tool-btn active" data-tool="move">🔄 移动</button>
                                        <button class="tool-btn add-tool-btn" data-tool="add">➕ 添加</button>
                                        <button class="tool-btn delete-tool-btn" data-tool="delete">➖ 删除</button>
                                    </div>
                                    <button class="clear-points-btn">🗑️ 清空</button>
                                </div>
                                <div class="toolbar-right">
                                    <button class="next-step-btn">➡️ 下一步</button>
                                    <button class="back-btn">← 返回</button>
                                </div>
                            </div>

                            <!-- 编辑器容器 -->
                            <div class="editor-container"></div>

                            <!-- 底部控制面板 -->
                            <div class="edit-controls-panel">
                                <div class="control-section">
                                    <h4>💡 操作提示</h4>
                                    <div class="tips-grid">
                                        <div class="tip-item">
                                            <span class="tip-icon">🎯</span>
                                            <span>拖拽关键点调整位置</span>
                                        </div>
                                        <div class="tip-item">
                                            <span class="tip-icon">➕</span>
                                            <span>选择添加工具后点击图片</span>
                                        </div>
                                        <div class="tip-item">
                                            <span class="tip-icon">🗑️</span>
                                            <span>右键点击关键点删除</span>
                                        </div>
                                        <div class="tip-item">
                                            <span class="tip-icon">🔍</span>
                                            <span>自动检测识别关键点</span>
                                        </div>
                                    </div>
                                    <div class="keypoint-tips">
                                        <strong>📝 关键点建议：</strong>
                                        <p>至少标注头部、肩膀、手肘、手腕、臀部、膝盖、脚踝等主要关节点，这样可以获得更好的动作识别效果。</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 保存模式 -->
                        <div class="save-mode" style="display: none;">
                            <h3>保存动作</h3>
                            <form class="action-form">
                                <div class="form-group">
                                    <label for="action-name">动作名称 *</label>
                                    <input type="text" id="action-name" name="action-name" class="form-input" placeholder="输入动作名称" required>
                                </div>

                                <div class="form-group">
                                    <label for="action-description">动作描述</label>
                                    <textarea id="action-description" name="action-description" class="form-textarea" placeholder="描述这个动作的要点和注意事项" rows="3"></textarea>
                                </div>

                                <div class="form-group">
                                    <label for="action-difficulty">难度等级</label>
                                    <select id="action-difficulty" name="action-difficulty" class="form-select">
                                        <option value="1">1 - 简单</option>
                                        <option value="2">2 - 容易</option>
                                        <option value="3" selected>3 - 中等</option>
                                        <option value="4">4 - 困难</option>
                                        <option value="5">5 - 专家</option>
                                    </select>
                                </div>

                                <div class="keypoints-summary">
                                    <h4>关键点信息</h4>
                                    <p>检测到 <span class="keypoint-count">0</span> 个关键点</p>
                                </div>

                                <div class="form-actions">
                                    <button type="button" class="back-btn">← 返回编辑</button>
                                    <button type="submit" class="save-btn">💾 保存动作</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.setupModalEvents();
        this.addModalStyles();
    }

    // 添加模态对话框样式
    addModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .camera-preview-container {
                margin: 15px 0;
                border: 2px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
                background: #f5f5f5;
            }

            .camera-preview {
                width: 100%;
                height: 0;
                padding-bottom: 56.25%; /* 16:9 宽高比 */
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                background: #000;
                color: #fff;
            }

            .camera-preview video {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                transform: scaleX(-1); /* 镜像显示 */
            }

            .camera-preview canvas {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                transform: scaleX(-1); /* 镜像显示 */
                pointer-events: none;
                transform: scaleX(-1); /* 镜像显示画布 */
            }

            .edit-toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                margin-bottom: 15px;
                flex-wrap: wrap;
                gap: 10px;
            }

            .toolbar-left {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }

            .toolbar-right {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .tool-group {
                display: inline-flex;
                gap: 0;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .tool-btn {
                padding: 10px 16px;
                border: none;
                background: #ffffff;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
                font-weight: 500;
                color: #495057;
                border-right: 1px solid #dee2e6;
                min-height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .tool-btn:last-child {
                border-right: none;
            }

            .tool-btn:hover {
                background: #f8f9fa;
                transform: translateY(-1px);
            }

            .tool-btn.active {
                background: #007bff;
                color: white;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
            }

            .edit-controls-panel {
                margin-top: 20px;
                padding: 15px;
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 8px;
            }

            .control-section h4 {
                margin: 0 0 15px 0;
                color: #495057;
                font-size: 16px;
            }

            .tips-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-bottom: 15px;
            }

            .tip-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: white;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                font-size: 14px;
            }

            .tip-icon {
                font-size: 16px;
                flex-shrink: 0;
            }

            .keypoint-tips {
                padding: 12px;
                background: #e3f2fd;
                border: 1px solid #bbdefb;
                border-radius: 6px;
                margin-top: 10px;
            }

            .keypoint-tips strong {
                color: #1976d2;
                display: block;
                margin-bottom: 5px;
            }

            .keypoint-tips p {
                margin: 0;
                color: #424242;
                font-size: 14px;
                line-height: 1.4;
            }

            .tool-btn.delete-tool-btn.active {
                background: #dc3545;
                color: white;
            }

            /* 统一按钮样式 */
            .detect-pose-btn, .clear-points-btn, .next-step-btn, .back-btn,
            .capture-btn, .save-btn, .mode-btn {
                padding: 10px 20px;
                border: 1px solid #dee2e6;
                background: #ffffff;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                color: #495057;
                transition: all 0.2s ease;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                min-height: 40px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }

            .detect-pose-btn:hover, .clear-points-btn:hover, .next-step-btn:hover,
            .back-btn:hover, .capture-btn:hover, .save-btn:hover, .mode-btn:hover {
                background: #f8f9fa;
                border-color: #adb5bd;
                transform: translateY(-1px);
                box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            }

            .detect-pose-btn:active, .clear-points-btn:active, .next-step-btn:active,
            .back-btn:active, .capture-btn:active, .save-btn:active, .mode-btn:active {
                background: #e9ecef;
                transform: translateY(0);
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .detect-pose-btn:disabled, .clear-points-btn:disabled, .next-step-btn:disabled,
            .back-btn:disabled, .capture-btn:disabled, .save-btn:disabled, .mode-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            /* 特殊按钮颜色 */
            .detect-pose-btn {
                background: #e3f2fd;
                border-color: #bbdefb;
                color: #1976d2;
            }

            .detect-pose-btn:hover {
                background: #bbdefb;
                border-color: #90caf9;
            }

            .next-step-btn, .save-btn {
                background: #007bff;
                border-color: #007bff;
                color: white;
            }

            .next-step-btn:hover, .save-btn:hover {
                background: #0056b3;
                border-color: #0056b3;
            }

            .clear-points-btn {
                background: #fff3cd;
                border-color: #ffeaa7;
                color: #856404;
            }

            .clear-points-btn:hover {
                background: #ffeaa7;
                border-color: #fdcb6e;
            }

            .capture-btn {
                background: #d4edda;
                border-color: #c3e6cb;
                color: #155724;
            }

            .capture-btn:hover {
                background: #c3e6cb;
                border-color: #b8daff;
            }

            /* 模式选择按钮特殊样式 */
            .mode-selection .mode-btn {
                width: 100%;
                padding: 15px 20px;
                margin: 8px 0;
                font-size: 16px;
                min-height: 50px;
            }

            /* 摄像头控制按钮容器 */
            .camera-controls {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin: 15px 0;
                flex-wrap: wrap;
            }

            /* 表单操作按钮容器 */
            .form-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
                flex-wrap: wrap;
            }
        `;
        document.head.appendChild(style);
    }

    // 设置模态对话框事件
    setupModalEvents() {
        // 关闭按钮
        this.modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        // 点击遮罩关闭
        this.modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });

        // 模式选择按钮
        this.modal.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.selectMode(mode);
            });
        });

        // 返回按钮
        this.modal.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showModeSelection();
            });
        });

        // 摄像头截图按钮
        this.modal.querySelector('.capture-btn').addEventListener('click', () => {
            this.captureFromCamera();
        });

        // 文件上传
        const fileInput = this.modal.querySelector('.file-input');
        const uploadZone = this.modal.querySelector('.upload-zone');

        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        // 拖拽上传
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length > 0) {
                this.handleFileUpload(e.dataTransfer.files[0]);
            }
        });

        // 编辑模式按钮
        this.modal.querySelector('.detect-pose-btn').addEventListener('click', () => {
            this.detectPoseInCurrentImage();
        });

        // 工具按钮事件
        this.modal.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.target.dataset.tool;
                this.switchTool(tool);
            });
        });

        this.modal.querySelector('.clear-points-btn').addEventListener('click', () => {
            this.clearKeypoints();
        });

        this.modal.querySelector('.next-step-btn').addEventListener('click', () => {
            this.proceedToSaveMode();
        });

        // 保存表单
        this.modal.querySelector('.action-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAction();
        });

        // 返回编辑按钮
        this.modal.querySelector('.save-mode .back-btn').addEventListener('click', () => {
            this.showEditMode();
        });
    }

    // 打开创建器
    openCreator() {
        this.isModalOpen = true;
        this.modal.style.display = 'block';
        this.showModeSelection();
        document.body.style.overflow = 'hidden';
    }

    // 关闭创建器
    closeModal() {
        this.isModalOpen = false;
        this.modal.style.display = 'none';
        document.body.style.overflow = '';

        // 清理编辑器
        if (this.keypointEditor) {
            // 移除添加关键点监听器
            if (this.addPointListener && this.keypointEditor.canvas) {
                this.keypointEditor.canvas.removeEventListener('click', this.addPointListener);
            }
            this.keypointEditor.destroy();
            this.keypointEditor = null;
        }

        // 重置状态
        this.currentMode = null;
        this.currentImageData = null;
        this.currentKeypoints = [];
        this.isAddPointMode = false;
        this.addPointListener = null;
    }

    // 显示模式选择
    showModeSelection() {
        this.hideAllModes();
        this.modal.querySelector('.mode-selection').style.display = 'block';
    }

    // 选择模式
    selectMode(mode) {
        this.currentMode = mode;
        this.hideAllModes();

        if (mode === 'camera') {
            this.showCameraMode();
        } else if (mode === 'upload') {
            this.showUploadMode();
        }
    }

    // 显示摄像头模式
    async showCameraMode() {
        this.modal.querySelector('.camera-mode').style.display = 'block';

        // 检查摄像头状态
        if (!this.poseDetector.video || !this.poseDetector.video.srcObject) {
            this.showStatus('.capture-status', '正在启用摄像头...', 'loading');
            this.modal.querySelector('.capture-btn').disabled = true;

            // 尝试启用摄像头
            try {
                await this.enableCameraForPreview();
            } catch (error) {
                this.showStatus('.capture-status', '摄像头启用失败: ' + error.message, 'error');
                return;
            }
        }

        // 设置摄像头预览
        this.setupCameraPreview();

        // 自动启动对应的检测模式
        this.startDetectionForMode();

        this.showStatus('.capture-status', '摄像头已就绪，请摆好姿势', 'success');
        this.modal.querySelector('.capture-btn').disabled = false;
    }

    // 启用摄像头用于预览
    async enableCameraForPreview() {
        if (!this.poseDetector.video || !this.poseDetector.video.srcObject) {
            // 如果摄像头未启用，尝试启用
            const enableBtn = document.querySelector('#enable-camera-btn');
            if (enableBtn && !enableBtn.disabled) {
                enableBtn.click();

                // 等待摄像头启用
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const checkCamera = () => {
                        attempts++;
                        if (this.poseDetector.video && this.poseDetector.video.srcObject) {
                            resolve();
                        } else if (attempts > 20) { // 10秒超时
                            reject(new Error('摄像头启用超时'));
                        } else {
                            setTimeout(checkCamera, 500);
                        }
                    };
                    checkCamera();
                });
            } else {
                throw new Error('无法启用摄像头');
            }
        }
    }

    // 设置摄像头预览
    setupCameraPreview() {
        const previewArea = this.modal.querySelector('#camera-preview-area');
        if (!previewArea || !this.poseDetector.video) {
            return;
        }

        // 清空预览区域
        previewArea.innerHTML = '';

        // 克隆主摄像头视频元素用于预览
        const previewVideo = this.poseDetector.video.cloneNode();
        previewVideo.srcObject = this.poseDetector.video.srcObject;
        previewVideo.autoplay = true;
        previewVideo.muted = true;
        previewVideo.playsInline = true;

        previewArea.appendChild(previewVideo);

        // 如果有检测画布，也添加到预览中
        if (this.poseDetector.canvas) {
            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = this.poseDetector.canvas.width;
            previewCanvas.height = this.poseDetector.canvas.height;
            previewArea.appendChild(previewCanvas);

            // 定期更新预览画布
            this.updatePreviewCanvas(previewCanvas);
        }
    }

    // 更新预览画布
    updatePreviewCanvas(previewCanvas) {
        if (!this.poseDetector.canvas || !previewCanvas) {
            return;
        }

        const ctx = previewCanvas.getContext('2d');

        const updateFrame = () => {
            if (this.modal.querySelector('.camera-mode').style.display === 'block') {
                // 复制主画布内容到预览画布，并应用镜像变换
                ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
                ctx.save();
                ctx.scale(-1, 1); // 水平镜像
                ctx.drawImage(this.poseDetector.canvas, -previewCanvas.width, 0);
                ctx.restore();
                requestAnimationFrame(updateFrame);
            }
        };

        updateFrame();
    }

    // 启动对应检测模式
    startDetectionForMode() {
        const currentMode = this.getCurrentDetectionMode();

        // 检查是否已在检测
        const isDetecting = document.querySelector('#start-detection-btn')?.textContent.includes('停止');

        if (!isDetecting) {
            // 设置检测模式
            const detectionSelect = document.querySelector('#detection-select');
            if (detectionSelect && detectionSelect.value !== currentMode) {
                detectionSelect.value = currentMode;
                // 触发change事件
                detectionSelect.dispatchEvent(new Event('change'));
            }

            // 启动检测
            const startBtn = document.querySelector('#start-detection-btn');
            if (startBtn && !startBtn.disabled) {
                setTimeout(() => {
                    startBtn.click();
                }, 500);
            }
        }
    }

    // 显示上传模式
    showUploadMode() {
        this.modal.querySelector('.upload-mode').style.display = 'block';
    }

    // 显示编辑模式
    showEditMode() {
        this.hideAllModes();
        this.modal.querySelector('.edit-mode').style.display = 'block';

        // 创建关键点编辑器
        const editorContainer = this.modal.querySelector('.editor-container');
        editorContainer.innerHTML = '';

        this.keypointEditor = new KeypointEditor(editorContainer);

        if (this.currentImageData) {
            this.keypointEditor.loadImage(this.currentImageData).then(() => {
                // 根据当前检测模式设置编辑器模式
                const currentMode = this.getCurrentDetectionMode();
                if (currentMode === 'hand') {
                    this.keypointEditor.editMode = 'hand';
                } else {
                    this.keypointEditor.editMode = 'pose';
                }
                this.keypointEditor.updateKeypointTypeOptions();

                if (this.currentKeypoints.length > 0) {
                    console.log('设置关键点到编辑器:', this.currentKeypoints.length, '个');
                    this.keypointEditor.setKeypoints(this.currentKeypoints);
                }

                // 初始化工具状态
                this.switchTool('move');
            });
        }
    }

    // 获取当前检测模式
    getCurrentDetectionMode() {
        // 检查主页面的检测模式
        const detectionSelect = document.querySelector('#detection-select');
        if (detectionSelect) {
            const mode = detectionSelect.value;
            if (mode === 'hand') {
                return 'hand';
            }
        }
        return 'pose'; // 默认为姿态检测
    }

    // 从编辑模式进入保存模式
    proceedToSaveMode() {
        if (!this.keypointEditor) {
            this.showTemporaryMessage('⚠️ 编辑器未初始化', 2000);
            return;
        }

        const keypoints = this.keypointEditor.getKeypoints();
        if (keypoints.length === 0) {
            this.showTemporaryMessage('⚠️ 请至少添加一个关键点', 2000);
            return;
        }

        // 保存当前关键点
        this.currentKeypoints = keypoints;
        console.log('准备保存的关键点:', keypoints.length, '个');

        this.showSaveMode();
    }

    // 显示保存模式
    showSaveMode() {
        this.hideAllModes();
        this.modal.querySelector('.save-mode').style.display = 'block';
        
        // 更新关键点数量
        const keypoints = this.keypointEditor ? this.keypointEditor.getKeypoints() : [];
        this.modal.querySelector('.keypoint-count').textContent = keypoints.length;
    }

    // 隐藏所有模式
    hideAllModes() {
        const modes = ['.mode-selection', '.camera-mode', '.upload-mode', '.edit-mode', '.save-mode'];
        modes.forEach(selector => {
            const element = this.modal.querySelector(selector);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    // 从摄像头截图
    async captureFromCamera() {
        try {
            this.showStatus('.capture-status', '正在截图...', 'loading');

            // 检查摄像头状态
            if (!this.poseDetector.video || !this.poseDetector.video.srcObject) {
                this.showStatus('.capture-status', '摄像头未启用，请先启用摄像头', 'error');
                return;
            }

            if (this.poseDetector.video.readyState < 2) {
                this.showStatus('.capture-status', '摄像头未准备就绪，请稍候再试', 'error');
                return;
            }

            const result = await this.poseDetector.captureFrame();

            if (result.success) {
                this.currentImageData = result.imageData;
                this.currentKeypoints = result.keypoints || [];

                const keypointCount = this.currentKeypoints.length;
                this.showStatus('.capture-status',
                    `截图成功！${keypointCount > 0 ? '检测到 ' + keypointCount + ' 个关键点' : '未检测到关键点'}`,
                    'success');

                // 延迟一下再切换到编辑模式
                setTimeout(() => {
                    this.showEditMode();
                }, 1500);
            } else {
                this.showStatus('.capture-status', '截图失败: ' + result.error, 'error');
            }

        } catch (error) {
            console.error('截图失败:', error);
            this.showStatus('.capture-status', '截图失败: ' + error.message, 'error');
        }
    }

    // 处理文件上传
    async handleFileUpload(file) {
        try {
            this.showStatus('.upload-status', '正在处理图片...', 'loading');

            // 加载图片
            const loadResult = await this.imageProcessor.loadImageFile(file);

            if (loadResult.success) {
                this.currentImageData = loadResult.dataUrl;

                // 尝试自动检测
                this.showStatus('.upload-status', '图片加载成功！正在尝试自动检测...', 'loading');

                try {
                    const img = new Image();
                    img.src = loadResult.dataUrl;

                    await new Promise((resolve) => {
                        img.onload = resolve;
                    });

                    // 尝试姿态检测
                    const detectResult = await this.poseDetector.detectPoseInImage(img);

                    if (detectResult.success && detectResult.keypoints && detectResult.keypoints.length > 0) {
                        this.currentKeypoints = detectResult.keypoints;
                        this.showStatus('.upload-status',
                            `图片处理成功！自动检测到 ${detectResult.keypoints.length} 个关键点`, 'success');
                    } else {
                        this.currentKeypoints = [];
                        this.showStatus('.upload-status', '图片加载成功！未检测到关键点，请手动添加', 'success');
                    }
                } catch (detectError) {
                    console.warn('自动检测失败:', detectError);
                    this.currentKeypoints = [];
                    this.showStatus('.upload-status', '图片加载成功！自动检测失败，请手动添加关键点', 'success');
                }

                // 延迟一下再切换到编辑模式
                setTimeout(() => {
                    this.showEditMode();
                }, 1500);
            } else {
                this.showStatus('.upload-status', '处理失败: ' + loadResult.error, 'error');
            }

        } catch (error) {
            console.error('文件上传失败:', error);
            this.showStatus('.upload-status', '上传失败: ' + error.message, 'error');
        }
    }

    // 检测当前图片中的姿态
    async detectPoseInCurrentImage() {
        if (!this.currentImageData || !this.keypointEditor) {
            return;
        }

        try {
            // 显示检测状态
            const detectBtn = this.modal.querySelector('.detect-pose-btn');
            const originalText = detectBtn.textContent;
            detectBtn.textContent = '🔍 检测中...';
            detectBtn.disabled = true;

            // 快速提示用户限制
            this.showTemporaryMessage('ℹ️ 正在尝试检测姿态...', 1000);

            // 创建临时图片元素
            const img = new Image();
            img.src = this.currentImageData;

            await new Promise((resolve) => {
                img.onload = resolve;
            });

            // 设置超时，避免长时间等待
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ success: false, error: '检测超时' });
                }, 3000); // 3秒超时
            });

            const detectPromise = this.poseDetector.detectPoseInImage(img);
            const result = await Promise.race([detectPromise, timeoutPromise]);

            if (result.success && result.keypoints && result.keypoints.length > 0) {
                this.currentKeypoints = result.keypoints;
                this.keypointEditor.setKeypoints(result.keypoints);
                console.log('姿态检测成功，关键点数量:', result.keypoints.length);

                // 显示成功消息
                this.showTemporaryMessage('✅ 检测成功！找到 ' + result.keypoints.length + ' 个关键点');
            } else {
                console.warn('姿态检测失败或超时:', result.error);

                // 显示提示消息
                this.showTemporaryMessage('⚠️ 自动检测不可用，请手动添加关键点。建议使用摄像头截图功能获得更好效果。', 4000);
            }

            // 恢复按钮状态
            detectBtn.textContent = originalText;
            detectBtn.disabled = false;

        } catch (error) {
            console.error('姿态检测失败:', error);

            // 恢复按钮状态
            const detectBtn = this.modal.querySelector('.detect-pose-btn');
            detectBtn.textContent = '🔍 自动检测姿态';
            detectBtn.disabled = false;

            this.showTemporaryMessage('⚠️ 自动检测不可用，请手动添加关键点', 3000);
        }
    }

    // 切换工具
    switchTool(tool) {
        // 更新按钮状态
        this.modal.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        this.modal.querySelector(`[data-tool="${tool}"]`).classList.add('active');

        // 设置编辑器模式
        if (this.keypointEditor) {
            switch (tool) {
                case 'move':
                    this.keypointEditor.setTool('move');
                    break;
                case 'add':
                    this.keypointEditor.setTool('add');
                    break;
                case 'delete':
                    this.keypointEditor.setTool('delete');
                    break;
            }
        }

        // 更新当前工具
        this.currentTool = tool;
    }

    // 切换添加关键点模式
    toggleAddPointMode() {
        if (!this.keypointEditor) {
            return;
        }

        const btn = this.modal.querySelector('.add-point-btn');

        if (this.isAddPointMode) {
            // 退出添加模式
            this.isAddPointMode = false;
            btn.textContent = '➕ 手动添加关键点';
            btn.style.background = '';
            this.keypointEditor.disableAddMode();
            this.showTemporaryMessage('已退出添加关键点模式');
        } else {
            // 进入添加模式
            this.isAddPointMode = true;
            btn.textContent = '❌ 退出添加模式';
            btn.style.background = '#28a745';
            this.keypointEditor.enableAddMode();
            this.showTemporaryMessage('点击图片选择关键点类型并添加，再次点击按钮退出', 3000);

            // 添加点击事件监听器
            this.setupAddPointListener();
        }
    }

    // 设置添加关键点的监听器
    setupAddPointListener() {
        if (!this.keypointEditor || !this.keypointEditor.canvas) {
            return;
        }

        const canvas = this.keypointEditor.canvas;

        // 移除之前的监听器
        if (this.addPointListener) {
            canvas.removeEventListener('click', this.addPointListener);
        }

        // 创建新的监听器
        this.addPointListener = (e) => {
            if (!this.isAddPointMode) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // 转换为原始图片坐标
            const originalX = x / this.keypointEditor.scaleX;
            const originalY = y / this.keypointEditor.scaleY;

            // 生成关键点名称
            const pointName = `point_${Date.now()}`;

            // 添加关键点
            this.keypointEditor.addKeypoint(pointName, originalX, originalY, 0.9);

            this.showTemporaryMessage(`已添加关键点: ${pointName}`, 1500);
        };

        canvas.addEventListener('click', this.addPointListener);
    }

    // 清空关键点
    clearKeypoints() {
        if (this.keypointEditor) {
            this.keypointEditor.clearKeypoints();
            this.currentKeypoints = [];
            this.showTemporaryMessage('已清空所有关键点');
        }
    }

    // 保存动作
    async saveAction() {
        try {
            // 显示保存状态
            const saveBtn = this.modal.querySelector('.save-btn');
            saveBtn.textContent = '💾 保存中...';
            saveBtn.disabled = true;

            if (!this.keypointEditor) {
                throw new Error('编辑器未初始化');
            }

            const keypoints = this.keypointEditor.getKeypoints();
            if (keypoints.length === 0) {
                throw new Error('请至少添加一个关键点');
            }

            // 获取表单数据
            const form = this.modal.querySelector('.action-form');
            const formData = new FormData(form);

            const actionName = formData.get('action-name')?.trim();
            if (!actionName) {
                throw new Error('请输入动作名称');
            }

            const actionData = {
                name: actionName,
                description: formData.get('action-description')?.trim() || '',
                difficulty: parseInt(formData.get('action-difficulty')) || 3,
                keypoints: keypoints,
                referenceImage: this.currentImageData
            };

            console.log('准备保存动作数据:', {
                name: actionData.name,
                description: actionData.description,
                difficulty: actionData.difficulty,
                keypointCount: actionData.keypoints.length,
                hasImage: !!actionData.referenceImage
            });

            const result = this.customActionManager.createAction(actionData);

            if (result.success) {
                console.log('自定义动作保存成功:', result.action.name);
                this.showTemporaryMessage('✅ 动作保存成功！', 2000);

                // 延迟关闭模态框
                setTimeout(() => {
                    this.closeModal();

                    // 通知主应用更新动作列表
                    if (this.onActionCreated) {
                        this.onActionCreated(result.action);
                    }
                }, 1000);
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('保存动作失败:', error);
            this.showTemporaryMessage('❌ 保存失败: ' + error.message, 3000);

            // 恢复按钮状态
            const saveBtn = this.modal.querySelector('.save-btn');
            saveBtn.textContent = '💾 保存动作';
            saveBtn.disabled = false;
        }
    }

    // 显示状态信息
    showStatus(selector, message, type = 'info') {
        const statusElement = this.modal.querySelector(selector);
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status ${type}`;
        }
    }

    // 显示临时消息
    showTemporaryMessage(message, duration = 3000) {
        // 创建临时消息元素
        const messageEl = document.createElement('div');
        messageEl.className = 'temporary-message';
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease-out;
        `;

        // 添加动画样式
        if (!document.querySelector('#temp-message-styles')) {
            const style = document.createElement('style');
            style.id = 'temp-message-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(messageEl);

        // 自动移除
        setTimeout(() => {
            messageEl.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, duration);
    }

    // 设置动作创建完成回调
    setActionCreatedCallback(callback) {
        this.onActionCreated = callback;
    }
}

// 导出类到全局
window.CustomActionCreator = CustomActionCreator;
