const path = require('path')

module.exports = {
  isProduction: process.env.NODE_ENV === 'production',
  cookieSecret: process.env.COOKIE_SECRET,
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'crow',
    user: process.env.DB_USER || 'crow',
    password: process.env.DB_PWD || 'crow',
    queryDirectory: path.join(__dirname, '..', 'db', 'queries')
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    recipientPhoneNumber: process.env.TWILIO_RECIPIENT,
    originPhoneNumber: process.env.TWILIO_FROM
  },
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    from: process.env.MAILGUN_FROM,
    recipient: process.env.MAILGUN_RECIPIENT
  }
}