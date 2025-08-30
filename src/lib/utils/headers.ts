
// Random headers to avoid rate limiting
export function getRandomHeader() {
    const apiKeys = [
        "bb4ad7eb136e5db4710311ef1180b5b4", // demo api
    ];
  
    const randomApiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-hiro-api-key': randomApiKey
    };
  
    return headers;
  }