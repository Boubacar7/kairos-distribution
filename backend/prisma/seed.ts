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
      description: "Hydratation intense, éclat visible en 7 jours. Soin quotidien enrichi en huile d'argan, acide hyaluronique et vitamine E. 50 ml.",
    },
    {
      slug: 'trim-active',
      name: 'Trim Active Plus',
      category: 'Amincissant',
      price: 18500,
      stock: 35,
      image: '/products/trim-active.png',
      description: 'Programme silhouette 28 jours. Complexe drainant à base de plantes, formule non-stimulante. 60 gélules.',
    },
    {
      slug: 'curve-up',
      name: 'Curve Up Gel',
      category: 'Postérieur',
      price: 27500,
      stock: 20,
      image: '/products/curve-up.png',
      description: 'Routine tonifiante et raffermissante. Gel à la caféine végétale et beurre de karité. 200 ml.',
    },
    {
      slug: 'lip-glow',
      name: 'Lip & Glow Set',
      category: 'Promo',
      price: 15900,
      promo: 22000,
      stock: 28,
      image: null,
      description: 'Pack découverte lèvres + visage. Baume lèvres teinté + huile visage illuminatrice. Pack 2 produits.',
    },
    {
      slug: 'velvet-body',
      name: 'Velvet Body Milk',
      category: 'Beauté',
      price: 12900,
      stock: 60,
      image: null,
      description: 'Lait corps soyeux karité + coco. Ultra-nourrissant, parfum fleur de coton. 250 ml.',
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
      slug: 'slim-tea',
      name: 'Slim Detox Tea',
      category: 'Amincissant',
      price: 9500,
      stock: 80,
      image: null,
      description: 'Infusion drainante 21 jours. Mélange artisanal de plantes, une infusion matin et soir. 21 sachets.',
    },
    {
      slug: 'shape-mask',
      name: 'Shape & Firm Masque',
      category: 'Postérieur',
      price: 19900,
      stock: 25,
      image: '/products/shape-mask.png',
      description: 'Masque raffermissant express 20 min. Intensif, à poser 2 fois par semaine. 150 ml.',
    },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        image: p.image,
        category: p.category,
        price: p.price,
        promo: p.promo ?? 0,
        stock: p.stock,
        description: p.description,
        status: ProductStatus.PUBLISHED,
      },
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

  console.log(`Seed OK — ${products.length} produits, admin/kairos2026`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
