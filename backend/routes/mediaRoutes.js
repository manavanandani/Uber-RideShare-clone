// backend/routes/mediaRoutes.js
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
// Alternative Promise-based implementation for mediaRoutes.js
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    console.log(`Request for file: ${filename}`);
    
    if (!gfs) {
      console.error('GridFS not initialized');
      return res.status(500).json({ message: 'Database connection not established' });
    }
    
    // Find the file by filename
    const files = await gfs.find({ filename }).toArray();
    
    if (!files || files.length === 0) {
      console.error(`File not found: ${filename}`);
      return res.status(404).json({ message: 'File not found' });
    }
    
    console.log(`File found: ${filename}, type: ${files[0].contentType}`);
    
    // Set the proper content type
    res.set('Content-Type', files[0].contentType);
    
    // Create a read stream
    const readstream = gfs.openDownloadStreamByName(filename);
    
    // Handle potential errors on the stream
    readstream.on('error', (err) => {
      console.error(`Error streaming file ${filename}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file' });
      }
    });
    
    // Pipe the file to the response
    readstream.pipe(res);
  } catch (err) {
    console.error('Error in media route:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error retrieving file' });
    }
  }
});

module.exports = router;