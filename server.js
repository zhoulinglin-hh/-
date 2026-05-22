const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// 导入数据
const vocabularyData = require('./data/vocabulary');
const confusableGroups = require('./data/confusableGroups');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 内存存储用户数据（生产环境应使用数据库）
const userData = new Map(); // userId -> { masteredWords: Set, passedWords: Set, studyHistory: [], queueOrder: [] }

// 初始化用户数据
function initUserData(userId) {
  if (!userData.has(userId)) {
    userData.set(userId, {
      masteredWords: new Set(),      // 斩 - 完全掌握
      passedWords: new Set(),        // 过 - 暂时跳过
      studyHistory: [],
      queueOrder: [],                // 学习队列顺序（包含随机插入的"过"词汇）
      createdAt: new Date().toISOString()
    });
  }
  return userData.get(userId);
}

// ==================== API 路由 ====================

// 1. 获取所有词汇（基础信息）
app.get('/api/words', (req, res) => {
  const { userId } = req.query;
  const user = userId ? initUserData(userId) : null;
  
  const words = vocabularyData.map(word => ({
    ...word,
    isMastered: user ? user.masteredWords.has(word.id) : false,
    isPassed: user ? user.passedWords.has(word.id) : false
  }));
  
  res.json({
    success: true,
    data: words,
    total: words.length
  });
});

// 2. 获取学习队列（排除熟词，但包含"过"的词会随机出现）
app.get('/api/study/queue', (req, res) => {
  const { userId, shuffle = 'false' } = req.query;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: '缺少userId参数'
    });
  }
  
  const user = initUserData(userId);
  const masteredIds = user.masteredWords;
  
  // 过滤掉熟词，但保留"过"的词
  let queue = vocabularyData.filter(word => !masteredIds.has(word.id));
  
  // 如果有保存的队列顺序，使用它（保持"过"的随机位置）
  if (user.queueOrder.length > 0) {
    const queueMap = new Map(queue.map(w => [w.id, w]));
    const orderedQueue = user.queueOrder
      .map(id => queueMap.get(id))
      .filter(w => w !== undefined);
    // 添加新词汇（如果有）
    const existingIds = new Set(orderedQueue.map(w => w.id));
    const newWords = queue.filter(w => !existingIds.has(w.id));
    queue = [...orderedQueue, ...newWords];
  } else if (shuffle === 'true') {
    queue = queue.sort(() => Math.random() - 0.5);
  }
  
  // 保存当前队列顺序
  user.queueOrder = queue.map(w => w.id);
  
  res.json({
    success: true,
    data: queue,
    total: queue.length,
    mastered: masteredIds.size,
    progress: {
      total: vocabularyData.length,
      mastered: masteredIds.size,
      remaining: queue.length,
      percentage: Math.round((masteredIds.size / vocabularyData.length) * 100)
    }
  });
});

// 3. 标记熟词（斩）- 从学习队列移除，只在易错易混和总览显示
app.post('/api/study/master', (req, res) => {
  const { userId, wordId } = req.body;
  
  if (!userId || !wordId) {
    return res.status(400).json({
      success: false,
      message: '缺少userId或wordId参数'
    });
  }
  
  const user = initUserData(userId);
  const wordIdNum = parseInt(wordId);
  
  // 检查词汇是否存在
  const word = vocabularyData.find(w => w.id === wordIdNum);
  if (!word) {
    return res.status(404).json({
      success: false,
      message: '词汇不存在'
    });
  }
  
  // 添加到熟词列表
  user.masteredWords.add(wordIdNum);
  // 从"过"列表移除（如果存在）
  user.passedWords.delete(wordIdNum);
  // 从队列顺序中移除
  user.queueOrder = user.queueOrder.filter(id => id !== wordIdNum);
  
  // 记录学习历史
  user.studyHistory.push({
    wordId: wordIdNum,
    action: 'master',
    timestamp: new Date().toISOString()
  });
  
  res.json({
    success: true,
    message: `已将 "${word.word}" 标记为熟词（斩）`,
    data: {
      wordId: wordIdNum,
      word: word.word,
      masteredCount: user.masteredWords.size,
      progress: Math.round((user.masteredWords.size / vocabularyData.length) * 100)
    }
  });
});

