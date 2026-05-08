/**
 * seed.js — Seeds demo accounts + sample devices + activation codes.
 * Run once: node seed.js
 *
 * Phase 1 Demo Credentials:
 *   🌾 Farmer:  phone=9876543210 / password=demo123
 *   🩺 Vet:     phone=9876543211 / password=demo123  (scaffold — portal in Phase 2)
 *   🏭 Company: phone=9876543212 / password=demo123  (scaffold — portal in Phase 3)
 */

require('dotenv').config();
const mongoose         = require('mongoose');
const bcrypt           = require('bcryptjs');
const User             = require('./models/User');
const Device           = require('./models/Device');
const Alert            = require('./models/Alert');
const DeviceActivation = require('./models/DeviceActivation');
const VetAssignment    = require('./models/VetAssignment');
const logger           = require('./utils/logger');

// ── Demo accounts ─────────────────────────────────────────────────────────────
const DEMO_FARMER = {
  name: 'Ramesh Patil', phone: '9876543210', password: 'demo123',
  role: 'farmer', farmName: 'Patil Dairy Farm',
  village: 'Takli', district: 'Nashik', state: 'Maharashtra', lang: 'en',
  onboardingStep: 3, // show full dashboard, not wizard
};

const DEMO_VET = {
  name: 'Dr. Anjali Sharma', phone: '9876543211', password: 'demo123',
  role: 'veterinarian', orgName: 'Anjali Animal Clinic',
  village: 'Nashik', district: 'Nashik', state: 'Maharashtra', lang: 'en',
};

const DEMO_COMPANY = {
  name: 'Sahyadri Dairy Co-op', phone: '9876543212', password: 'demo123',
  role: 'company', orgName: 'Sahyadri Dairy Cooperative',
  village: 'Pune', district: 'Pune', state: 'Maharashtra', lang: 'en',
};

// ── Demo devices (linked to farmer) ──────────────────────────────────────────
const DEMO_DEVICES = [
  { collarId: 'SC-1001', linkedCowId: 'COW001', battery: 85, signal: 92, temp: 38.2, activity: 72,  status: 'online',  firmware: 'v2.3.2' },
  { collarId: 'SC-1002', linkedCowId: 'COW002', battery: 60, signal: 78, temp: 38.8, activity: 45,  status: 'online',  firmware: 'v2.3.2' },
  { collarId: 'SC-1003', linkedCowId: 'COW003', battery: 42, signal: 85, temp: 38.5, activity: 61,  status: 'online',  firmware: 'v2.3.2' },
  { collarId: 'SC-1004', linkedCowId: 'COW004', battery: 33, signal: 88, temp: 40.1, activity: 20,  status: 'online',  firmware: 'v2.3.2' }, // Durga — fever!
  { collarId: 'SC-1005', linkedCowId: 'COW005', battery: 91, signal: 95, temp: 38.3, activity: 68,  status: 'online',  firmware: 'v2.3.2' },
  { collarId: 'SC-1006', linkedCowId: 'COW006', battery: 12, signal: 0,  temp: 38.1, activity: 0,   status: 'offline', firmware: 'v2.3.2' }, // Sita — offline + low battery
];

