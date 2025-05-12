const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { CustomError } = require('../../../shared/utils/errors');

const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          console.error('Error generating filename:', err);
          return reject(new CustomError('Failed to generate filename', 500));
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        console.log('Generated filename:', filename);
        const fileInfo = {
          filename: filename,
          bucketName: 'media'
        };
        console.log('File info:', fileInfo);
        resolve(fileInfo);
      });
    });
  }
});

storage.on('connection', () => {
  console.log('GridFS connected');
});

storage.on('connectionFailed', (err) => {
  console.error('GridFS connection error:', err);
  throw new CustomError('GridFS connection failed', 500);
});

const upload = multer({ storage });

module.exports = upload;