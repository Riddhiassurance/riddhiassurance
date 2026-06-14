import multer from "multer";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIMES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
]);

const ALLOWED_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'
]);

const storage = multer.diskStorage({
    filename: function (req, file, callback) {
        const ext = path.extname(file.originalname).toLowerCase();
        const randomName = crypto.randomBytes(16).toString('hex');
        callback(null, `${randomName}${ext}`);
    }
});

const fileFilter = (req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        return callback(new Error(`File type ${ext} is not allowed`), false);
    }
    if (!ALLOWED_MIMES.has(file.mimetype)) {
        return callback(new Error(`MIME type ${file.mimetype} is not allowed`), false);
    }
    callback(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

export default upload;
