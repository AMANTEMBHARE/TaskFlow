const mongoose = require('mongoose');
const Task = require('../models/Task');

async function getStats(userId) {
  const uid = new mongoose.Types.ObjectId(userId);

  const [counts, recentTasks] = await Promise.all([
    Task.aggregate([
      { $match: { userId: uid } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          // "High priority" = high-priority tasks that are still open.
          highPriority: [
            { $match: { priority: 'high', status: { $ne: 'completed' } } },
            { $count: 'count' },
          ],
        },
      },
    ]),
    Task.find({ userId: uid }).sort({ createdAt: -1 }).limit(5),
  ]);

  const [facet] = counts;
  const byStatus = Object.fromEntries(facet.byStatus.map((row) => [row._id, row.count]));

  return {
    total: facet.total[0] ? facet.total[0].count : 0,
    pending: byStatus.pending || 0,
    inProgress: byStatus.in_progress || 0,
    completed: byStatus.completed || 0,
    highPriority: facet.highPriority[0] ? facet.highPriority[0].count : 0,
    recentTasks,
  };
}

module.exports = { getStats };
