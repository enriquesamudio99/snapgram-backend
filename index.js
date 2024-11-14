import server from './src/app.js';
import dbConnection from './src/config/db.js';
import { BACKEND_URL, PORT, BASE_API_URL } from './src/config/env.js';

function main() {
  // Connect to DB
  dbConnection(); 
  // Configure port and run the server 
  server.listen(PORT, () => {
    console.log(`Server running on ${BACKEND_URL}:${PORT}`);
    console.log(`API Version ${BACKEND_URL}:${PORT}/${BASE_API_URL}`);
  }); 
}

main();