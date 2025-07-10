// 关键点编辑器类
class KeypointEditor {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.ctx = null;
        this.imageElement = null;
        this.keypoints = [];
        this.selectedKeypoint = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // 样式配置
        this.styles = {
            keypoint: {
                radius: 8,
                color: '#ff4444',
                selectedColor: '#ff0000',
                strokeColor: '#ffffff',
                strokeWidth: 2
            },
            skeleton: {
                color: '#00ff88',
                width: 2,
                selectedColor: '#ffff00'
            },
            text: {
                font: '12px Arial',
                color: '#333333',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: 4
            }
        };

        // 人体关键点类型定义（与ml5.js PoseNet一致）
        this.poseKeypointTypes = [
            { name: 'nose', label: '鼻子' },
            { name: 'leftEye', label: '左眼' },
            { name: 'rightEye', label: '右眼' },
            { name: 'leftEar', label: '左耳' },
            { name: 'rightEar', label: '右耳' },
            { name: 'leftShoulder', label: '左肩' },
            { name: 'rightShoulder', label: '右肩' },
            { name: 'leftElbow', label: '左肘' },
            { name: 'rightElbow', label: '右肘' },
            { name: 'leftWrist', label: '左手腕' },
            { name: 'rightWrist', label: '右手腕' },
            { name: 'leftHip', label: '左髋' },
            { name: 'rightHip', label: '右髋' },
            { name: 'leftKnee', label: '左膝' },
            { name: 'rightKnee', label: '右膝' },
            { name: 'leftAnkle', label: '左踝' },
            { name: 'rightAnkle', label: '右踝' }
        ];

        // 手部关键点类型定义（与MediaPipe一致）
        this.handKeypointTypes = [
            { name: 'wrist', label: '手腕' },
            { name: 'thumb_cmc', label: '拇指根部' },
            { name: 'thumb_mcp', label: '拇指第一关节' },
            { name: 'thumb_ip', label: '拇指第二关节' },
            { name: 'thumb_tip', label: '拇指尖' },
            { name: 'index_mcp', label: '食指根部' },
            { name: 'index_pip', label: '食指第一关节' },
            { name: 'index_dip', label: '食指第二关节' },
            { name: 'index_tip', label: '食指尖' },
            { name: 'middle_mcp', label: '中指根部' },
            { name: 'middle_pip', label: '中指第一关节' },
            { name: 'middle_dip', label: '中指第二关节' },
            { name: 'middle_tip', label: '中指尖' },
            { name: 'ring_mcp', label: '无名指根部' },
            { name: 'ring_pip', label: '无名指第一关节' },
            { name: 'ring_dip', label: '无名指第二关节' },
            { name: 'ring_tip', label: '无名指尖' },
            { name: 'pinky_mcp', label: '小指根部' },
            { name: 'pinky_pip', label: '小指第一关节' },
            { name: 'pinky_dip', label: '小指第二关节' },
            { name: 'pinky_tip', label: '小指尖' }
        ];

        // 人体关键点连接定义
        this.connections = [
            ['nose', 'leftEye'], ['nose', 'rightEye'],
            ['leftEye', 'leftEar'], ['rightEye', 'rightEar'],
            ['leftShoulder', 'rightShoulder'],
            ['leftShoulder', 'leftElbow'], ['leftElbow', 'leftWrist'],
            ['rightShoulder', 'rightElbow'], ['rightElbow', 'rightWrist'],
            ['leftShoulder', 'leftHip'], ['rightShoulder', 'rightHip'],
            ['leftHip', 'rightHip'],
            ['leftHip', 'leftKnee'], ['leftKnee', 'leftAnkle'],
            ['rightHip', 'rightKnee'], ['rightKnee', 'rightAnkle']
        ];

        // 当前编辑模式（pose 或 hand）
        this.editMode = 'pose';
        this.isAddMode = false;

        // 当前工具模式
        this.currentTool = 'move'; // move, add, delete

