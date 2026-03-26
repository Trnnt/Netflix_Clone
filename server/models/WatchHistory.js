import mongoose from 'mongoose';

const watchHistorySchema = new mongoose.Schema({
  user_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  movie_id:        { type: String, required: true },
  movie_title:     { type: String, required: true },
  movie_thumbnail: { type: String, default: '' },
  duration_min:    { type: Number, default: 0 },
  season:          { type: Number, default: null },
  episode:         { type: Number, default: null },
}, { timestamps: true });

const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);
export default WatchHistory;
