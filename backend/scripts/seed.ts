/**
 * FreshLeaf Optional Development Seed Script
 * 
 * IMPORTANT SAFETY RULES:
 * - This script must NEVER run automatically.
 * - This script must NEVER delete existing data (no deleteMany, no drop).
 * - Requires explicit manual execution with: npx tsx backend/scripts/seed.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB, DB_NAME } from '../config/db';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Inventory } from '../models/Inventory';
import { Ingredient } from '../models/Ingredient';
import { INITIAL_DRINKS, INITIAL_INGREDIENTS } from '../../src/data/mockData';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config();

async function runManualSeed() {
  console.log('--- FreshLeaf Manual Non-Destructive Seed ---');
  console.log('Connecting to database:', DB_NAME);

  const connected = await connectDB();
  if (!connected) {
    console.error('Cannot run seed: MongoDB Atlas connection failed.');
    process.exit(1);
  }

  try {
    // 1. Categories - check before insert
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      console.log('Seeding initial categories (collection empty)...');
      await Category.insertMany([
        { _id: 'CAT01', code: 'CAT01', name: 'Sinh tố', description: 'Sinh tố tươi nguyên chất', displayOrder: 1 },
        { _id: 'CAT02', code: 'CAT02', name: 'Nước ép', description: 'Nước ép trái cây vắt tươi', displayOrder: 2 },
        { _id: 'CAT03', code: 'CAT03', name: 'Combo', description: 'Combo nước ép & sinh tố', displayOrder: 3 },
      ]);
    } else {
      console.log(`Categories collection already contains ${catCount} records. Skipping.`);
    }

    // 2. Products - check before insert
    const prodCount = await Product.countDocuments();
    if (prodCount === 0) {
      console.log('Seeding initial products (collection empty)...');
      await Product.insertMany(
        INITIAL_DRINKS.map((d, idx) => ({
          _id: `P${String(idx + 1).padStart(3, '0')}`,
          name: d.name,
          categoryId: d.category === 'smoothie' ? 'CAT01' : d.category === 'fresh_juice' ? 'CAT02' : 'CAT03',
          category: d.category,
          price: d.basePrice,
          basePrice: d.basePrice,
          status: 'available',
          isAvailable: true,
          tagline: d.tagline,
          description: d.description,
          themeColor: d.themeColor,
          bgGradient: d.bgGradient,
          ingredients: d.ingredients,
          calories: d.calories,
          prepTimeMin: d.prepTimeMin,
          isFeatured: d.isFeatured,
          isPopular: d.isPopular,
          nutrition: d.nutrition,
          benefits: d.benefits,
        }))
      );
    } else {
      console.log(`Products collection already contains ${prodCount} records. Skipping.`);
    }

    // 3. Ingredients & Inventory - check before insert
    const ingCount = await Ingredient.countDocuments();
    if (ingCount === 0) {
      console.log('Seeding ingredients & inventory (collections empty)...');
      for (let i = 0; i < INITIAL_INGREDIENTS.length; i++) {
        const item = INITIAL_INGREDIENTS[i];
        const ingId = `I${String(i + 1).padStart(3, '0')}`;
        await Ingredient.create({
          _id: ingId,
          name: item.name,
          unit: item.unit,
          category: item.category,
          costPerUnit: item.costPerUnit,
        });
        await Inventory.create({
          _id: `INV${String(i + 1).padStart(3, '0')}`,
          ingredientId: ingId,
          quantity: item.currentStock,
          minStock: item.minThreshold,
          unit: item.unit,
        });
      }
    } else {
      console.log(`Ingredients collection already contains ${ingCount} records. Skipping.`);
    }

    console.log('Manual seed check completed safely without data loss.');
  } catch (err: any) {
    console.error('Error during manual seed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

if (process.argv[1].endsWith('seed.ts')) {
  runManualSeed();
}
