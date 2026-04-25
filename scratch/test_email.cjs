const { Resend } = require('resend');
require('dotenv').config({ path: './.env' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('Testing email with Resend...');
  console.log('Sender:', process.env.EMAIL_SENDER);
  console.log('Recipient: feliciencalylx@gmail.com');

  try {
    const { data, error } = await resend.emails.send({
      from: `MyAsset Test <${process.env.EMAIL_SENDER || 'onboarding@resend.dev'}>`,
      to: ['feliciencalylx@gmail.com'],
      subject: 'Resend Test Connection',
      html: '<strong>Resend is working!</strong>'
    });

    if (error) {
      console.error('Resend Error:', JSON.stringify(error, null, 2));
    } else {
      console.log('Email sent successfully!', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Unexpected Error:', err);
  }
}

testEmail();
