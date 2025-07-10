// 自定义动作管理界面类
class CustomActionManagerUI {
    constructor(customActionManager) {
        this.customActionManager = customActionManager;
        this.modal = null;
        this.isModalOpen = false;
        this.currentPreviewAction = null;
        
        this.init();
    }

    // 初始化管理界面
    init() {
        this.createModal();
    }

    // 创建管理模态对话框
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'custom-action-manager-modal';
        this.modal.style.display = 'none';
        
        this.modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content manager-modal">
                    <div class="modal-header">
                        <h2>自定义动作管理</h2>
                        <button class="modal-close" type="button">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="manager-toolbar">
                            <div class="toolbar-left">
                                <span class="actions-count">共 <span id="total-actions">0</span> 个动作</span>
                                <span class="storage-info">存储: <span id="storage-size">0 B</span></span>
                            </div>
                            <div class="toolbar-right">
                                <button class="import-btn">📁 导入</button>
                                <button class="export-btn">💾 导出</button>
                                <button class="clear-all-btn">🗑️ 清空全部</button>
                            </div>
                        </div>

                        <div class="actions-grid" id="actions-grid">
                            <div class="no-actions-message">
                                <div class="no-actions-icon">🎯</div>
                                <h3>暂无自定义动作</h3>
                                <p>点击"创建动作"开始制作您的第一个自定义动作</p>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="close-manager-btn">关闭</button>
                    </div>
                </div>
            </div>

