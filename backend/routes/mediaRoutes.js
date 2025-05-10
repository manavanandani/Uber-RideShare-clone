const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

// Variable to store the GridFS bucket
let gfs;

// Initialize the GridFS bucket when the connection is open
mongoose.connection.once('open', () => {
  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'media' // Make sure this matches your upload bucket name
  });
  console.log('GridFS media bucket initialized');
});

// Route to serve files by filename
router.get('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    console.log(`Attempting to serve file: ${filename}`);
    
    if (!gfs) {
      console.error('GridFS not initialized');
      return res.status(500).json({ message: 'Database connection not established' });
    }
    
    // Find the file by filename
    gfs.find({ filename: filename }).toArray((err, files) => {
      if (err) {
        console.error('Error finding file:', err);
        return res.status(500).json({ message: 'Error finding file' });
      }
      
      if (!files || files.length === 0) {
        console.error(`File not found: ${filename}`);
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Set the proper content type
      res.set('Content-Type', files[0].contentType);
      
      // Create a read stream
      const readstream = gfs.openDownloadStreamByName(filename);
      
      // Handle readstream errors
      readstream.on('error', (error) => {
        console.error('Readstream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error reading file stream' });
        }
      });
      
      // Pipe the file to the response
      readstream.pipe(res);
    });
  } catch (error) {
    console.error('Error in media route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;