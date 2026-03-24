const fetch = require('node-fetch') || global.fetch;
const fs = require('fs');

fetch('http://localhost:5000/api/chatbot/query', {
  method: 'POST',
  body: JSON.stringify({message: 'hello', history: []}),
  headers: {'Content-Type': 'application/json'}
})
.then(res => res.json())
.then(data => {
  fs.writeFileSync('err.json', JSON.stringify(data, null, 2));
})
.catch(err => {
  fs.writeFileSync('err.json', JSON.stringify({error: err.toString()}, null, 2));
});
