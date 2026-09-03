const express = require('express');
const Settings = require('../models/Settings');
const { protectAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

async function getOrCreateSettings() {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  return settings;
}

// GET /api/settings - public
router.get('/', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/settings - admin only (Supports image upload for header icon if needed)
router.put('/', protectAdmin, upload.single('headerIconFile'), async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    const updateFields = [
      'storeName',
      'contactPhone',
      'contactEmail',
      'address',
      'whatsapp',
      'contactAnimation',
      'primaryColor',
      'primaryDarkColor',
      'bodyBg',
      'textColor',
      'cardBg',
      'fontFamily',
      'fontSizeBase',
      'headerIcon',
      'headerIconType',
      'headerIconPosition',
      'headerIconSize',
      'headerWordGap',
      'headerBg',
      'headerText',
      'burgerIconColor',
      'burgerDrawerBg',
      'burgerLinkColor',
      'burgerLinkAnim',
      'showBurgerContactInfo',
      'footerBg',
      'footerTextColor',
      'heroSectionBg',
      'saleSectionBg',
      'featuredSectionBg',
      'heroHeading',
      'heroWordGap',
      'heroFontSize',
      'saleSectionHeading',
      'saleWordGap',
      'saleFontSize',
      'featuredSectionHeading',
      'featuredWordGap',
      'featuredFontSize'
    ];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    if (req.file) {
      settings.headerIcon = `/uploads/${req.file.filename}`;
      settings.headerIconType = 'image';
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/settings/banners - admin only
router.post('/banners', protectAdmin, upload.single('image'), async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    if (!req.file) return res.status(400).json({ message: 'Banner image is required' });

    settings.banners.push({
      image: `/uploads/${req.file.filename}`,
      title: req.body.title || '',
      subtitle: req.body.subtitle || '',
      link: req.body.link || '',
      bgColor: req.body.bgColor || '#ffffff',
      textColor: req.body.textColor || '#111111',
    });
    await settings.save();
    res.status(201).json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/settings/banners/:bannerId - admin only
router.delete('/banners/:bannerId', protectAdmin, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    settings.banners = settings.banners.filter((b) => b._id.toString() !== req.params.bannerId);
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;