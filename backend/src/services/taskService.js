const mongoose = require('mongoose');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function createTask(userId, data) {
  return Task.create({ ...data, userId });
}

async function listTasks(userId, query) {
  const { search, status, priority, sortBy, order, page, limit } = query;

  // Aggregation pipelines do not auto-cast ids like find() does, so cast explicitly.
  const filter = { userId: new mongoose.Types.ObjectId(userId) };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };

  const direction = order === 'asc' ? 1 : -1;
  // When sorting by due date, tasks without a due date always go last.
  const sort =
    sortBy === 'dueDate'
      ? { _noDueDate: 1, dueDate: direction, _id: -1 }
      : { createdAt: direction, _id: direction };

  const [result] = await Task.aggregate([
    { $match: filter },
    { $addFields: { _noDueDate: { $cond: [{ $ifNull: ['$dueDate', false] }, 0, 1] } } },
    { $sort: sort },
    {
      $facet: {
        items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  const total = result.total[0] ? result.total[0].count : 0;
  const tasks = result.items.map((doc) => Task.hydrate(doc));

  return {
    tasks,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

// Ownership is enforced inside the query itself: { _id, userId }. A task that belongs
// to someone else is indistinguishable from one that does not exist (404, not 403).
async function getTask(userId, id) {
  const task = await Task.findOne({ _id: id, userId });
  if (!task) throw ApiError.notFound('Task not found');
  return task;
}

async function updateTask(userId, id, data) {
  const task = await Task.findOneAndUpdate(
    { _id: id, userId },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!task) throw ApiError.notFound('Task not found');
  return task;
}

async function deleteTask(userId, id) {
  const task = await Task.findOneAndDelete({ _id: id, userId });
  if (!task) throw ApiError.notFound('Task not found');
}

module.exports = { createTask, listTasks, getTask, updateTask, deleteTask };
