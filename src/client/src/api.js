import config from '@/config';

export default (body) => 
  fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json' 
    },
    body: JSON.stringify(body)
  })
    .then((res) => res.json())
