const dashboardService = require('../services/dashboardService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const stats = asyncHandler(async (req, res) => {
  const result = await dashboardService.getStats(req.user.id);
  sendSuccess(res, { stats: result });
});

module.exports = { stats };
