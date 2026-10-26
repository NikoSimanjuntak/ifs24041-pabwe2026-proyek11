/** Format respons seragam: { status, message, data }. */
export const ok = (res, message, data = null, code = 200) =>
  res.status(code).json({ status: 'success', message, data });
