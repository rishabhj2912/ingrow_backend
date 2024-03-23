import axios from 'axios';

const baseUrl = 'https://www.linkedin.com/voyager/api';

/**
 * Creates the axios instance that gets used for all following API calls.
 */
export const createInstance = (csrfToken: string, cookies: string) => {
  return axios.create({
    baseURL: baseUrl,
    headers: getLinkedinHeaders(csrfToken, cookies),
    withCredentials: true
  });
};

const getLinkedinHeaders = (csrfToken: string, cookies: string) => {
  return {
    accept: 'application/vnd.linkedin.normalized+json+2.1',
    'accept-language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7,fr;q=0.6',
    'csrf-token': csrfToken,
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Cookie: cookies,
    'x-li-lang': 'de_DE',
    'x-li-track':
      '{"clientVersion":"1.6.4335","osName":"web","timezoneOffset":2,"deviceFormFactor":"DESKTOP","mpName":"voyager-web","displayDensity":2}',
    'x-restli-protocol-version': '2.0.0',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'content-type': 'application/json; charset=UTF-8'
  };
};
