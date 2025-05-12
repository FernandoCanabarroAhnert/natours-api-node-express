// npm install --save @sendgrid/mail
const sgMail = require('@sendgrid/mail');
const { catchAsync } = require('./catchAsync');
const ErrorResponse = require('./errorResponse');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.createEmail = (emailTo, subject, text) => {
  const mail = {
    to: emailTo,
    from: 'ahnertfernando499@gmail.com',
    subject: subject,
    text: text,
    //html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  }
  return mail;
};

exports.sendEmail = catchAsync(async (email) => {
    try {
        await sgMail.send(email);
    }
    catch (error) {
        return next(new ErrorResponse(400, 'Bad Request', 'Error sending email'));
    }
});