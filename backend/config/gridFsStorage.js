const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

// Create storage engine
const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          console.error('Error generating filename:', err);
          return reject(err);
        }
        
        const filename = buf.toString('hex') + path.extname(file.originalname);
        console.log('Generated filename:', filename);
        
        const fileInfo = {
          filename: filename,
          bucketName: 'media' // This MUST match the collection name in GridFS
        };
        
        console.log('File info:', fileInfo);
        resolve(fileInfo);
      });
    });
  }
});

// Log connection errors
storage.on('connectionFailed', function(err) {
  console.error('GridFS connection error:', err);
});

// Create multer instance
const upload = multer({ storage });

module.exports = upload;