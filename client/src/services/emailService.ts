/**
 * Email service for sending admission notifications
 */

export interface AdmissionEmailData {
  applicantName: string;
  applicantEmail: string;
  applicantId: string;
  program: string;
}

/**
 * Send admission ID notification email to applicant
 * @param emailData - Email data containing applicant information
 * @returns Promise<boolean> - Success status
 */
const sendAdmissionIdEmail = async (emailData: AdmissionEmailData): Promise<boolean> => {
  try {
    console.log('Sending admission email with data:', emailData);
    
    const response = await fetch('/api/send-admission-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    console.log('Email API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email API error response:', errorText);
      throw new Error(`Email service error: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Email API success response:', result);
    
    const success = result.message === 'Email sent successfully';
    console.log('Email send result:', success);
    return success;
  } catch (error) {
    console.error('Error sending admission email:', error);
    return false;
  }
};

// Export both named and default for compatibility
export { sendAdmissionIdEmail };

const emailService = {
  sendAdmissionIdEmail,
};

export default emailService;
