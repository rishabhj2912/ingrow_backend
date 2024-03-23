import { v2 as cloudinary } from 'cloudinary';

let cloudinaryClient: any;

export const getCloudinary = async () => {
  try {
    if (!cloudinaryClient) {
      cloudinaryClient = cloudinary;
      cloudinaryClient.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET
      });
      console.log('Connected to Cloudinary');
    }
    return cloudinaryClient;
  } catch (err) {
    console.log(err);
    throw Error('Error');
  }
};

export default async function uploadImageToCloud(url: string) {
  try {
    if (!url) return null;
    const response = await cloudinaryClient.uploader.upload(url, {
      upload_preset: 'unsugned'
    });
    return response?.url;
  } catch (err) {
    console.log('Error uploading file url: ' + url, err);
    return null;
  }
}
