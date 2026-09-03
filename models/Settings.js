const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    link: { type: String, default: '' },
    bgColor: { type: String, default: '#ffffff' },
    textColor: { type: String, default: '#111111' },
    animation: { type: String, default: 'anim-fade-in' },
  },
  { _id: true }
);

const settingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: 'My Store' },
    contactPhone: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    address: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    contactAnimation: { type: String, default: 'anim-fade-up' },
    banners: [bannerSchema],

    // Global Colors
    primaryColor: { type: String, default: '#ff6b35' },
    primaryDarkColor: { type: String, default: '#e0551f' },
    bodyBg: { type: String, default: '#fafafa' },
    textColor: { type: String, default: '#222222' },
    cardBg: { type: String, default: '#ffffff' },

    // Typography & Fonts Settings
    fontFamily: { type: String, default: "'Segoe UI', Roboto, sans-serif" },
    fontSizeBase: { type: String, default: '15px' },

    // Header Logo, Icon, Gap & Size Customization
    headerIcon: { type: String, default: '🛍️' },
    headerIconType: { type: String, default: 'emoji' },
    headerIconPosition: { type: String, default: 'left' },
    headerIconSize: { type: String, default: '24px' },
    headerWordGap: { type: String, default: '6px' },
    headerBg: { type: String, default: '#1a1a2e' },
    headerText: {
      type: String,
      default: '[My#ffffff] [Store#ff6b35]'
    },
    burgerIconColor: { type: String, default: '#ffffff' },
    burgerDrawerBg: { type: String, default: '#141824' },
    burgerLinkColor: { type: String, default: '#e2e8f0' },
    burgerLinkAnim: { type: String, default: 'anim-slide-left' },
    showBurgerContactInfo: { type: Boolean, default: true },

    // Sections & Footer Customization
    footerBg: { type: String, default: '#1a1a2e' },
    footerTextColor: { type: String, default: '#ffffff' },
    heroSectionBg: { type: String, default: 'transparent' },
    saleSectionBg: { type: String, default: '#fff5f5' },
    featuredSectionBg: { type: String, default: '#f8fafc' },

    // Word-by-Word Headings & Controls
    heroHeading: {
      type: String,
      default: '[Super#ff6b35] [Quality#1a1a2e] [Products#2e7d32] [Here#d32f2f]'
    },
    heroWordGap: { type: String, default: '6px' },
    heroFontSize: { type: String, default: '32px' },

    saleSectionHeading: {
      type: String,
      default: '[Flash#d32f2f] [Mega#ff6b35] [Deals#1a1a2e]'
    },
    saleWordGap: { type: String, default: '6px' },
    saleFontSize: { type: String, default: '26px' },

    featuredSectionHeading: {
      type: String,
      default: '[Featured#ff6b35] [Products#1e293b]'
    },
    featuredWordGap: { type: String, default: '6px' },
    featuredFontSize: { type: String, default: '26px' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);