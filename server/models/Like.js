import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  user_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  movie_id:        { type: String, required: true },
  movie_title:     { type: String, required: true },
  movie_thumbnail: { type: String, default: '' },
  movie_year:      { type: String, default: '' },
  movie_genre:     { type: String, default: '' },
}, { timestamps: true });

likeSchema.index({ user_id: 1, movie_id: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);
export default Like;
