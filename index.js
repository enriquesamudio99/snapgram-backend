import app from './src/app.js';
import dbConnection from './src/config/db.js';
import { PORT } from './src/config/env.js';

function main() {
  // Connect to DB
  dbConnection(); 
  // Configure port and run the server 
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  }); 
}

main();