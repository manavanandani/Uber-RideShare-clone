const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');

const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: (req, file) => {
    return {
      filename: `${Date.now()}-${file.originalname}`,
      bucketName: 'media' // This creates a "media.files" and "media.chunks" collection
    };
  }
});

const upload = multer({ storage });

module.exports = upload;