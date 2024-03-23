import * as yup from 'yup';

const getEmailHost = (email: string): string => {
  try {
    const emailDomain = email.split('@')[1];
    const hostName = emailDomain.split('.')[0].toLowerCase();
    return hostName;
  } catch (err) {
    return '';
  }
};

export const sanitizeEmail = (value: string) => {
  try {
    const schema = yup.string().email();
    const email = schema.validateSync(value);

    if (!email) {
      throw Error('Invalid email');
    }

    if (getEmailHost(email) === 'gmail') {
      const sanitizedEmail = email.replace(/\.(?=[^@]*?@)|\+[^@]*?(?=@)/g, '');
      return sanitizedEmail;
    }
  } catch (err) {
    return value;
  }
  return value;
};
