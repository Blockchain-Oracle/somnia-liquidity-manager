import { PinataSDK } from "pinata";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "cyan-faithful-peafowl-351.mypinata.cloud",
});

console.log('Pinata object keys:', Object.keys(pinata));
console.log('Pinata upload:', pinata.upload);

// Check what methods are available
console.log('Upload methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(pinata.upload)));
console.log('Public upload methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(pinata.upload.public)));

// Test file upload
try {
  const file = new File(["hello world!"], "hello.txt", { type: "text/plain" });
  // Try using upload.public.file
  const upload = await pinata.upload.public.file(file);
  console.log('Upload successful:', upload);
} catch (error) {
  console.error('Upload error:', error.message);
  console.error('Full error:', error);
}