            <!-- 预览模态框 -->
            <div class="preview-modal" style="display: none;">
                <div class="preview-overlay">
                    <div class="preview-content">
                        <div class="preview-header">
                            <h3 id="preview-title">动作预览</h3>
                            <button class="preview-close">&times;</button>
                        </div>
                        <div class="preview-body">
                            <div class="preview-image-container">
                                <img id="preview-image" src="" alt="动作预览">
                            </div>
                            <div class="preview-info">
                                <div class="info-item">
                                    <label>动作名称:</label>
                                    <span id="preview-name"></span>
                                </div>
                                <div class="info-item">
                                    <label>描述:</label>
                                    <span id="preview-description"></span>
                                </div>
                                <div class="info-item">
                                    <label>难度等级:</label>
                                    <span id="preview-difficulty"></span>
                                </div>
                                <div class="info-item">
                                    <label>关键点数量:</label>
                                    <span id="preview-keypoints-count"></span>
                                </div>
                                <div class="info-item">
                                    <label>创建时间:</label>
                                    <span id="preview-created-at"></span>
                                </div>
                            </div>
                        </div>
                        <div class="preview-actions">
                            <button class="edit-action-btn">✏️ 编辑</button>
                            <button class="duplicate-action-btn">📋 复制</button>
                            <button class="delete-preview-btn">🗑️ 删除</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.setupEvents();
    }

    // 设置事件监听器
    setupEvents() {
        // 关闭按钮
        this.modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeManager();
        });

        this.modal.querySelector('.close-manager-btn').addEventListener('click', () => {
            this.closeManager();
        });

        // 点击遮罩关闭
        this.modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeManager();
            }
        });

        // 工具栏按钮
        this.modal.querySelector('.import-btn').addEventListener('click', () => {
            this.importActions();
        });

        this.modal.querySelector('.export-btn').addEventListener('click', () => {
            this.exportActions();
        });

        this.modal.querySelector('.clear-all-btn').addEventListener('click', () => {
            this.clearAllActions();
        });

        // 预览模态框事件
        const previewModal = this.modal.querySelector('.preview-modal');
        
        previewModal.querySelector('.preview-close').addEventListener('click', () => {
            this.closePreview();
        });

        previewModal.querySelector('.preview-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closePreview();
            }
        });

        previewModal.querySelector('.edit-action-btn').addEventListener('click', () => {
            this.editAction();
        });

        previewModal.querySelector('.duplicate-action-btn').addEventListener('click', () => {
            this.duplicateAction();
        });

        previewModal.querySelector('.delete-preview-btn').addEventListener('click', () => {
            this.deleteActionFromPreview();
        });
    }

    // 打开管理界面
    openManager() {
        this.isModalOpen = true;
        this.modal.style.display = 'block';
        this.refreshActionsList();
        this.updateStorageInfo();
        document.body.style.overflow = 'hidden';
    }

    // 关闭管理界面
    closeManager() {
        this.isModalOpen = false;
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        this.closePreview();
    }

    // 刷新动作列表
    refreshActionsList() {
        const grid = this.modal.querySelector('#actions-grid');
        const actions = this.customActionManager.getAllActions();

        if (actions.length === 0) {
            grid.innerHTML = `
                <div class="no-actions-message">
                    <div class="no-actions-icon">🎯</div>
                    <h3>暂无自定义动作</h3>
                    <p>点击"创建动作"开始制作您的第一个自定义动作</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = actions.map(action => `
            <div class="action-card" data-action-id="${action.id}">
                <div class="action-preview">
                    ${action.referenceImage ? 
                        `<img src="${action.referenceImage}" alt="${action.name}">` : 
                        '<div class="no-image">📷</div>'
                    }
                </div>
                <div class="action-details">
                    <h4 class="action-title">${action.name}</h4>
                    <p class="action-desc">${action.description || '无描述'}</p>
                    <div class="action-stats">
                        <span class="difficulty">难度: ${action.difficulty}/5</span>
                        <span class="keypoints">关键点: ${action.keypoints.length}</span>
                    </div>
                </div>
                <div class="action-card-controls">
                    <button class="preview-btn" data-action-id="${action.id}">👁️ 预览</button>
                    <button class="quick-delete-btn" data-action-id="${action.id}">🗑️</button>
                </div>
            </div>
        `).join('');

        // 添加事件监听器
        grid.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const actionId = e.target.dataset.actionId;
                this.previewAction(actionId);
            });
        });

        grid.querySelectorAll('.quick-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const actionId = e.target.dataset.actionId;
                this.quickDeleteAction(actionId);
            });
        });

        // 更新计数
        this.modal.querySelector('#total-actions').textContent = actions.length;
    }

    // 更新存储信息
    updateStorageInfo() {
        const info = this.customActionManager.getStorageInfo();
        this.modal.querySelector('#storage-size').textContent = info.storageSizeFormatted;
    }

    // 预览动作
    previewAction(actionId) {
        const action = this.customActionManager.getAction(actionId);
        if (!action) return;

        this.currentPreviewAction = action;
        const previewModal = this.modal.querySelector('.preview-modal');

        // 填充预览信息
        this.modal.querySelector('#preview-title').textContent = action.name;
        this.modal.querySelector('#preview-name').textContent = action.name;
        this.modal.querySelector('#preview-description').textContent = action.description || '无描述';
        this.modal.querySelector('#preview-difficulty').textContent = `${action.difficulty}/5`;
        this.modal.querySelector('#preview-keypoints-count').textContent = action.keypoints.length;
        this.modal.querySelector('#preview-created-at').textContent = new Date(action.createdAt).toLocaleString();

        // 设置预览图片
        const previewImage = this.modal.querySelector('#preview-image');
        if (action.referenceImage) {
            previewImage.src = action.referenceImage;
            previewImage.style.display = 'block';
        } else {
            previewImage.style.display = 'none';
        }

        previewModal.style.display = 'block';
    }

    // 关闭预览
    closePreview() {
        this.modal.querySelector('.preview-modal').style.display = 'none';
        this.currentPreviewAction = null;
    }

    // 快速删除动作
    quickDeleteAction(actionId) {
        const action = this.customActionManager.getAction(actionId);
        if (!action) return;

        if (confirm(`确定要删除动作 "${action.name}" 吗？`)) {
            const result = this.customActionManager.deleteAction(actionId);
            if (result.success) {
                this.refreshActionsList();
                this.updateStorageInfo();
                console.log('动作已删除:', action.name);
            } else {
                alert('删除失败: ' + result.error);
            }
        }
    }

    // 从预览中删除动作
    deleteActionFromPreview() {
        if (!this.currentPreviewAction) return;

        if (confirm(`确定要删除动作 "${this.currentPreviewAction.name}" 吗？`)) {
            const result = this.customActionManager.deleteAction(this.currentPreviewAction.id);
            if (result.success) {
                this.closePreview();
                this.refreshActionsList();
                this.updateStorageInfo();
                console.log('动作已删除:', this.currentPreviewAction.name);
            } else {
                alert('删除失败: ' + result.error);
            }
        }
    }

    // 编辑动作
    editAction() {
        if (!this.currentPreviewAction) return;
        
        // TODO: 实现编辑功能
        alert('编辑功能正在开发中...');
    }

    // 复制动作
    duplicateAction() {
        if (!this.currentPreviewAction) return;
        
        const newAction = {
            ...this.currentPreviewAction,
            name: this.currentPreviewAction.name + ' (副本)',
            id: undefined // 让系统生成新ID
        };

        const result = this.customActionManager.createAction(newAction);
        if (result.success) {
            this.closePreview();
            this.refreshActionsList();
            this.updateStorageInfo();
            console.log('动作已复制:', result.action.name);
        } else {
            alert('复制失败: ' + result.error);
        }
    }

    // 导入动作
    importActions() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const result = await this.customActionManager.importActions(file);
                if (result.success) {
                    this.refreshActionsList();
                    this.updateStorageInfo();
                    alert(`导入成功！共导入 ${result.importCount} 个动作${result.errorCount > 0 ? `，跳过 ${result.errorCount} 个无效动作` : ''}`);
                } else {
                    alert('导入失败: ' + result.error);
                }
            } catch (error) {
                alert('导入失败: ' + error.message);
            }
        };

        input.click();
    }

    // 导出动作
    exportActions() {
        const result = this.customActionManager.exportActions();
        if (result.success) {
            console.log('动作导出成功');
        } else {
            alert('导出失败: ' + result.error);
        }
    }

    // 清空所有动作
    clearAllActions() {
        const actions = this.customActionManager.getAllActions();
        if (actions.length === 0) {
            alert('没有动作需要清空');
            return;
        }

        if (confirm(`确定要清空所有 ${actions.length} 个自定义动作吗？此操作不可撤销！`)) {
            const result = this.customActionManager.clearAllActions();
            if (result.success) {
                this.refreshActionsList();
                this.updateStorageInfo();
                console.log('所有动作已清空');
            } else {
                alert('清空失败: ' + result.error);
            }
        }
    }
}

// 导出类到全局
window.CustomActionManagerUI = CustomActionManagerUI;