// 4. 标记"过" - 暂时跳过，稍后随机位置复习
app.post('/api/study/pass', (req, res) => {
  const { userId, wordId } = req.body;
  
  if (!userId || !wordId) {
    return res.status(400).json({
      success: false,
      message: '缺少userId或wordId参数'
    });
  }
  
  const user = initUserData(userId);
  const wordIdNum = parseInt(wordId);
  
  const word = vocabularyData.find(w => w.id === wordIdNum);
  if (!word) {
    return res.status(404).json({
      success: false,
      message: '词汇不存在'
    });
  }
  
  // 添加到"过"列表
  user.passedWords.add(wordIdNum);
  
  // 从当前队列位置移除
  const currentIndex = user.queueOrder.indexOf(wordIdNum);
  if (currentIndex > -1) {
    user.queueOrder.splice(currentIndex, 1);
  }
  
  // 随机插入到后面的位置（至少间隔5个词）
  const minDistance = 5;
  const maxPosition = Math.min(currentIndex + 20, user.queueOrder.length);
  const insertPosition = Math.max(currentIndex + minDistance, 
    Math.floor(Math.random() * (maxPosition - currentIndex - minDistance) + currentIndex + minDistance));
  
  if (insertPosition < user.queueOrder.length) {
    user.queueOrder.splice(insertPosition, 0, wordIdNum);
  } else {
    user.queueOrder.push(wordIdNum);
  }
  
  // 记录学习历史
  user.studyHistory.push({
    wordId: wordIdNum,
    action: 'pass',
    timestamp: new Date().toISOString()
  });
  
  res.json({
    success: true,
    message: `已标记 "${word.word}" 为过，将在稍后复习`,
    data: {
      wordId: wordIdNum,
      word: word.word,
      insertPosition: Math.min(insertPosition, user.queueOrder.length - 1),
      passedCount: user.passedWords.size
    }
  });
});

// 5. 取消熟词标记
app.post('/api/study/unmaster', (req, res) => {
  const { userId, wordId } = req.body;
  
  if (!userId || !wordId) {
    return res.status(400).json({
      success: false,
      message: '缺少userId或wordId参数'
    });
  }
  
  const user = initUserData(userId);
  const wordIdNum = parseInt(wordId);
  
  const word = vocabularyData.find(w => w.id === wordIdNum);
  
  user.masteredWords.delete(wordIdNum);
  // 同时从"过"列表移除
  user.passedWords.delete(wordIdNum);
  
  // 重新添加到队列末尾
  if (!user.queueOrder.includes(wordIdNum)) {
    user.queueOrder.push(wordIdNum);
  }
  
  res.json({
    success: true,
    message: `已取消 "${word ? word.word : wordIdNum}" 的熟词标记`,
    data: {
      wordId: wordIdNum,
      masteredCount: user.masteredWords.size,
      progress: Math.round((user.masteredWords.size / vocabularyData.length) * 100)
    }
  });
});

// 6. 获取熟词列表（仅在总览和易错易混显示）
app.get('/api/study/mastered', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: '缺少userId参数'
    });
  }
  
  const user = initUserData(userId);
  const masteredWords = vocabularyData.filter(word => user.masteredWords.has(word.id));
  
  res.json({
    success: true,
    data: masteredWords,
    count: masteredWords.length
  });
});

// 7. 重置学习进度
app.post('/api/study/reset', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: '缺少userId参数'
    });
  }
  
  userData.set(userId, {
    masteredWords: new Set(),
    passedWords: new Set(),
    studyHistory: [],
    queueOrder: [],
    createdAt: new Date().toISOString()
  });
  
  res.json({
    success: true,
    message: '学习进度已重置'
  });
});

// 8. 获取易错易混词汇组（包含熟词）
app.get('/api/confusable', (req, res) => {
  const { userId } = req.query;
  const user = userId ? initUserData(userId) : null;
  
  // 为每个易错易混组标记词汇状态
  const groupsWithStatus = confusableGroups.map(group => ({
    ...group,
    words: group.words.map(word => ({
      ...word,
      isMastered: user ? user.masteredWords.has(word.id) : false
    }))
  }));
  
  res.json({
    success: true,
    data: groupsWithStatus,
    total: groupsWithStatus.length
  });
});

// 9. 获取特定易错易混组详情
app.get('/api/confusable/:id', (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  const user = userId ? initUserData(userId) : null;
  
  const group = confusableGroups.find(g => g.id === parseInt(id));
  
  if (!group) {
    return res.status(404).json({
      success: false,
      message: '易错易混组不存在'
    });
  }
  
  const groupWithStatus = {
    ...group,
    words: group.words.map(word => ({
      ...word,
      isMastered: user ? user.masteredWords.has(word.id) : false
    }))
  };
  
  res.json({
    success: true,
    data: groupWithStatus
  });
});

