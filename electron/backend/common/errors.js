/**
 * 业务异常类
 */

class BizError extends Error {
  constructor(code, msg) {
    super(msg)
    this.name = 'BizError'
    this.code = code
  }
}

const notFound   = (msg) => new BizError(40400, msg)
const badRequest = (msg) => new BizError(40000, msg)
const conflict   = (msg) => new BizError(40900, msg)

module.exports = { BizError, notFound, badRequest, conflict }
