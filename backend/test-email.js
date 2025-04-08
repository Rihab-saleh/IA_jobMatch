import { sendNotificationEmail, verifyEmailConfig } from 'backend/services/emailService.js';
console.log('Environment variables:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
async function testEmail() {
  try {
    console.log('Testing email configuration...');
    const isValid = await verifyEmailConfig();
    
    if (isValid) {
      console.log('✅ Email configuration is valid and authenticated');
    } else {
      console.error('❌ Email configuration is invalid');
    }


    console.log('Sending test email...');
    const result = await sendNotificationEmail(
      'rihebbensaleh@gmail.com',
      'test_notification',
      {}
    );
    
    if (result.success) {
      console.log('✅ Email sent successfully:', result.messageId);
    } else {
      console.error('❌ Failed to send email:', result.error);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testEmail();