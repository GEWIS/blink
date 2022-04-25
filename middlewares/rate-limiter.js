const rateLimit = require('express-rate-limit')
const RedisStore = require('rate-limit-redis')
const ms = require('ms')
const client = require('../lib/redis')
const { JWT_AUTH_PROPERTY } = require('../config/constants')

exports.short = rateLimit({
  legacyHeaders: true,
  windowMs: ms(process.env.RATE_LIMIT_SHORT_WINDOW),
  max: process.env.RATE_LIMIT_SHORT_MAX - 0,
  keyGenerator: req =>
    (req[JWT_AUTH_PROPERTY] || {}).sub || (req.user || {}).id || req.ip,
  store: new RedisStore({ client, prefix: 'rate-limit-short' })
})

exports.long = rateLimit({
  legacyHeaders: true,
  windowMs: ms(process.env.RATE_LIMIT_LONG_WINDOW),
  max: process.env.RATE_LIMIT_LONG_MAX - 0,
  keyGenerator: req =>
    (req[JWT_AUTH_PROPERTY] || {}).sub || (req.user || {}).id || req.ip,
  store: new RedisStore({
    prefix: 'rate-limit-long',
    // See: https://github.com/wyattjoh/rate-limit-redis#examples
    sendCommand: (...args) => client.call(...args)
  })
})
