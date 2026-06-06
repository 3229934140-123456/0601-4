import type { CanvasSize } from '@/types/canvas';

export const canvasSizes: CanvasSize[] = [
  { id: 'instagram-post', name: 'Instagram 帖子', width: 1080, height: 1080, platform: 'Instagram', category: 'social' },
  { id: 'instagram-story', name: 'Instagram 故事', width: 1080, height: 1920, platform: 'Instagram', category: 'social' },
  { id: 'instagram-reel', name: 'Instagram Reel', width: 1080, height: 1920, platform: 'Instagram', category: 'social' },
  { id: 'facebook-post', name: 'Facebook 帖子', width: 1200, height: 630, platform: 'Facebook', category: 'social' },
  { id: 'facebook-cover', name: 'Facebook 封面', width: 820, height: 312, platform: 'Facebook', category: 'social' },
  { id: 'twitter-post', name: 'Twitter 帖子', width: 1200, height: 675, platform: 'Twitter/X', category: 'social' },
  { id: 'twitter-header', name: 'Twitter 头图', width: 1500, height: 500, platform: 'Twitter/X', category: 'social' },
  { id: 'youtube-thumbnail', name: 'YouTube 缩略图', width: 1280, height: 720, platform: 'YouTube', category: 'social' },
  { id: 'youtube-banner', name: 'YouTube Banner', width: 2560, height: 1440, platform: 'YouTube', category: 'social' },
  { id: 'linkedin-post', name: 'LinkedIn 帖子', width: 1200, height: 627, platform: 'LinkedIn', category: 'social' },
  { id: 'tiktok', name: 'TikTok 视频', width: 1080, height: 1920, platform: 'TikTok', category: 'social' },
  { id: 'xiaohongshu', name: '小红书封面', width: 1080, height: 1440, platform: '小红书', category: 'social' },
  { id: 'wechat-moment', name: '微信朋友圈', width: 1080, height: 1080, platform: '微信', category: 'social' },
  { id: 'poster-a4', name: 'A4 海报', width: 2480, height: 3508, platform: '打印', category: 'poster' },
  { id: 'poster-a3', name: 'A3 海报', width: 3508, height: 4961, platform: '打印', category: 'poster' },
  { id: 'banner-horizontal', name: '横幅广告', width: 1200, height: 300, platform: '广告', category: 'ad' },
  { id: 'banner-vertical', name: '竖版广告', width: 300, height: 600, platform: '广告', category: 'ad' },
];