// 10. 考频统计 - 全局分布
app.get('/api/stats/frequency-distribution', (req, res) => {
  const distribution = {
    5: 0, // 极高频
    4: 0, // 高频
    3: 0, // 中频
    2: 0, // 低频
    1: 0  // 极低频
  };
  
  vocabularyData.forEach(word => {
    distribution[word.frequency]++;
  });
  
  const labels = {
    5: '极高频(必背)',
    4: '高频(重点)',
    3: '中频(掌握)',
    2: '低频(了解)',
    1: '极低频(可选)'
  };
  
  const chartData = Object.entries(distribution).map(([level, count]) => ({
    level: parseInt(level),
    label: labels[level],
    count,
    percentage: Math.round((count / vocabularyData.length) * 100)
  }));
  
  res.json({
    success: true,
    data: {
      distribution,
      chartData,
      total: vocabularyData.length
    }
  });
});

// 11. 用户学习统计
app.get('/api/stats/user', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: '缺少userId参数'
    });
  }
  
  const user = initUserData(userId);
  const masteredWords = vocabularyData.filter(word => user.masteredWords.has(word.id));
  
  // 按考频统计已掌握词汇
  const masteredByFrequency = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  masteredWords.forEach(word => {
    masteredByFrequency[word.frequency]++;
  });
  
  // 计算各考频掌握率
  const totalByFrequency = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  vocabularyData.forEach(word => {
    totalByFrequency[word.frequency]++;
  });
  
  const masteryRateByFrequency = Object.entries(totalByFrequency).map(([level, total]) => ({
    level: parseInt(level),
    total,
    mastered: masteredByFrequency[level],
    rate: total > 0 ? Math.round((masteredByFrequency[level] / total) * 100) : 0
  }));
  
  res.json({
    success: true,
    data: {
      totalWords: vocabularyData.length,
      masteredCount: masteredWords.length,
      passedCount: user.passedWords.size,
      remainingCount: vocabularyData.length - masteredWords.length,
      overallProgress: Math.round((masteredWords.length / vocabularyData.length) * 100),
      masteredByFrequency,
      masteryRateByFrequency,
      studyHistoryCount: user.studyHistory.length
    }
  });
});

// 12. 获取高频词汇（考频4-5级）
app.get('/api/words/high-frequency', (req, res) => {
  const { limit = 20 } = req.query;
  const highFreqWords = vocabularyData
    .filter(word => word.frequency >= 4)
    .slice(0, parseInt(limit));
  
  res.json({
    success: true,
    data: highFreqWords,
    count: highFreqWords.length
  });
});

// 13. 搜索词汇
app.get('/api/words/search', (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({
      success: false,
      message: '缺少搜索关键词'
    });
  }
  
  const query = q.toLowerCase();
  const results = vocabularyData.filter(word => 
    word.word.toLowerCase().includes(query) ||
    word.definition.toLowerCase().includes(query) ||
    word.synonyms.some(s => s.toLowerCase().includes(query))
  );
  
  res.json({
    success: true,
    data: results,
    count: results.length,
    query: q
  });
});

// 14. 生成用户ID
app.post('/api/user/create', (req, res) => {
  const userId = uuidv4();
  initUserData(userId);
  
  res.json({
    success: true,
    userId,
    message: '用户创建成功'
  });
});

// ==================== 静态文件服务 ====================

// 生产环境提供静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    stats: {
      totalWords: vocabularyData.length,
      totalConfusableGroups: confusableGroups.length,
      activeUsers: userData.size
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🎓 四级3500词背诵小程序服务端已启动                      ║
║                                                            ║
║     端口: ${PORT}                                          ║
║     环境: ${process.env.NODE_ENV || 'development'}                          ║
║                                                            ║
║     API 端点:                                               ║
║     • GET  /api/words              获取所有词汇             ║
║     • GET  /api/study/queue        获取学习队列             ║
║     • POST /api/study/master       标记熟词（斩）            ║
║     • POST /api/study/pass         标记跳过（过）            ║
║     • GET  /api/confusable         易错易混词汇             ║
║     • GET  /api/stats/frequency    考频分布统计             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
