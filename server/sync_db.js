import fs from 'fs';
import mongoose from 'mongoose';
import 'dotenv/config';
import MyList from './models/MyList.js';
import WatchHistory from './models/WatchHistory.js';
import Like from './models/Like.js';
import Download from './models/Download.js';

const OFFLINE_DB_PATH = './offline_db.json';

async function syncOfflineData() {
  if (!fs.existsSync(OFFLINE_DB_PATH)) {
    console.log('✅ No offline data to sync.');
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is missing in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected for sync.');

    let offlineDb = JSON.parse(fs.readFileSync(OFFLINE_DB_PATH, 'utf-8'));
    let syncedCount = 0;

    // Sync MyList
    if (offlineDb.myList) {
      for (const item of offlineDb.myList) {
        if (!item.user_id || item.user_id.startsWith('mock_')) continue; // Skip unauthenticated mock data
        await MyList.findOneAndUpdate(
          { user_id: item.user_id, movie_id: item.movie_id },
          { ...item },
          { upsert: true, new: true }
        );
        syncedCount++;
      }
    }

    // Sync WatchHistory
    if (offlineDb.watchHistory) {
      for (const item of offlineDb.watchHistory) {
        if (!item.user_id || item.user_id.startsWith('mock_')) continue;
        await WatchHistory.findOneAndUpdate(
          { user_id: item.user_id, movie_id: item.movie_id },
          { ...item, last_watched: new Date() },
          { upsert: true, new: true }
        );
        syncedCount++;
      }
    }

    // Sync Likes
    if (offlineDb.likes) {
      for (const item of offlineDb.likes) {
        if (!item.user_id || item.user_id.startsWith('mock_')) continue;
        await Like.findOneAndUpdate(
          { user_id: item.user_id, movie_id: item.movie_id },
          { ...item },
          { upsert: true, new: true }
        );
        syncedCount++;
      }
    }

    // Sync Downloads
    if (offlineDb.downloads) {
      for (const item of offlineDb.downloads) {
        if (!item.user_id || item.user_id.startsWith('mock_')) continue;
        await Download.findOneAndUpdate(
          { user_id: item.user_id, movie_id: item.movie_id },
          { ...item },
          { upsert: true, new: true }
        );
        syncedCount++;
      }
    }

    console.log(`✅ Successfully synced ${syncedCount} offline records to the cloud!`);
    
    // Clear offline DB
    fs.writeFileSync(OFFLINE_DB_PATH, JSON.stringify({ myList: [], downloads: [], watchHistory: [], likes: [] }, null, 2));
    console.log('🧹 Offline database cleared.');

  } catch (err) {
    console.error('❌ Sync failed:', err.message);
  } finally {
    mongoose.connection.close();
  }
}

syncOfflineData();
