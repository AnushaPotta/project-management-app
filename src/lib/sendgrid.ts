// src/lib/sendgrid.ts
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with your API key
// You'll need to add this to your .env.local file
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

type EmailData = {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Send an email using SendGrid
 */
export async function sendEmail(data: EmailData): Promise<boolean> {
  try {
    await sgMail.send(data);
    console.log(`Email sent to ${data.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a board invitation email
 */
export async function sendBoardInvitation({
  email,
  inviterName,
  boardName,
  invitationLink,
}: {
  email: string;
  inviterName: string;
  boardName: string;
  invitationLink: string;
}): Promise<boolean> {
  const fromEmail = process.env.EMAIL_FROM || 'noreply@projectmanagement.app';
  
  const subject = `${inviterName} invited you to collaborate on "${boardName}"`;
  
  const text = `
    ${inviterName} has invited you to collaborate on the board "${boardName}" in Project Management App.
    
    Click the link below to accept the invitation:
    ${invitationLink}
    
    This invitation link will expire in 7 days.
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You've been invited to collaborate!</h2>
      <p><strong>${inviterName}</strong> has invited you to collaborate on the board <strong>"${boardName}"</strong> in Project Management App.</p>
      
      <div style="margin: 30px 0;">
        <a href="${invitationLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Accept Invitation
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">This invitation link will expire in 7 days.</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    from: fromEmail,
    subject,
    text,
    html,
  });
}