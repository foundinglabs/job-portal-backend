const { Storage } = require('@google-cloud/storage');
const config = require('../config');

// Initialize Google Cloud Storage with service account key
const storage = new Storage({
    projectId: config.googleCloud.projectId,
    credentials: {
        client_email: config.googleCloud.clientEmail,
        private_key: config.googleCloud.privateKey,
    },
});

const bucket = storage.bucket(config.googleCloud.bucketName);

/**
 * Uploads a file buffer to Google Cloud Storage.
 * @param {Buffer} fileBuffer - The file content as a Buffer.
 * @param {string} destinationPath - The desired path/filename in the GCS bucket (e.g., 'resumes/applicantId/resume.pdf').
 * @param {string} contentType - The MIME type of the file (e.g., 'application/pdf').
 * @returns {Promise<string>} The public URL (or path) of the uploaded file.
 */
async function uploadFile(fileBuffer, destinationPath, contentType) {
    const file = bucket.file(destinationPath);
    const stream = file.createWriteStream({
        metadata: {
            contentType: contentType,
        },
        resumable: false, // For smaller files, can set to false for single upload
    });

    return new Promise((resolve, reject) => {
        stream.on('error', (err) => reject(err));
        stream.on('finish', () => {
            // The file is private by default, return the internal path for later access.
            // For public access (e.g., company logos), you'd set options.public: true in createWriteStream
            // or use file.makePublic()
            const filePath = `gs://${config.googleCloud.bucketName}/${destinationPath}`;
            resolve(filePath);
        });
        stream.end(fileBuffer);
    });
}

/**
 * Generates a signed URL for viewing a private file for a limited time.
 * @param {string} filePath - The full path of the file in GCS (e.g., 'resumes/applicantId/resume.pdf').
 * @returns {Promise<string>} A signed URL for accessing the file.
 */
async function getSignedUrl(filePath) {
    const fileName = filePath.replace(`gs://${config.googleCloud.bucketName}/`, '');
    const options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };

    const [url] = await bucket.file(fileName).getSignedUrl(options);
    return url;
}

module.exports = {
    uploadFile,
    getSignedUrl
};