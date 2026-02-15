/** @type {import('next').NextConfig} */
const nextConfig = {

  images: {
    unoptimized: true,
  },
  // GitHub Pages를 위한 설정 (필요시 basePath 추가)
  // basePath: process.env.NODE_ENV === 'production' ? '/repo-name' : '',
}

module.exports = nextConfig
