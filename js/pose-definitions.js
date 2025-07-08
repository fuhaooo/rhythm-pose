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
            },

            // 新增动作：超人式
            superman: {
                name: "超人式",
                description: "俯卧，同时抬起胸部、手臂和腿部，模仿超人飞行姿势",
                instructions: [
                    "1. 俯卧在地面上，面朝下",
                    "2. 双臂向前伸直",
                    "3. 同时抬起胸部、手臂和双腿",
                    "4. 保持身体呈弓形",
                    "5. 保持姿势15-30秒"
                ],
                keyPoints: {
                    torso: {
                        lift: { minHeight: 10 }, // 胸部离地至少10cm
                        arch: { maxAngle: 45 }   // 身体弓形不超过45度
                    },
                    arms: {
                        extension: { minAngle: 160 },
                        height: { minLift: 15 }
                    },
                    legs: {
                        lift: { minHeight: 15 },
                        straightness: { minAngle: 160 }
                    }
                },
                duration: 20,
                difficulty: 3
            },

            // 新增动作：侧平板支撑
            "side-plank": {
                name: "侧平板支撑",
                description: "侧卧，用一只手臂支撑身体，保持身体成一条直线",
                instructions: [
                    "1. 侧卧，用右肘支撑身体",
                    "2. 双腿伸直，脚叠放",
                    "3. 抬起髋部，身体成一条直线",
                    "4. 左臂可向上伸展",
                    "5. 保持姿势30秒，换边重复"
                ],
                keyPoints: {
                    support: {
                        elbow: { stability: true },
                        forearm: { contact: true }
                    },
                    alignment: {
                        body: { straightness: true },
                        hip: { lift: true }
                    },
                    balance: {
                        core: { engagement: true },
                        stability: { maxSway: 5 }
                    }
                },
                duration: 30,
                difficulty: 4
            },

            // 新增动作：弓式
            bow: {
                name: "弓式",
                description: "俯卧，抓住脚踝，身体呈弓形",
                instructions: [
                    "1. 俯卧，下巴贴地",
                    "2. 弯曲膝盖，双手抓住脚踝",
                    "3. 吸气，抬起胸部和大腿",
                    "4. 身体呈弓形，重心在腹部",
                    "5. 保持姿势20-30秒"
                ],
                keyPoints: {
                    grip: {
                        hands: { position: "ankles" },
                        hold: { secure: true }
                    },
                    arch: {
                        chest: { lift: true },
                        thighs: { lift: true },
                        curve: { balanced: true }
                    },
                    balance: {
                        core: { center: "abdomen" },
                        stability: { maintained: true }
                    }
                },
                duration: 25,
                difficulty: 4
            },

            // 新增动作：鹰式
            eagle: {
                name: "鹰式",
                description: "单腿站立，另一腿缠绕，双臂交叉缠绕",
                instructions: [
                    "1. 站立，重心放在左腿",
                    "2. 右腿缠绕左腿",
                    "3. 双臂在胸前交叉缠绕",
                    "4. 保持平衡，轻微下蹲",
                    "5. 保持姿势20-30秒"
                ],
                keyPoints: {
                    legs: {
                        standing: { stability: true },
                        wrapped: { position: "around" },
                        squat: { depth: "slight" }
                    },
                    arms: {
                        cross: { position: "chest" },
                        wrap: { intertwined: true },
                        balance: { maintained: true }
                    },
                    focus: {
                        gaze: { fixed: true },
                        concentration: { required: true }
                    }
                },
                duration: 25,
                difficulty: 4
            },

            // 新增动作：舞者式
            dancer: {
                name: "舞者式",
                description: "单腿站立，后腿向上抬起，同侧手抓脚，前臂向前伸展",
                instructions: [
                    "1. 站立，重心放在左腿",
                    "2. 右腿向后弯曲，右手抓住右脚",
                    "3. 左臂向前伸展保持平衡",
                    "4. 慢慢抬高右腿，身体前倾",
                    "5. 保持姿势15-25秒"
                ],
                keyPoints: {
                    balance: {
                        standing: { leg: "stable" },
                        core: { engaged: true }
                    },
                    extension: {
                        lifted: { leg: "high" },
                        front: { arm: "forward" },
                        back: { arch: "graceful" }
                    },
                    grip: {
                        hand: { position: "foot" },
                        secure: { hold: true }
                    }
                },
                duration: 20,
                difficulty: 5
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

    // 瑜伽动作识别算法
    recognizeYogaPose(keypoints) {
        if (!keypoints || keypoints.length === 0) {
            return { name: '未检测到动作', confidence: 0, feedback: '请确保全身在摄像头视野内' };
        }

        const poses = [
            this.checkMountainPose(keypoints),
            this.checkTreePose(keypoints),
            this.checkWarrior1Pose(keypoints),
            this.checkDownwardDogPose(keypoints),
            this.checkPlankPose(keypoints)
        ];

        // 找到置信度最高的动作
        const bestPose = poses.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
        );

        return bestPose.confidence > 0.6 ? bestPose :
            { name: '未识别动作', confidence: 0, feedback: '请尝试标准的瑜伽动作' };
    }

    // 获取关键点坐标的辅助函数
    getKeypointForYoga(keypoints, name) {
        // 支持ml5.js格式的关键点
        const kp = keypoints.find(k => k.part === name || k.name === name);
        return kp && kp.score > 0.3 ? {
            x: kp.position ? kp.position.x : kp.x,
            y: kp.position ? kp.position.y : kp.y,
            score: kp.score
        } : null;
    }

    // 山式检测
    checkMountainPose(keypoints) {
        const leftShoulder = this.getKeypointForYoga(keypoints, 'leftShoulder') || this.getKeypointForYoga(keypoints, 'left_shoulder');
        const rightShoulder = this.getKeypointForYoga(keypoints, 'rightShoulder') || this.getKeypointForYoga(keypoints, 'right_shoulder');
        const leftHip = this.getKeypointForYoga(keypoints, 'leftHip') || this.getKeypointForYoga(keypoints, 'left_hip');
        const rightHip = this.getKeypointForYoga(keypoints, 'rightHip') || this.getKeypointForYoga(keypoints, 'right_hip');
        const leftAnkle = this.getKeypointForYoga(keypoints, 'leftAnkle') || this.getKeypointForYoga(keypoints, 'left_ankle');
        const rightAnkle = this.getKeypointForYoga(keypoints, 'rightAnkle') || this.getKeypointForYoga(keypoints, 'right_ankle');

        if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftAnkle || !rightAnkle) {
            return { name: '山式', confidence: 0, feedback: '无法检测到完整身体' };
        }

        let confidence = 0;
        let feedback = [];

        // 检查身体直立
        const shoulderLevel = Math.abs(leftShoulder.y - rightShoulder.y);
        const hipLevel = Math.abs(leftHip.y - rightHip.y);
        const ankleLevel = Math.abs(leftAnkle.y - rightAnkle.y);

        if (shoulderLevel < 30 && hipLevel < 30 && ankleLevel < 30) {
            confidence += 0.4;
            feedback.push('身体保持直立');
        } else {
            feedback.push('请保持身体直立，肩膀和臀部水平');
        }

        // 检查双脚并拢
        const feetDistance = this.calculateDistance(leftAnkle, rightAnkle);
        if (feetDistance < 50) {
            confidence += 0.3;
            feedback.push('双脚并拢良好');
        } else {
            feedback.push('请将双脚并拢');
        }

        // 检查手臂自然下垂
        const leftArmAngle = Math.abs(leftShoulder.x - leftHip.x);
        const rightArmAngle = Math.abs(rightShoulder.x - rightHip.x);
        if (leftArmAngle < 40 && rightArmAngle < 40) {
            confidence += 0.3;
            feedback.push('手臂自然下垂');
        } else {
            feedback.push('让手臂自然下垂在身体两侧');
        }

        return {
            name: '山式 (Mountain Pose)',
            confidence: confidence,
            feedback: feedback.join('; ')
        };
    }

    // 树式检测
    checkTreePose(keypoints) {
        const leftAnkle = this.getKeypointForYoga(keypoints, 'leftAnkle') || this.getKeypointForYoga(keypoints, 'left_ankle');
        const rightAnkle = this.getKeypointForYoga(keypoints, 'rightAnkle') || this.getKeypointForYoga(keypoints, 'right_ankle');
        const leftKnee = this.getKeypointForYoga(keypoints, 'leftKnee') || this.getKeypointForYoga(keypoints, 'left_knee');
        const rightKnee = this.getKeypointForYoga(keypoints, 'rightKnee') || this.getKeypointForYoga(keypoints, 'right_knee');
        const leftWrist = this.getKeypointForYoga(keypoints, 'leftWrist') || this.getKeypointForYoga(keypoints, 'left_wrist');
        const rightWrist = this.getKeypointForYoga(keypoints, 'rightWrist') || this.getKeypointForYoga(keypoints, 'right_wrist');
        const nose = this.getKeypointForYoga(keypoints, 'nose');

        if (!leftAnkle || !rightAnkle || !leftKnee || !rightKnee) {
            return { name: '树式', confidence: 0, feedback: '无法检测到腿部关键点' };
        }

        let confidence = 0;
        let feedback = [];

        // 检查单腿站立
        const leftLegStraight = Math.abs(leftAnkle.x - leftKnee.x) < 30;
        const rightLegBent = Math.abs(rightKnee.x - leftKnee.x) > 50;

        if (leftLegStraight && rightLegBent) {
            confidence += 0.5;
            feedback.push('单腿站立姿势良好');
        } else {
            feedback.push('一条腿站立，另一条腿弯曲');
        }

        // 检查手臂上举
        if (leftWrist && rightWrist && nose) {
            if (leftWrist.y < nose.y && rightWrist.y < nose.y) {
                confidence += 0.3;
                feedback.push('手臂上举良好');
            } else {
                feedback.push('将双臂举过头顶');
            }
        }

        return {
            name: '树式 (Tree Pose)',
            confidence: confidence,
            feedback: feedback.join('; ')
        };
    }

    // 战士一式检测
    checkWarrior1Pose(keypoints) {
        const leftKnee = this.getKeypointForYoga(keypoints, 'leftKnee') || this.getKeypointForYoga(keypoints, 'left_knee');
        const rightKnee = this.getKeypointForYoga(keypoints, 'rightKnee') || this.getKeypointForYoga(keypoints, 'right_knee');
        const leftAnkle = this.getKeypointForYoga(keypoints, 'leftAnkle') || this.getKeypointForYoga(keypoints, 'left_ankle');
        const rightAnkle = this.getKeypointForYoga(keypoints, 'rightAnkle') || this.getKeypointForYoga(keypoints, 'right_ankle');
        const leftWrist = this.getKeypointForYoga(keypoints, 'leftWrist') || this.getKeypointForYoga(keypoints, 'left_wrist');
        const rightWrist = this.getKeypointForYoga(keypoints, 'rightWrist') || this.getKeypointForYoga(keypoints, 'right_wrist');
        const nose = this.getKeypointForYoga(keypoints, 'nose');

        if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
            return { name: '战士一式', confidence: 0, feedback: '无法检测到腿部关键点' };
        }

        let confidence = 0;
        let feedback = [];

        // 检查弓步姿势
        const frontLegBent = Math.abs(leftKnee.y - leftAnkle.y) < Math.abs(rightKnee.y - rightAnkle.y);
        const backLegStraight = Math.abs(rightKnee.y - rightAnkle.y) > 100;

        if (frontLegBent && backLegStraight) {
            confidence += 0.5;
            feedback.push('弓步姿势正确');
        } else {
            feedback.push('前腿弯曲，后腿伸直');
        }

        // 检查手臂上举
        if (leftWrist && rightWrist && nose) {
            if (leftWrist.y < nose.y && rightWrist.y < nose.y) {
                confidence += 0.3;
                feedback.push('手臂上举良好');
            } else {
                feedback.push('将双臂举过头顶');
            }
        }

        return {
            name: '战士一式 (Warrior I)',
            confidence: confidence,
            feedback: feedback.join('; ')
        };
    }

    // 下犬式检测
    checkDownwardDogPose(keypoints) {
        const leftWrist = this.getKeypointForYoga(keypoints, 'leftWrist') || this.getKeypointForYoga(keypoints, 'left_wrist');
        const rightWrist = this.getKeypointForYoga(keypoints, 'rightWrist') || this.getKeypointForYoga(keypoints, 'right_wrist');
        const leftAnkle = this.getKeypointForYoga(keypoints, 'leftAnkle') || this.getKeypointForYoga(keypoints, 'left_ankle');
        const rightAnkle = this.getKeypointForYoga(keypoints, 'rightAnkle') || this.getKeypointForYoga(keypoints, 'right_ankle');
        const leftHip = this.getKeypointForYoga(keypoints, 'leftHip') || this.getKeypointForYoga(keypoints, 'left_hip');
        const rightHip = this.getKeypointForYoga(keypoints, 'rightHip') || this.getKeypointForYoga(keypoints, 'right_hip');

        if (!leftWrist || !rightWrist || !leftAnkle || !rightAnkle || !leftHip || !rightHip) {
            return { name: '下犬式', confidence: 0, feedback: '无法检测到完整身体' };
        }

        let confidence = 0;
        let feedback = [];

        // 检查倒V字形
        const avgHip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
        const avgWrist = { x: (leftWrist.x + rightWrist.x) / 2, y: (leftWrist.y + rightWrist.y) / 2 };
        const avgAnkle = { x: (leftAnkle.x + rightAnkle.x) / 2, y: (leftAnkle.y + rightAnkle.y) / 2 };

        if (avgHip.y < avgWrist.y && avgHip.y < avgAnkle.y) {
            confidence += 0.7;
            feedback.push('倒V字形姿势正确');
        } else {
            feedback.push('臀部应该是身体最高点');
        }

        return {
            name: '下犬式 (Downward Dog)',
            confidence: confidence,
            feedback: feedback.join('; ')
        };
    }

    // 平板支撑检测
    checkPlankPose(keypoints) {
        const leftShoulder = this.getKeypointForYoga(keypoints, 'leftShoulder') || this.getKeypointForYoga(keypoints, 'left_shoulder');
        const rightShoulder = this.getKeypointForYoga(keypoints, 'rightShoulder') || this.getKeypointForYoga(keypoints, 'right_shoulder');
        const leftHip = this.getKeypointForYoga(keypoints, 'leftHip') || this.getKeypointForYoga(keypoints, 'left_hip');
        const rightHip = this.getKeypointForYoga(keypoints, 'rightHip') || this.getKeypointForYoga(keypoints, 'right_hip');
        const leftAnkle = this.getKeypointForYoga(keypoints, 'leftAnkle') || this.getKeypointForYoga(keypoints, 'left_ankle');
        const rightAnkle = this.getKeypointForYoga(keypoints, 'rightAnkle') || this.getKeypointForYoga(keypoints, 'right_ankle');

        if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftAnkle || !rightAnkle) {
            return { name: '平板支撑', confidence: 0, feedback: '无法检测到完整身体' };
        }

        let confidence = 0;
        let feedback = [];

        // 检查身体成一条直线
        const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
        const hipY = (leftHip.y + rightHip.y) / 2;
        const ankleY = (leftAnkle.y + rightAnkle.y) / 2;

        const bodyAlignment = Math.abs(shoulderY - hipY) + Math.abs(hipY - ankleY);
        if (bodyAlignment < 50) {
            confidence += 0.6;
            feedback.push('身体保持一条直线');
        } else {
            feedback.push('保持身体成一条直线');
        }

        return {
            name: '平板支撑 (Plank)',
            confidence: confidence,
            feedback: feedback.join('; ')
        };
    }
}

// 导出类供其他文件使用
window.PoseDefinitions = PoseDefinitions;
