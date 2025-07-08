// 动作定义和标准姿态数据
class PoseDefinitions {
    constructor() {
        this.poses = {
            tree: {
                name: "树式 (瑜伽)",
                description: "单腿站立，另一腿弯曲放在支撑腿上，双手合十举过头顶",
                instructions: [
                    "1. 双脚并拢站立，重心放在左脚",
                    "2. 右脚弯曲，脚掌贴在左腿内侧",
                    "3. 双手合十，慢慢举过头顶",
                    "4. 保持平衡，目视前方",
                    "5. 保持姿势30秒以上"
                ],
                keyPoints: {
                    // 支撑腿应该直立
                    supportLeg: {
                        knee: { minAngle: 160, maxAngle: 180 },
                        ankle: { stability: true }
                    },
                    // 弯曲腿的位置
                    bentLeg: {
                        knee: { minAngle: 45, maxAngle: 90 },
                        hip: { minAngle: 45, maxAngle: 90 }
                    },
                    // 手臂位置
                    arms: {
                        shoulder: { minAngle: 160, maxAngle: 180 },
                        elbow: { minAngle: 160, maxAngle: 180 }
                    },
                    // 身体平衡
                    balance: {
                        torso: { maxTilt: 15 }, // 躯干倾斜不超过15度
                        head: { alignment: true }
                    }
                },
                duration: 30, // 最少保持30秒
                difficulty: 3 // 难度等级 1-5
            },

            warrior: {
                name: "战士式 (瑜伽)",
                description: "前腿弯曲，后腿伸直，双臂向上伸展",
                instructions: [
                    "1. 双脚分开约一腿长的距离",
                    "2. 右脚向前，左脚向后",
                    "3. 右腿弯曲成90度，左腿伸直",
                    "4. 双臂向上伸展，掌心相对",
                    "5. 保持姿势30秒"
                ],
                keyPoints: {
                    frontLeg: {
                        knee: { minAngle: 80, maxAngle: 100 },
                        thigh: { parallel: true } // 大腿与地面平行
                    },
                    backLeg: {
                        knee: { minAngle: 160, maxAngle: 180 },
                        foot: { grounded: true }
                    },
                    arms: {
                        shoulder: { minAngle: 160, maxAngle: 180 },
                        alignment: { vertical: true }
                    },
                    torso: {
                        upright: true,
                        maxTilt: 10
                    }
                },
                duration: 30,
                difficulty: 4
            },

            plank: {
                name: "平板支撑",
                description: "俯卧撑起始位置，身体保持一条直线",
                instructions: [
                    "1. 俯卧，双手撑地，与肩同宽",
                    "2. 脚尖着地，身体呈一条直线",
                    "3. 收紧核心肌群",
                    "4. 保持自然呼吸",
                    "5. 坚持30秒以上"
                ],
                keyPoints: {
                    arms: {
                        elbow: { minAngle: 160, maxAngle: 180 },
                        shoulder: { alignment: true }
                    },
                    body: {
                        spine: { straight: true },
                        hips: { level: true },
                        maxSag: 10 // 身体下沉不超过10度
                    },
                    legs: {
                        knee: { minAngle: 160, maxAngle: 180 },
                        feet: { together: true }
                    }
                },
                duration: 30,
                difficulty: 3
            },

            squat: {
                name: "深蹲",
                description: "双脚分开，下蹲至大腿与地面平行",
                instructions: [
                    "1. 双脚分开与肩同宽",
                    "2. 脚尖略向外",
                    "3. 慢慢下蹲，膝盖不超过脚尖",
                    "4. 大腿与地面平行",
                    "5. 保持3秒后起立"
                ],
                keyPoints: {
                    legs: {
                        knee: { minAngle: 80, maxAngle: 100 },
                        thigh: { parallel: true },
                        kneeAlignment: true // 膝盖不内扣
                    },
                    torso: {
                        upright: true,
                        maxTilt: 20
                    },
                    feet: {
                        flat: true, // 脚掌贴地
                        width: { shoulderWidth: true }
                    }
                },
                duration: 3,
                difficulty: 2
            },

            "jumping-jacks": {
                name: "开合跳",
                description: "跳跃时双腿分开，双臂上举，然后回到起始位置",
                instructions: [
                    "1. 双脚并拢，双臂自然下垂",
                    "2. 跳跃时双腿分开",
                    "3. 同时双臂向上举过头顶",
                    "4. 再次跳跃回到起始位置",
                    "5. 重复动作，保持节奏"
                ],
                keyPoints: {
                    // 开合跳是动态动作，需要检测动作的完整性
                    motion: {
                        legSeparation: { minWidth: 60 }, // 腿部分开角度
                        armRaise: { minAngle: 160 }, // 手臂上举角度
                        rhythm: { consistent: true }, // 节奏一致性
                        landing: { soft: true } // 落地缓冲
                    },
                    cycle: {
                        complete: true, // 完整的开合动作
                        minReps: 10 // 最少10次
                    }
                },
                duration: 20, // 20秒内完成
                difficulty: 2
            }
        };
    }

    // 获取指定动作的定义
    getPose(poseKey) {
        return this.poses[poseKey] || null;
    }

    // 获取所有动作列表
    getAllPoses() {
        return Object.keys(this.poses).map(key => ({
            key: key,
            name: this.poses[key].name,
            difficulty: this.poses[key].difficulty
        }));
    }

    // 获取动作指导文本
    getInstructions(poseKey) {
        const pose = this.getPose(poseKey);
        return pose ? pose.instructions.join('<br>') : '';
    }

    // 计算角度（用于姿态分析）
    calculateAngle(point1, point2, point3) {
        // 计算三点之间的角度
        const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) - 
                       Math.atan2(point1.y - point2.y, point1.x - point2.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        if (angle > 180.0) {
            angle = 360 - angle;
        }
        return angle;
    }

    // 计算两点之间的距离
    calculateDistance(point1, point2) {
        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }

    // 检查点是否在合理范围内
    isPointValid(point, confidence = 0.5) {
        return point && point.confidence > confidence;
    }
}

// 导出类供其他文件使用
window.PoseDefinitions = PoseDefinitions;
