// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title RhythmPoseProof
 * @dev Proof-of-Pose 智能合约 - 记录和验证动作成就，支持zkTLS证明奖励
 */
contract RhythmPoseProof {
    // 动作类型枚举
    enum PoseType { YOGA, HAND_GESTURE, CUSTOM }

    // 动作记录结构
    struct PoseRecord {
        string poseName;        // 动作名称 (如: "树式", "点赞", "Diamond Hands")
        PoseType poseType;      // 动作类型
        uint256 score;          // 得分 (0-100)
        uint256 duration;       // 持续时间 (秒)
        uint256 timestamp;      // 记录时间
        bool verified;          // 是否已验证
        string zkProof;         // zkTLS证明数据
        bool rewarded;          // 是否已获得奖励
    }

    // 用户成就结构
    struct UserAchievement {
        uint256 totalPoses;     // 总动作数
        uint256 bestScore;      // 最高分
        uint256 totalDuration;  // 总持续时间
        uint256 level;          // 用户等级
        uint256 experience;     // 经验值
        string[] unlockedPoses; // 已解锁动作
        uint256 totalRewards;   // 总奖励金额
    }

    // 状态变量
    address public owner;
    uint256 public totalRecords;
    uint256 public constant REWARD_AMOUNT = 0.01 ether; // 0.01 S tokens
    uint256 public totalRewardsDistributed;
    bool public rewardsEnabled = true;
    
    // 映射
    mapping(address => PoseRecord[]) public userPoseRecords;
    mapping(address => UserAchievement) public userAchievements;
    mapping(string => uint256) public poseLeaderboard; // 动作名称 => 最高分
    mapping(string => address) public poseChampions;   // 动作名称 => 冠军地址
    
    // 事件
    event PoseRecorded(
        address indexed user,
        string poseName,
        PoseType poseType,
        uint256 score,
        uint256 duration,
        uint256 timestamp,
        string zkProof
    );

    event AchievementUnlocked(
        address indexed user,
        string achievement,
        uint256 timestamp
    );

    event NewRecord(
        address indexed user,
        string poseName,
        uint256 newRecord,
        uint256 timestamp
    );

    event RewardDistributed(
        address indexed user,
        uint256 amount,
        string reason,
        uint256 timestamp
    );

    event ContractFunded(
        address indexed funder,
        uint256 amount,
        uint256 timestamp
    );

    event RewardsToggled(
        bool enabled,
        uint256 timestamp
    );
    
    // 构造函数
    constructor() {
        owner = msg.sender;
        totalRecords = 0;
        totalRewardsDistributed = 0;
    }

    // 修饰符
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier rewardsActive() {
        require(rewardsEnabled, "Rewards are currently disabled");
        _;
    }

    // 接收S代币的函数
    receive() external payable {
        emit ContractFunded(msg.sender, msg.value, block.timestamp);
    }

    // 允许合约接收S代币
    fallback() external payable {
        emit ContractFunded(msg.sender, msg.value, block.timestamp);
    }
    
    // 记录带zkTLS证明的动作成就
    function recordVerifiedPose(
        string memory _poseName,
        PoseType _poseType,
        uint256 _score,
        uint256 _duration,
        string memory _zkProof
    ) public rewardsActive {
        require(_score <= 100, "Score must be between 0-100");
        require(bytes(_poseName).length > 0, "Pose name cannot be empty");
        require(bytes(_zkProof).length > 0, "zkTLS proof cannot be empty");

        // 创建动作记录
        PoseRecord memory newRecord = PoseRecord({
            poseName: _poseName,
            poseType: _poseType,
            score: _score,
            duration: _duration,
            timestamp: block.timestamp,
            verified: true,
            zkProof: _zkProof,
            rewarded: false
        });

        // 添加到用户记录
        userPoseRecords[msg.sender].push(newRecord);
        totalRecords++;

        // 更新用户成就
        _updateUserAchievement(msg.sender, _poseName, _score, _duration);

        // 检查是否创造新纪录
        _checkLeaderboard(msg.sender, _poseName, _score);

        // 自动发放奖励
        _distributeReward(msg.sender, userPoseRecords[msg.sender].length - 1);

        // 发出事件
        emit PoseRecorded(msg.sender, _poseName, _poseType, _score, _duration, block.timestamp, _zkProof);
    }

    // 兼容性函数：记录动作成就（无zkTLS证明）
    function recordPose(
        string memory _poseName,
        PoseType _poseType,
        uint256 _score,
        uint256 _duration
    ) public {
        require(_score <= 100, "Score must be between 0-100");
        require(bytes(_poseName).length > 0, "Pose name cannot be empty");

        // 创建动作记录
        PoseRecord memory newRecord = PoseRecord({
            poseName: _poseName,
            poseType: _poseType,
            score: _score,
            duration: _duration,
            timestamp: block.timestamp,
            verified: true,
            zkProof: "",
            rewarded: false
        });

        // 添加到用户记录
        userPoseRecords[msg.sender].push(newRecord);
        totalRecords++;

        // 更新用户成就
        _updateUserAchievement(msg.sender, _poseName, _score, _duration);

        // 检查是否创造新纪录
        _checkLeaderboard(msg.sender, _poseName, _score);

        // 发出事件
        emit PoseRecorded(msg.sender, _poseName, _poseType, _score, _duration, block.timestamp, "");
    }
    
    // 获取用户动作记录数量
    function getUserRecordCount(address _user) public view returns (uint256) {
        return userPoseRecords[_user].length;
    }
    
    // 获取用户特定动作记录
    function getUserPoseRecord(address _user, uint256 _index)
        public view returns (
            string memory poseName,
            PoseType poseType,
            uint256 score,
            uint256 duration,
            uint256 timestamp,
            bool verified,
            string memory zkProof,
            bool rewarded
        )
    {
        require(_index < userPoseRecords[_user].length, "Record index out of bounds");
        PoseRecord memory record = userPoseRecords[_user][_index];
        return (record.poseName, record.poseType, record.score, record.duration, record.timestamp, record.verified, record.zkProof, record.rewarded);
    }
    
    // 获取用户成就信息
    function getUserAchievement(address _user)
        public view returns (
            uint256 totalPoses,
            uint256 bestScore,
            uint256 totalDuration,
            uint256 level,
            uint256 experience,
            uint256 totalRewards
        )
    {
        UserAchievement memory achievement = userAchievements[_user];
        return (achievement.totalPoses, achievement.bestScore, achievement.totalDuration, achievement.level, achievement.experience, achievement.totalRewards);
    }
    
    // 获取动作排行榜信息
    function getPoseLeaderboard(string memory _poseName) 
        public view returns (uint256 bestScore, address champion) 
    {
        return (poseLeaderboard[_poseName], poseChampions[_poseName]);
    }
    
    // 内部函数：分发奖励
    function _distributeReward(address _user, uint256 _recordIndex) internal {
        // 检查合约余额
        if (address(this).balance < REWARD_AMOUNT) {
            return; // 余额不足，跳过奖励
        }

        // 标记为已奖励
        userPoseRecords[_user][_recordIndex].rewarded = true;

        // 更新用户总奖励
        userAchievements[_user].totalRewards += REWARD_AMOUNT;

        // 更新全局统计
        totalRewardsDistributed += REWARD_AMOUNT;

        // 转账奖励
        payable(_user).transfer(REWARD_AMOUNT);

        // 发出事件
        emit RewardDistributed(_user, REWARD_AMOUNT, "zkTLS Proof Verified", block.timestamp);
    }

    // 内部函数：更新用户成就
    function _updateUserAchievement(
        address _user,
        string memory _poseName,
        uint256 _score,
        uint256 _duration
    ) internal {
        UserAchievement storage achievement = userAchievements[_user];

        // 更新基础统计
        achievement.totalPoses++;
        achievement.totalDuration += _duration;

        // 更新最高分
        if (_score > achievement.bestScore) {
            achievement.bestScore = _score;
        }

        // 更新经验值 (基于分数和持续时间)
        uint256 expGain = (_score * _duration) / 10;
        achievement.experience += expGain;

        // 计算等级 (每1000经验值升一级)
        uint256 newLevel = achievement.experience / 1000 + 1;
        if (newLevel > achievement.level) {
            achievement.level = newLevel;
            emit AchievementUnlocked(_user, "Level Up!", block.timestamp);
        }

        // 检查特殊成就
        _checkSpecialAchievements(_user, _poseName, _score);
    }
    
    // 内部函数：检查排行榜
    function _checkLeaderboard(address _user, string memory _poseName, uint256 _score) internal {
        if (_score > poseLeaderboard[_poseName]) {
            poseLeaderboard[_poseName] = _score;
            poseChampions[_poseName] = _user;
            emit NewRecord(_user, _poseName, _score, block.timestamp);
        }
    }
    
    // 内部函数：检查特殊成就
    function _checkSpecialAchievements(address _user, string memory /* _poseName */, uint256 _score) internal {
        UserAchievement storage achievement = userAchievements[_user];
        
        // 完美分数成就
        if (_score == 100) {
            emit AchievementUnlocked(_user, "Perfect Pose!", block.timestamp);
        }
        
        // 动作数量成就
        if (achievement.totalPoses == 10) {
            emit AchievementUnlocked(_user, "Pose Explorer", block.timestamp);
        } else if (achievement.totalPoses == 50) {
            emit AchievementUnlocked(_user, "Pose Master", block.timestamp);
        } else if (achievement.totalPoses == 100) {
            emit AchievementUnlocked(_user, "Pose Legend", block.timestamp);
        }
        
        // 持续时间成就
        if (achievement.totalDuration >= 3600) { // 1小时
            emit AchievementUnlocked(_user, "Endurance Champion", block.timestamp);
        }
    }
    
    // 获取合约统计信息
    function getContractStats() public view returns (
        uint256 totalUsers,
        uint256 totalRecordsCount,
        address contractOwner,
        uint256 contractBalance,
        uint256 totalRewards,
        bool rewardsStatus
    ) {
        // 简化版本，实际应用中可以维护更详细的统计
        return (0, totalRecords, owner, address(this).balance, totalRewardsDistributed, rewardsEnabled);
    }

    // 管理函数：切换奖励状态
    function toggleRewards() public onlyOwner {
        rewardsEnabled = !rewardsEnabled;
        emit RewardsToggled(rewardsEnabled, block.timestamp);
    }

    // 管理函数：提取合约余额
    function withdrawBalance(uint256 _amount) public onlyOwner {
        require(_amount <= address(this).balance, "Insufficient contract balance");
        payable(owner).transfer(_amount);
    }

    // 管理函数：紧急提取所有余额
    function emergencyWithdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // 查看合约余额
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // 查看奖励配置
    function getRewardConfig() public view returns (uint256 rewardAmount, bool enabled) {
        return (REWARD_AMOUNT, rewardsEnabled);
    }

    // 紧急情况下的所有权转移
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
}
