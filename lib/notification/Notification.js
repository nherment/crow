
const conf = require('../conf.js')
const twilio = require('twilio')
const logger = require('logacious')()
let nodemailer = require('nodemailer')
let mailgun = require('nodemailer-mailgun-transport')

let twilioClient
if(conf.twilio.accountSid) {
  twilioClient = new twilio(conf.twilio.accountSid, conf.twilio.authToken);
}

let mailgunConfig = {
  auth: {
    api_key: conf.mailgun.apiKey,
    domain: conf.mailgun.domain
  },
  fromEmail: conf.mailgun.from
}

let mailer
if(mailgunConfig.auth.api_key) {
  mailer = nodemailer.createTransport(mailgun(mailgunConfig))
}

function notifyBySMS(message, callback) {

  if(!twilioClient) {
    logger.warn('No twilio config. Unable to send SMS.')
    return callback()
  }
  let from = conf.twilio.originPhoneNumber
  let to = conf.twilio.recipientPhoneNumber
  logger.info(`Sending SMS from [${from}] to [${to}]. Message: [${message}]`)
  twilioClient.messages.create({
    body: message,
    to: to,
    from: from
  })
  .then((message) => {
    logger.error(`Successfully sent SMS to ${to}`)
    callback(null, message)
  })
  .catch((err) => {
    logger.error('Failed to send SMS', err)
    callback(err, null)
  })
}
function notifyByMail(subject, message, callback) {
  if(!mailer) {
    logger.warn('No mail config. Unable to send mail.')
    return callback()
  }
  logger.info(`Sending email. Subject: [${subject}]`)
  mailer.sendMail({
    from: mailgunConfig.fromEmail,
    to: conf.mailgun.recipient,
    subject: subject,
    text: message
  }, function (err, info) {
    if (err) {
      logger.error('Failed to send mail', err)
    } else {
      logger.info('Mail sent to', conf.mailgun.recipient, info)
    }
    if(callback) callback(err)
  })
}

module.exports = {
  notifyBySMS,
  notifyByMail
}