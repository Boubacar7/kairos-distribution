import { PrismaClient, Role, ProductStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('kairos2026', 12);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', email: 'admin@kairos.sn', passwordHash, role: Role.OWNER },
  });

  const products = [
    {
      slug: 'glow-skin',
      name: 'Glow Skin Crème',
      category: 'Beauté',
      price: 24900,
      promo: 32000,
      stock: 42,
      image: '/products/glow-skin.png',
      description: "Hydratation intense, éclat visible en 7 jours. Soin quotidien enrichi en huile d'argan, acide hyaluronique et vitamine E.",
    },
    {
      slug: 'trim-active',
      name: 'Trim Active Plus',
      category: 'Amincissant',
      price: 18500,
      stock: 35,
      image: '/products/trim-active.png',
      description: 'Programme silhouette 28 jours. Complexe drainant à base de plantes, formule non-stimulante.',
    },
    {
      slug: 'curve-up',
      name: 'Curve Up Gel',
      category: 'Postérieur',
      price: 27500,
      stock: 20,
      image: '/products/curve-up.png',
      description: 'Routine tonifiante et raffermissante. Gel à la caféine végétale et beurre de karité.',
    },
    {
      slug: 'confidence',
      name: 'Confidence Kit',
      category: 'Promo',
      price: 54000,
      promo: 72000,
      stock: 12,
      image: '/products/confidence.png',
      description: 'Rituel complet beauté + silhouette. Coffret signature, 5 produits hero, livraison offerte.',
    },
    {
      slug: 'shape-mask',
      name: 'Shape & Firm Masque',
      category: 'Postérieur',
      price: 19900,
      stock: 25,
      image: '/products/shape-mask.png',
      description: 'Masque raffermissant express 20 min. À poser 2 fois par semaine.',
    },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { image: p.image, category: p.category, price: p.price, promo: p.promo ?? 0 },
      create: { ...p, promo: p.promo ?? 0, status: ProductStatus.PUBLISHED },
    });
  }

  await prisma.zone.createMany({
    data: [
      { name: 'Dakar Centre', fee: 1500 },
      { name: 'Banlieue', fee: 2500 },
      { name: 'Régions', fee: 4000 },
    ],
    skipDuplicates: true,
  });

  console.log('Seed OK — admin/kairos2026');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
