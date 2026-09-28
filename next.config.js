/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: [
      'images.unsplash.com',
      'media.istockphoto.com',
      'res.cloudinary.com',
    ],
  },
};

module.exports = nextConfig;
