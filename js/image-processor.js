// 图片处理器类
class ImageProcessor {
    constructor(poseDetector) {
        this.poseDetector = poseDetector;
        this.supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.maxImageSize = { width: 1920, height: 1080 };
    }

    // 验证图片文件
    validateImageFile(file) {
        const errors = [];

        // 检查文件类型
        if (!this.supportedFormats.includes(file.type)) {
            errors.push(`不支持的文件格式: ${file.type}。支持的格式: ${this.supportedFormats.join(', ')}`);
        }

        // 检查文件大小
        if (file.size > this.maxFileSize) {
            errors.push(`文件过大: ${this.formatBytes(file.size)}。最大支持: ${this.formatBytes(this.maxFileSize)}`);
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // 加载图片文件
    async loadImageFile(file) {
        try {
            // 验证文件
            const validation = this.validateImageFile(file);
            if (!validation.valid) {
                throw new Error(validation.errors.join('; '));
            }

            console.log('开始加载图片文件:', file.name);

            // 读取文件为DataURL
            const dataUrl = await this.readFileAsDataURL(file);

            // 创建图片元素
            const imageElement = await this.createImageElement(dataUrl);

            // 检查图片尺寸
            const sizeCheck = this.checkImageSize(imageElement);
            if (!sizeCheck.valid) {
                console.warn('图片尺寸警告:', sizeCheck.message);
            }

            // 如果图片过大，进行压缩
            let processedDataUrl = dataUrl;
            if (sizeCheck.needsResize) {
                processedDataUrl = await this.resizeImage(imageElement, sizeCheck.targetSize);
                // 重新创建图片元素
                const resizedImage = await this.createImageElement(processedDataUrl);
                return {
                    success: true,
                    imageElement: resizedImage,
                    dataUrl: processedDataUrl,
                    originalSize: { width: imageElement.width, height: imageElement.height },
                    processedSize: { width: resizedImage.width, height: resizedImage.height },
                    fileInfo: {
                        name: file.name,
                        size: file.size,
                        type: file.type
                    }
                };
            }

            return {
                success: true,
                imageElement: imageElement,
                dataUrl: dataUrl,
                originalSize: { width: imageElement.width, height: imageElement.height },
                fileInfo: {
                    name: file.name,
                    size: file.size,
                    type: file.type
                }
            };

        } catch (error) {
            console.error('加载图片文件失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 读取文件为DataURL
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('文件读取失败'));
            reader.readAsDataURL(file);
        });
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

    // 检查图片尺寸
    checkImageSize(imageElement) {
        const { width, height } = imageElement;
        const maxWidth = this.maxImageSize.width;
        const maxHeight = this.maxImageSize.height;

        if (width <= maxWidth && height <= maxHeight) {
            return { valid: true, needsResize: false };
        }

        // 计算缩放比例
        const scaleX = maxWidth / width;
        const scaleY = maxHeight / height;
        const scale = Math.min(scaleX, scaleY);

        const targetWidth = Math.round(width * scale);
        const targetHeight = Math.round(height * scale);

        return {
            valid: false,
            needsResize: true,
            message: `图片尺寸 ${width}x${height} 超过限制 ${maxWidth}x${maxHeight}，将调整为 ${targetWidth}x${targetHeight}`,
            targetSize: { width: targetWidth, height: targetHeight }
        };
    }

    // 压缩/调整图片尺寸
    async resizeImage(imageElement, targetSize) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = targetSize.width;
            canvas.height = targetSize.height;

            // 绘制调整后的图片
            ctx.drawImage(imageElement, 0, 0, targetSize.width, targetSize.height);

            // 转换为DataURL
            const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(resizedDataUrl);
        });
    }

    // 对图片进行姿态检测
    async detectPoseInImage(imageElement) {
        try {
            if (!this.poseDetector) {
                throw new Error('姿态检测器未初始化');
            }

            console.log('开始对图片进行姿态检测...');
            
            // 调用姿态检测器的图片检测方法
            const result = await this.poseDetector.detectPoseInImage(imageElement);
            
            if (result.success) {
                console.log('图片姿态检测成功，关键点数量:', result.keypoints.length);
            } else {
                console.warn('图片姿态检测失败:', result.error);
            }

            return result;

        } catch (error) {
            console.error('图片姿态检测失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 处理图片并检测姿态（完整流程）
    async processImageFile(file) {
        try {
            // 加载图片
            const loadResult = await this.loadImageFile(file);
            if (!loadResult.success) {
                return loadResult;
            }

            // 检测姿态
            const poseResult = await this.detectPoseInImage(loadResult.imageElement);

            return {
                success: true,
                imageData: {
                    element: loadResult.imageElement,
                    dataUrl: loadResult.dataUrl,
                    originalSize: loadResult.originalSize,
                    processedSize: loadResult.processedSize,
                    fileInfo: loadResult.fileInfo
                },
                poseData: poseResult
            };

        } catch (error) {
            console.error('处理图片文件失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 创建图片预览元素
    createImagePreview(dataUrl, container) {
        try {
            // 清空容器
            container.innerHTML = '';

            // 创建图片元素
            const img = document.createElement('img');
            img.src = dataUrl;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '400px';
            img.style.objectFit = 'contain';
            img.style.border = '1px solid #ddd';
            img.style.borderRadius = '8px';

            container.appendChild(img);

            return img;

        } catch (error) {
            console.error('创建图片预览失败:', error);
            return null;
        }
    }



    // 获取支持的文件格式
    getSupportedFormats() {
        return [...this.supportedFormats];
    }

    // 获取最大文件大小
    getMaxFileSize() {
        return this.maxFileSize;
    }

    // 获取最大图片尺寸
    getMaxImageSize() {
        return { ...this.maxImageSize };
    }

    // 格式化字节大小
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 导出类到全局
window.ImageProcessor = ImageProcessor;
