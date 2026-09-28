import ImageKit from '@imagekit/nodejs';
import config from '../config/config.js';
const client = new ImageKit({
  privateKey: config.IMAGEKIT_PRIVATE_KEY,
  publicKey:config.IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: config.IMAGEKIT_URL_ENDPOINT
});

async function uploadFile(buffer,originalName,mimeType) {
    // console.log(buffer);
    const result=await client.files.upload({
        file:`data:${mimeType};base64,${buffer.toString("base64")}`,
        fileName:`product-${Date.now()}-${originalName}`
    })
    return result;
};
async function deleteImg(fileId){
    try {
        const result = await client.files.delete(fileId);
        console.log(result);
    } catch (error) {
        throw error;
    }
}
export {uploadFile,deleteImg};