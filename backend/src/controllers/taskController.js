const taskService = require('../services/taskService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const create = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user.id, req.body);
  sendSuccess(res, { task }, 201);
});

const list = asyncHandler(async (req, res) => {
  const result = await taskService.listTasks(req.user.id, req.validatedQuery);
  sendSuccess(res, result);
});

const getOne = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(req.user.id, req.params.id);
  sendSuccess(res, { task });
});

const update = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.user.id, req.params.id, req.body);
  sendSuccess(res, { task });
});

const remove = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Task deleted' });
});

module.exports = { create, list, getOne, update, remove };
