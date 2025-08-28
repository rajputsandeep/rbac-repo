import { config } from './config.js';
import app from './app.js';
import { AppDataSource } from './dataSource/data-source.js'; // TypeORM DB config import
import {seedRolesOnce} from "./data/seedroles.js"
// Initialize DB then start server
// AppDataSource.initialize()
//   .then(() => {
//     console.log("✅ Database connected!");

//     app.listen(config.port, () => {
//       console.log(`🚀 API listening on http://localhost:${config.port}`);
//     });
//   })
//   .catch((err) => {
//     console.error("❌ Database connection failed:", err);
//   });
(async () => {
  await AppDataSource.initialize();
  console.log('✅ DB connected');

  // Seed roles (safe to run every boot)
  // await seedRolesOnce(AppDataSource);
  // console.log('✅ Roles ensured');

  app.listen(config.port, () => {
      console.log(`🚀 API listening on http://localhost:${config.port}`);
    });
})().catch(err => {
  console.error('Boot error:', err);
  process.exit(1);
});