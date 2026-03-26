import mongoose from 'mongoose';

const downloadSchema = new mongoose.Schema({
  user_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  movie_id:        { type: String, required: true },
  movie_title:     { type: String, required: true },
  movie_thumbnail: { type: String, default: '' },
  movie_year:      { type: String, default: '' },
  movie_rating:    { type: String, default: '' },
}, { timestamps: true });

downloadSchema.index({ user_id: 1, movie_id: 1 }, { unique: true });

const Download = mongoose.model('Download', downloadSchema);
export default Download;
