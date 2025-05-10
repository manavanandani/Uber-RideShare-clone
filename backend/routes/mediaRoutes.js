const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

// Initialize gfs
let gfs;
mongoose.connection.once('open', () => {
  // Initialize Grid Stream
  gfs = Grid(mongoose.connection.db, mongoose.mongo);
  gfs.collection('media'); // Must match bucketName in gridFsStorage.js
  console.log('GridFS media connection established');
});

// Get media file by filename
router.get('/:filename', (req, res) => {
  console.log('Media request for filename:', req.params.filename);
  
  if (!gfs) {
    console.error('GridFS not initialized yet');
    return res.status(500).json({ message: 'Server not ready' });
  }

  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (err) {
      console.error('Error finding file:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    
    if (!file || file.length === 0) {
      console.error('File not found:', req.params.filename);
      return res.status(404).json({ message: 'File not found' });
    }
    
    console.log('File found:', file.filename, 'contentType:', file.contentType);
    
    // Set the content type header
    res.set('Content-Type', file.contentType);
    
    // Create download stream
    const readstream = gfs.createReadStream({
      filename: file.filename
    });
    
    // Handle stream errors
    readstream.on('error', function(err) {
      console.error('Read stream error:', err);
      return res.status(500).json({ message: 'Error retrieving file' });
    });
    
    // Pipe the file data to the response
    readstream.pipe(res);
  });
});

module.exports = router;