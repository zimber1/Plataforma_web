const http = require('http');
const PORT = process.env.PORT || 3000;
const name = 'reviews-service';
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: name }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ service: name, path: req.url }));
});

server.listen(PORT, () => console.log(`${name} listening on ${PORT}`));