// ── Pre-seeded activation codes (plain text stored — hashed before saving) ──
const ACTIVATION_CODES = [
  { collarId: 'SC-2001', code: 'NIRAL-TEST-01', productType: 'buy' },
  { collarId: 'SC-2002', code: 'NIRAL-TEST-02', productType: 'buy' },
  { collarId: 'SC-2003', code: 'NIRAL-TEST-03', productType: 'buy' },
  { collarId: 'SC-2004', code: 'NIRAL-TEST-04', productType: 'buy' },
  { collarId: 'SC-2005', code: 'NIRAL-TEST-05', productType: 'buy' },
  { collarId: 'SC-2006', code: 'NIRAL-RENT-01', productType: 'rent', rentExpiresAt: new Date(Date.now() + 90 * 86400000) },
  { collarId: 'SC-2007', code: 'NIRAL-RENT-02', productType: 'rent', rentExpiresAt: new Date(Date.now() + 90 * 86400000) },
  { collarId: 'SC-2008', code: 'NIRAL-RENT-03', productType: 'rent', rentExpiresAt: new Date(Date.now() + 90 * 86400000) },
  { collarId: 'SC-2009', code: 'NIRAL-TEST-09', productType: 'buy' },
  { collarId: 'SC-2010', code: 'NIRAL-TEST-10', productType: 'buy' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    logger.info('Connected to MongoDB');

    // ── Upsert demo farmer ────────────────────────────────────────────────────
    let farmer = await User.findOne({ phone: DEMO_FARMER.phone });
    if (!farmer) {
      farmer = await User.create(DEMO_FARMER);
      logger.info(`✅ Demo farmer created: ${DEMO_FARMER.phone}`);
    } else {
      // Update existing to add role and onboardingStep
      await User.updateOne({ _id: farmer._id }, {
        $set: { role: 'farmer', onboardingStep: 3, farmName: DEMO_FARMER.farmName }
      });
      farmer = await User.findById(farmer._id);
      logger.info(`ℹ️  Demo farmer updated with role: ${DEMO_FARMER.phone}`);
    }

    // ── Upsert demo vet ───────────────────────────────────────────────────────
    const existingVet = await User.findOne({ phone: DEMO_VET.phone });
    if (!existingVet) {
      await User.create(DEMO_VET);
      logger.info(`✅ Demo vet created: ${DEMO_VET.phone}`);
    } else {
      logger.info(`ℹ️  Demo vet already exists: ${DEMO_VET.phone}`);
    }

    // ── Upsert demo company ───────────────────────────────────────────────────
    const existingCompany = await User.findOne({ phone: DEMO_COMPANY.phone });
    if (!existingCompany) {
      await User.create(DEMO_COMPANY);
      logger.info(`✅ Demo company created: ${DEMO_COMPANY.phone}`);
    } else {
      logger.info(`ℹ️  Demo company already exists: ${DEMO_COMPANY.phone}`);
    }

    // ── Upsert demo devices ───────────────────────────────────────────────────
    let devicesCreated = 0;
    for (const dev of DEMO_DEVICES) {
      const existing = await Device.findOne({ userId: farmer._id, collarId: dev.collarId });
      if (!existing) {
        await Device.create({
          ...dev,
          userId:       farmer._id,
          deviceStatus: 'active',
          activatedAt:  new Date(),
          activatedBy:  farmer._id,
          lastSync:     Date.now(),
          deviceHistory: [{ userId: farmer._id, fromDate: new Date(), reason: 'activation' }],
        });
        devicesCreated++;
      }
    }
    logger.info(`✅ ${devicesCreated} new devices seeded (${DEMO_DEVICES.length - devicesCreated} already existed)`);

    // ── Seed activation codes ─────────────────────────────────────────────────
    let codesCreated = 0;
    for (const ac of ACTIVATION_CODES) {
      const existing = await DeviceActivation.findOne({ collarId: ac.collarId });
      if (!existing) {
        const hashedCode = await bcrypt.hash(ac.code, 10);
        await DeviceActivation.create({
          collarId:       ac.collarId,
          activationCode: hashedCode,
          productType:    ac.productType,
          rentExpiresAt:  ac.rentExpiresAt || null,
        });
        codesCreated++;
      }
    }
    logger.info(`✅ ${codesCreated} activation codes seeded (${ACTIVATION_CODES.length - codesCreated} already existed)`);

    // ── Seed critical fever alert for Durga (SC-1004, temp 40.1°C) ───────────
    const cooldownKey = 'fever_critical-SC-1004-farmer';
    const feverAlert  = await Alert.findOne({ userId: farmer._id, cooldownKey });
    if (!feverAlert) {
      await Alert.create({
        userId:         farmer._id,
        cowId:          'COW004',
        cowName:        'Durga',
        clientId:       `SEED-FEVER-SC-1004`,
        type:           'critical',
        priority:       'critical',
        actionRequired: true,
        title:          '🔥 Fever: Durga',
        desc:           'Durga temperature is 40.1°C — severe fever. Normal: 38–39.5°C.',
        action:         'Administer antipyretics immediately. Call vet. Estimated loss: ₹630/day.',
        impactRs:       630,
        targetRole:     'farmer',
        cooldownKey,
        cooldownUntil:  new Date(Date.now() + 4 * 3600000),
        source:         'iot',
        time:           Date.now() - 1800000,
        resolved:       false,
      });
      logger.info('✅ Sample fever alert seeded for Durga');
    }

    // ── Auto-link demo vet ↔ demo farmer ──────────────────────────────────────
    const vetUser = await User.findOne({ phone: DEMO_VET.phone });
    if (farmer && vetUser) {
      const existingLink = await VetAssignment.findOne({ vetId: vetUser._id, farmerId: farmer._id });
      if (!existingLink) {
        await VetAssignment.create({
          vetId: vetUser._id, farmerId: farmer._id,
          initiatedBy: 'vet', status: 'accepted', respondedAt: new Date(),
          message: 'Demo vet-farmer link (auto-seeded)',
        });
        logger.info('✅ Demo vet-farmer link created (accepted)');
      } else {
        // Ensure it's accepted
        if (existingLink.status !== 'accepted') {
          existingLink.status = 'accepted'; existingLink.respondedAt = new Date();
          await existingLink.save();
        }
        logger.info('ℹ️  Demo vet-farmer link already exists');
      }
    }

    logger.info('🌱 Seed complete!\n');
    logger.info('  ┌─────────────────────────────────────────────────────────────┐');
    logger.info('  │  Demo Login Credentials                                     │');
    logger.info('  ├─────────────────────────────────────────────────────────────┤');
    logger.info(`  │  🌾 Farmer:  ${DEMO_FARMER.phone} / demo123                       │`);
    logger.info(`  │  🩺 Vet:     ${DEMO_VET.phone} / demo123  (Phase 2 portal)  │`);
    logger.info(`  │  🏭 Company: ${DEMO_COMPANY.phone} / demo123  (Phase 3 portal)  │`);
    logger.info('  ├─────────────────────────────────────────────────────────────┤');
    logger.info('  │  Test activation: collarId=SC-2001, code=NIRAL-TEST-01      │');
    logger.info('  └─────────────────────────────────────────────────────────────┘\n');
  } catch (err) {
    logger.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
