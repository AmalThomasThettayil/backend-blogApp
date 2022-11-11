const cloudinary = require("cloudinary")

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.CLOUDINARY_API,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUploadImg = async fileToUpload => {
    try {
        const data = await cloudinary.uploader
            .upload(fileToUpload, {
                resource_type: "auto",
            });
        return {
            url: data?.secure_url,
        };
    } catch (error) {
        return error;
    }
}
module.exports = cloudinaryUploadImg; 