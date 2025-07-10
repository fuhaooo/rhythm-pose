// 自定义动作管理器类
class CustomActionManager {
    constructor() {
        this.storageKey = 'rhythm_pose_custom_actions';
        this.actions = new Map();
        this.loadActions();
    }

    // 从本地存储加载自定义动作
    loadActions() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const actionsData = JSON.parse(stored);
                this.actions.clear();
                
                // 验证并加载每个动作
                for (const [id, actionData] of Object.entries(actionsData)) {
                    if (this.validateActionData(actionData)) {
                        this.actions.set(id, actionData);
                    } else {
                        console.warn('无效的自定义动作数据:', id);
                    }
                }
                
                console.log(`已加载 ${this.actions.size} 个自定义动作`);
            }
        } catch (error) {
            console.error('加载自定义动作失败:', error);
            this.actions.clear();
        }
    }

    // 保存动作到本地存储
    saveActions() {
        try {
            const actionsData = Object.fromEntries(this.actions);
            localStorage.setItem(this.storageKey, JSON.stringify(actionsData));
            console.log('自定义动作已保存');
            return true;
        } catch (error) {
            console.error('保存自定义动作失败:', error);
            return false;
        }
    }

    // 验证动作数据格式
    validateActionData(actionData) {
        if (!actionData || typeof actionData !== 'object') {
            return false;
        }

        const required = ['id', 'name', 'keypoints', 'createdAt'];
        for (const field of required) {
            if (!actionData[field]) {
                return false;
            }
        }

        // 验证关键点数据
        if (!Array.isArray(actionData.keypoints) || actionData.keypoints.length === 0) {
            return false;
        }

        // 验证关键点格式
        for (const keypoint of actionData.keypoints) {
            if (!keypoint.name || typeof keypoint.x !== 'number' || typeof keypoint.y !== 'number') {
                return false;
            }
        }

        return true;
    }

    // 创建新的自定义动作
    createAction(actionData) {
        try {
            // 生成唯一ID
            const id = this.generateActionId();
            
            // 创建完整的动作对象
            const action = {
                id: id,
                name: actionData.name || '未命名动作',
                description: actionData.description || '',
                category: 'custom',
                difficulty: actionData.difficulty || 1,
                keypoints: actionData.keypoints || [],
                referenceImage: actionData.referenceImage || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 验证数据
            if (!this.validateActionData(action)) {
                throw new Error('动作数据格式无效');
            }

            // 保存到内存和本地存储
            this.actions.set(id, action);
            this.saveActions();

            console.log('创建自定义动作成功:', action.name);
            return { success: true, action: action };

        } catch (error) {
            console.error('创建自定义动作失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 更新现有动作
    updateAction(id, updates) {
        try {
            if (!this.actions.has(id)) {
                throw new Error('动作不存在');
            }

            const action = { ...this.actions.get(id) };
            
            // 更新字段
            Object.assign(action, updates);
            action.updatedAt = new Date().toISOString();

            // 验证更新后的数据
            if (!this.validateActionData(action)) {
                throw new Error('更新后的动作数据格式无效');
            }

            // 保存更新
            this.actions.set(id, action);
            this.saveActions();

            console.log('更新自定义动作成功:', action.name);
            return { success: true, action: action };

        } catch (error) {
            console.error('更新自定义动作失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 删除动作
    deleteAction(id) {
        try {
            if (!this.actions.has(id)) {
                throw new Error('动作不存在');
            }

            const action = this.actions.get(id);
            this.actions.delete(id);
            this.saveActions();

            console.log('删除自定义动作成功:', action.name);
            return { success: true };

        } catch (error) {
            console.error('删除自定义动作失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取单个动作
    getAction(id) {
        return this.actions.get(id) || null;
    }

    // 获取所有自定义动作
    getAllActions() {
        return Array.from(this.actions.values());
    }

    // 获取动作列表（简化信息）
    getActionsList() {
        return Array.from(this.actions.values()).map(action => ({
            id: action.id,
            name: action.name,
            description: action.description,
            difficulty: action.difficulty,
            createdAt: action.createdAt
        }));
    }

    // 生成唯一动作ID
    generateActionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `custom_${timestamp}_${random}`;
    }

    // 导出所有自定义动作
    exportActions() {
        try {
            const data = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                actions: Object.fromEntries(this.actions)
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rhythm_pose_custom_actions_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            console.error('导出自定义动作失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 导入自定义动作
    async importActions(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.actions || typeof data.actions !== 'object') {
                throw new Error('无效的导入文件格式');
            }

            let importCount = 0;
            let errorCount = 0;

            for (const [id, actionData] of Object.entries(data.actions)) {
                if (this.validateActionData(actionData)) {
                    // 生成新的ID避免冲突
                    const newId = this.generateActionId();
                    actionData.id = newId;
                    actionData.updatedAt = new Date().toISOString();
                    
                    this.actions.set(newId, actionData);
                    importCount++;
                } else {
                    errorCount++;
                    console.warn('跳过无效的动作数据:', id);
                }
            }

            this.saveActions();

            return {
                success: true,
                importCount: importCount,
                errorCount: errorCount
            };

        } catch (error) {
            console.error('导入自定义动作失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 清空所有自定义动作
    clearAllActions() {
        try {
            this.actions.clear();
            localStorage.removeItem(this.storageKey);
            console.log('已清空所有自定义动作');
            return { success: true };
        } catch (error) {
            console.error('清空自定义动作失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取存储使用情况
    getStorageInfo() {
        try {
            const data = localStorage.getItem(this.storageKey);
            const size = data ? new Blob([data]).size : 0;
            
            return {
                actionCount: this.actions.size,
                storageSize: size,
                storageSizeFormatted: this.formatBytes(size)
            };
        } catch (error) {
            return {
                actionCount: 0,
                storageSize: 0,
                storageSizeFormatted: '0 B'
            };
        }
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
window.CustomActionManager = CustomActionManager;
