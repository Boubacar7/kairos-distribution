import { PrismaClient, Role, ProductStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('kairos2026', 12);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', email: 'admin@kairos.local', passwordHash, role: Role.OWNER },
  });

  const products = [
    { slug: 'glow-skin-creme', name: 'Glow Skin Crème', category: 'Beauté', price: 24900, stock: 42, description: 'Hydratation quotidienne et éclat durable pour tous types de peau.' },
    { slug: 'trim-active-plus', name: 'Trim Active Plus', category: 'Amincissant', price: 18500, promo: 10, stock: 35, description: 'Formule minceur renforcée à base d\'ingrédients naturels.' },
    { slug: 'silhouette-elite', name: 'Silhouette Elite', category: 'Amincissant', price: 29900, stock: 20, description: 'Programme minceur avancé pour résultats visibles.' },
    { slug: 'velvet-glow-serum', name: 'Velvet Glow Serum', category: 'Beauté', price: 21500, promo: 15, stock: 50, description: 'Sérum anti-âge à l\'acide hyaluronique.' },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, status: ProductStatus.PUBLISHED },
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

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
