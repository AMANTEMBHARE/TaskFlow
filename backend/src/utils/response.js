/** Every successful response uses the same envelope: { success: true, data }. */
function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

module.exports = { sendSuccess };
