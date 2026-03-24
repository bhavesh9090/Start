const fs = require('fs');

fetch('http://localhost:5001/api/chatbot/query', {
  method: 'POST',
  body: JSON.stringify({message: 'hello', history: []}),
  headers: {'Content-Type': 'application/json'}
})
.then(res => res.json())
.then(data => {
  fs.writeFileSync('err_5001.json', JSON.stringify(data, null, 2));
})
.catch(err => {
  fs.writeFileSync('err_5001.json', JSON.stringify({error: err.toString()}, null, 2));
});