        this.init();
    }

    // 初始化编辑器
    init() {
        this.createCanvas();
        this.createKeypointSelector();
        this.setupEventListeners();
    }

    // 创建画布
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.border = '1px solid #ddd';
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.cursor = 'crosshair';
        this.canvas.style.maxWidth = '100%';
        this.canvas.style.height = 'auto';
        
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
    }

    createKeypointSelector() {
        // 创建关键点选择器容器
        const selectorContainer = document.createElement('div');
        selectorContainer.className = 'keypoint-selector';
        selectorContainer.style.cssText = `
            margin-top: 10px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
            display: none;
        `;

        // 模式选择
        const modeSelector = document.createElement('div');
        modeSelector.innerHTML = `
            <label style="margin-right: 15px;">
                <input type="radio" name="editMode" value="pose" checked> 人体姿态
            </label>
            <label>
                <input type="radio" name="editMode" value="hand"> 手部动作
            </label>
        `;
        selectorContainer.appendChild(modeSelector);

        // 关键点类型选择
        const typeSelector = document.createElement('select');
        typeSelector.className = 'keypoint-type-selector';
        typeSelector.style.cssText = `
            width: 100%;
            margin-top: 10px;
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 3px;
        `;
        selectorContainer.appendChild(typeSelector);

        // 添加按钮
        const addButton = document.createElement('button');
        addButton.textContent = '在此位置添加关键点';
        addButton.className = 'add-keypoint-btn';
        addButton.style.cssText = `
            width: 100%;
            margin-top: 10px;
            padding: 8px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        `;
        addButton.disabled = true;
        selectorContainer.appendChild(addButton);

        this.container.appendChild(selectorContainer);
        this.selectorContainer = selectorContainer;
        this.typeSelector = typeSelector;
        this.addButton = addButton;

        // 事件监听
        modeSelector.addEventListener('change', (e) => {
            this.editMode = e.target.value;
            this.updateKeypointTypeOptions();
        });

        addButton.addEventListener('click', () => {
            this.addSelectedKeypoint();
        });

        // 初始化选项
        this.updateKeypointTypeOptions();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));

        // 触摸事件（移动设备支持）
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));

        // 右键菜单（删除关键点）
        this.canvas.addEventListener('contextmenu', (e) => this.onContextMenu(e));

        // 键盘事件
        this.canvas.setAttribute('tabindex', '0'); // 使canvas可以获得焦点
        this.canvas.addEventListener('keydown', (e) => this.onKeyDown(e));
        this.canvas.addEventListener('focus', () => {
            this.canvas.style.outline = '2px solid #007bff';
        });
        this.canvas.addEventListener('blur', () => {
            this.canvas.style.outline = 'none';
        });
    }

    // 更新关键点类型选项
    updateKeypointTypeOptions() {
        const types = this.editMode === 'pose' ? this.poseKeypointTypes : this.handKeypointTypes;

        this.typeSelector.innerHTML = '<option value="">选择关键点类型...</option>';

        types.forEach(type => {
            // 检查是否已存在该类型的关键点
            const exists = this.keypoints.some(kp => kp.part === type.name);
            if (!exists) {
                const option = document.createElement('option');
                option.value = type.name;
                option.textContent = type.label;
                this.typeSelector.appendChild(option);
            }
        });
    }

    // 加载图片
    async loadImage(imageDataUrl) {
        try {
            this.imageElement = await this.createImageElement(imageDataUrl);
            this.resizeCanvas();
            this.draw();
            return true;
        } catch (error) {
            console.error('加载图片失败:', error);
            return false;
        }
    }

    // 创建图片元素
    createImageElement(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = dataUrl;
        });
    }

    // 调整画布尺寸
    resizeCanvas() {
        if (!this.imageElement) return;

        const containerWidth = this.container.clientWidth - 20; // 留出边距
        const maxHeight = 600;

        let canvasWidth = this.imageElement.width;
        let canvasHeight = this.imageElement.height;

        // 按比例缩放
        if (canvasWidth > containerWidth) {
            const scale = containerWidth / canvasWidth;
            canvasWidth = containerWidth;
            canvasHeight = canvasHeight * scale;
        }

        if (canvasHeight > maxHeight) {
            const scale = maxHeight / canvasHeight;
            canvasHeight = maxHeight;
            canvasWidth = canvasWidth * scale;
        }

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        // 计算缩放比例用于坐标转换
        this.scaleX = canvasWidth / this.imageElement.width;
        this.scaleY = canvasHeight / this.imageElement.height;
    }

    // 设置关键点数据
    setKeypoints(keypoints) {
        console.log('设置关键点数据:', keypoints);
        this.keypoints = keypoints.map(kp => ({
            ...kp,
            name: kp.name || kp.part || 'unknown',
            part: kp.part || kp.name || 'unknown', // 兼容性
            x: kp.x * this.scaleX,
            y: kp.y * this.scaleY,
            originalX: kp.x,
            originalY: kp.y,
            confidence: kp.confidence || kp.score || 0.9,
            visible: kp.visible !== false
        }));
        this.draw();
        this.updateKeypointTypeOptions(); // 更新可选类型
    }

    // 获取关键点数据（原始坐标）
    getKeypoints() {
        return this.keypoints.map(kp => ({
            name: kp.name,
            x: kp.originalX || (kp.x / this.scaleX),
            y: kp.originalY || (kp.y / this.scaleY),
            confidence: kp.confidence || 0.9,
            visible: kp.visible !== false
        }));
    }

    // 绘制编辑器内容
    draw() {
        if (!this.ctx || !this.canvas) return;

        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制图片
        if (this.imageElement) {
            this.ctx.drawImage(this.imageElement, 0, 0, this.canvas.width, this.canvas.height);
        }

        // 绘制骨架连接
        this.drawSkeleton();

        // 绘制关键点
        this.drawKeypoints();
    }

    // 绘制骨架连接
    drawSkeleton() {
        this.ctx.strokeStyle = this.styles.skeleton.color;
        this.ctx.lineWidth = this.styles.skeleton.width;

        for (const [startName, endName] of this.connections) {
            const startPoint = this.keypoints.find(kp => kp.name === startName);
            const endPoint = this.keypoints.find(kp => kp.name === endName);

            if (startPoint && endPoint && startPoint.visible && endPoint.visible) {
                this.ctx.beginPath();
                this.ctx.moveTo(startPoint.x, startPoint.y);
                this.ctx.lineTo(endPoint.x, endPoint.y);
                this.ctx.stroke();
            }
        }
    }

    // 绘制关键点
    drawKeypoints() {
        this.keypoints.forEach((keypoint, index) => {
            if (!keypoint.visible) return;

            const isSelected = this.selectedKeypoint === index;
            const radius = this.styles.keypoint.radius;
            const color = isSelected ? this.styles.keypoint.selectedColor : this.styles.keypoint.color;

            // 绘制关键点圆圈
            this.ctx.beginPath();
            this.ctx.arc(keypoint.x, keypoint.y, radius, 0, 2 * Math.PI);
            this.ctx.fillStyle = color;
            this.ctx.fill();

            // 绘制边框
            this.ctx.strokeStyle = this.styles.keypoint.strokeColor;
            this.ctx.lineWidth = this.styles.keypoint.strokeWidth;
            this.ctx.stroke();

            // 绘制标签
            this.drawKeypointLabel(keypoint, index);
        });
    }

    // 绘制关键点标签
    drawKeypointLabel(keypoint, index) {
        const text = keypoint.name || `Point ${index}`;
        const x = keypoint.x + this.styles.keypoint.radius + 5;
        const y = keypoint.y - this.styles.keypoint.radius - 5;

        // 测量文本尺寸
        this.ctx.font = this.styles.text.font;
        const textMetrics = this.ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = 12; // 近似字体高度

        // 绘制背景
        this.ctx.fillStyle = this.styles.text.backgroundColor;
        this.ctx.fillRect(
            x - this.styles.text.padding,
            y - textHeight - this.styles.text.padding,
            textWidth + this.styles.text.padding * 2,
            textHeight + this.styles.text.padding * 2
        );

        // 绘制文本
        this.ctx.fillStyle = this.styles.text.color;
        this.ctx.fillText(text, x, y);
    }

    // 设置当前工具
    setTool(tool) {
        this.currentTool = tool;
        this.isAddMode = (tool === 'add');

        // 更新光标样式
        switch (tool) {
            case 'move':
                this.canvas.style.cursor = 'default';
                break;
            case 'add':
                this.canvas.style.cursor = 'crosshair';
                break;
            case 'delete':
                this.canvas.style.cursor = 'pointer';
                break;
        }

        // 隐藏关键点选择器
        if (this.selectorContainer) {
            this.selectorContainer.style.display = 'none';
        }
    }

    // 键盘事件处理
    onKeyDown(e) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.selectedKeypoint !== null) {
                this.removeKeypoint(this.selectedKeypoint);
                e.preventDefault();
            }
        }
    }

    // 鼠标按下事件
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 根据当前工具执行不同操作
        switch (this.currentTool) {
            case 'add':
                this.showKeypointSelector(x, y);
                return;

            case 'delete':
                const deleteIndex = this.findKeypointAt(x, y);
                if (deleteIndex !== -1) {
                    this.removeKeypoint(deleteIndex);
                    return;
                }
                break;

            case 'move':
            default:
                // 查找点击的关键点
                const clickedIndex = this.findKeypointAt(x, y);

                if (clickedIndex !== -1) {
                    this.selectedKeypoint = clickedIndex;
                    this.isDragging = true;

                    const keypoint = this.keypoints[clickedIndex];
                    this.dragOffset.x = x - keypoint.x;
                    this.dragOffset.y = y - keypoint.y;

                    this.canvas.style.cursor = 'grabbing';
                } else {
                    this.selectedKeypoint = null;
                }
                break;
        }

        this.draw();
    }

    // 鼠标移动事件
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isDragging && this.selectedKeypoint !== null) {
            // 拖拽关键点
            const keypoint = this.keypoints[this.selectedKeypoint];
            keypoint.x = x - this.dragOffset.x;
            keypoint.y = y - this.dragOffset.y;
            
            // 限制在画布范围内
            keypoint.x = Math.max(0, Math.min(this.canvas.width, keypoint.x));
            keypoint.y = Math.max(0, Math.min(this.canvas.height, keypoint.y));
            
            // 更新原始坐标
            keypoint.originalX = keypoint.x / this.scaleX;
            keypoint.originalY = keypoint.y / this.scaleY;
            
            this.draw();
        } else {
            // 更新鼠标样式
            const hoveredIndex = this.findKeypointAt(x, y);
            this.canvas.style.cursor = hoveredIndex !== -1 ? 'grab' : 'crosshair';
        }
    }

    // 鼠标释放事件
    onMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'crosshair';
    }

    // 查找指定位置的关键点
    findKeypointAt(x, y) {
        for (let i = this.keypoints.length - 1; i >= 0; i--) {
            const keypoint = this.keypoints[i];
            if (!keypoint.visible) continue;

            const distance = Math.sqrt(
                Math.pow(x - keypoint.x, 2) + Math.pow(y - keypoint.y, 2)
            );

            if (distance <= this.styles.keypoint.radius + 5) {
                return i;
            }
        }
        return -1;
    }

    // 触摸事件处理
    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.onMouseDown({
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    }

    onTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.onMouseMove({
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    }

    onTouchEnd(e) {
        e.preventDefault();
        this.onMouseUp(e);
    }

    // 右键菜单事件
    onContextMenu(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const clickedIndex = this.findKeypointAt(x, y);
        if (clickedIndex !== -1) {
            this.removeKeypoint(clickedIndex);
        }
    }

    // 删除关键点
    removeKeypoint(index) {
        if (index >= 0 && index < this.keypoints.length) {
            const removedKeypoint = this.keypoints[index];
            this.keypoints.splice(index, 1);
            this.selectedKeypoint = null;
            this.draw();
            this.updateKeypointTypeOptions(); // 更新可选类型
            console.log(`删除关键点: ${removedKeypoint.name || removedKeypoint.part}`);
        }
    }

    // 添加关键点
    addKeypoint(name, x, y, confidence = 0.9) {
        const keypoint = {
            name: name,
            x: x * this.scaleX,
            y: y * this.scaleY,
            originalX: x,
            originalY: y,
            confidence: confidence,
            visible: true
        };
        
        this.keypoints.push(keypoint);
        this.draw();
        return this.keypoints.length - 1;
    }

    // 清空所有关键点
    clearKeypoints() {
        this.keypoints = [];
        this.selectedKeypoint = null;
        this.draw();
        this.updateKeypointTypeOptions(); // 更新可选类型
    }

    // 显示关键点选择器
    showKeypointSelector(x, y) {
        this.pendingPosition = { x, y };
        this.selectorContainer.style.display = 'block';
        this.updateKeypointTypeOptions();

        // 启用添加按钮
        this.typeSelector.addEventListener('change', () => {
            this.addButton.disabled = !this.typeSelector.value;
        });
    }

    // 添加选中的关键点
    addSelectedKeypoint() {
        const selectedType = this.typeSelector.value;
        if (!selectedType || !this.pendingPosition) {
            return;
        }

        const types = this.editMode === 'pose' ? this.poseKeypointTypes : this.handKeypointTypes;
        const typeInfo = types.find(t => t.name === selectedType);

        if (typeInfo) {
            this.keypoints.push({
                name: selectedType,
                part: selectedType, // 兼容性
                x: this.pendingPosition.x,
                y: this.pendingPosition.y,
                originalX: this.pendingPosition.x / this.scaleX,
                originalY: this.pendingPosition.y / this.scaleY,
                confidence: 0.9,
                visible: true
            });

            console.log(`添加关键点: ${typeInfo.label} (${selectedType})`);

            // 隐藏选择器
            this.selectorContainer.style.display = 'none';
            this.pendingPosition = null;

            // 更新显示
            this.draw();
            this.updateKeypointTypeOptions();
        }
    }

    // 启用添加模式
    enableAddMode() {
        this.isAddMode = true;
        this.canvas.style.cursor = 'crosshair';
        this.selectorContainer.style.display = 'none';
    }

    // 禁用添加模式
    disableAddMode() {
        this.isAddMode = false;
        this.canvas.style.cursor = 'default';
        this.selectorContainer.style.display = 'none';
    }

    // 销毁编辑器
    destroy() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.ctx = null;
        this.imageElement = null;
        this.keypoints = [];
    }
}

// 导出类到全局
window.KeypointEditor = KeypointEditor;
