/**
 * Export des produits au format CSV Shopify.
 *
 * Usage :
 *   npx ts-node prisma/export-shopify.ts [--public-url=https://kairos.sn]
 *
 * Ou depuis la racine du repo :
 *   ./scripts/export-shopify.sh
 *
 * Le fichier est écrit dans /app/exports/shopify-products.csv (dans le
 * conteneur backend) qui est monté sur <repo>/backend/exports/ grâce au volume
 * docker-compose.
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const publicUrlArg = process.argv.find((a) => a.startsWith('--public-url='));
const PUBLIC_URL = publicUrlArg
  ? publicUrlArg.split('=')[1].replace(/\/$/, '')
  : process.env.PUBLIC_URL || '';

const CATEGORY_TAGS: Record<string, string[]> = {
  Beauté: ['beaute', 'soin-visage'],
  Amincissant: ['silhouette', 'minceur'],
  Postérieur: ['tonification', 'postérieur'],
  Promo: ['promo'],
};

const SHOPIFY_COLUMNS = [
  'Handle',
  'Title',
  'Body (HTML)',
  'Vendor',
  'Product Category',
  'Type',
  'Tags',
  'Published',
  'Option1 Name',
  'Option1 Value',
  'Option2 Name',
  'Option2 Value',
  'Option3 Name',
  'Option3 Value',
  'Variant SKU',
  'Variant Grams',
  'Variant Inventory Tracker',
  'Variant Inventory Qty',
  'Variant Inventory Policy',
  'Variant Fulfillment Service',
  'Variant Price',
  'Variant Compare At Price',
  'Variant Requires Shipping',
  'Variant Taxable',
  'Variant Barcode',
  'Image Src',
  'Image Position',
  'Image Alt Text',
  'Gift Card',
  'SEO Title',
  'SEO Description',
  'Google Shopping / Google Product Category',
  'Google Shopping / Gender',
  'Google Shopping / Age Group',
  'Google Shopping / MPN',
  'Google Shopping / Condition',
  'Google Shopping / Custom Product',
  'Variant Image',
  'Variant Weight Unit',
  'Variant Tax Code',
  'Cost per item',
  'Included / United States',
  'Price / United States',
  'Compare At Price / United States',
  'Included / International',
  'Price / International',
  'Compare At Price / International',
  'Status',
];

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildImageSrc(image: string | null | undefined): string {
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  if (!PUBLIC_URL) return image;
  return `${PUBLIC_URL}${image.startsWith('/') ? image : '/' + image}`;
}

async function main() {
  const products = await prisma.product.findMany({
    include: { variants: true },
    orderBy: { createdAt: 'asc' },
  });

  const rows: string[][] = [];

  for (const p of products) {
    const tags = CATEGORY_TAGS[p.category] || [p.category.toLowerCase()];
    const imageSrc = buildImageSrc(p.image);
    const hasVariants = p.variants.length > 0;
    const compareAtPrice = p.promo && p.promo > p.price ? p.promo : '';

    const baseRow: Record<string, string | number | ''> = {
      Handle: p.slug,
      Title: p.name,
      'Body (HTML)': p.description ? `<p>${p.description.replace(/\n/g, '</p><p>')}</p>` : '',
      Vendor: 'Kairos Distribution',
      'Product Category': 'Health & Beauty > Personal Care > Cosmetics',
      Type: p.category,
      Tags: tags.join(', '),
      Published: p.status === 'PUBLISHED' ? 'TRUE' : 'FALSE',
      'Option1 Name': hasVariants ? 'Variante' : 'Title',
      'Option1 Value': hasVariants ? p.variants[0].name : 'Default Title',
      'Option2 Name': '',
      'Option2 Value': '',
      'Option3 Name': '',
      'Option3 Value': '',
      'Variant SKU': hasVariants ? '' : p.slug.toUpperCase(),
      'Variant Grams': 0,
      'Variant Inventory Tracker': 'shopify',
      'Variant Inventory Qty': hasVariants ? p.variants[0].stock : p.stock,
      'Variant Inventory Policy': 'deny',
      'Variant Fulfillment Service': 'manual',
      'Variant Price': p.price,
      'Variant Compare At Price': compareAtPrice,
      'Variant Requires Shipping': 'TRUE',
      'Variant Taxable': 'TRUE',
      'Variant Barcode': '',
      'Image Src': imageSrc,
      'Image Position': imageSrc ? 1 : '',
      'Image Alt Text': p.name,
      'Gift Card': 'FALSE',
      'SEO Title': p.name,
      'SEO Description': p.description || '',
      'Google Shopping / Google Product Category': '',
      'Google Shopping / Gender': '',
      'Google Shopping / Age Group': 'adult',
      'Google Shopping / MPN': '',
      'Google Shopping / Condition': 'new',
      'Google Shopping / Custom Product': 'FALSE',
      'Variant Image': '',
      'Variant Weight Unit': 'g',
      'Variant Tax Code': '',
      'Cost per item': '',
      'Included / United States': 'TRUE',
      'Price / United States': '',
      'Compare At Price / United States': '',
      'Included / International': 'TRUE',
      'Price / International': '',
      'Compare At Price / International': '',
      Status: p.status === 'PUBLISHED' ? 'active' : 'draft',
    };
    rows.push(SHOPIFY_COLUMNS.map((col) => csvEscape(baseRow[col] ?? '')));

    // Lignes supplémentaires pour les variantes au-delà de la première
    for (let i = 1; i < p.variants.length; i++) {
      const v = p.variants[i];
      const variantRow: Record<string, string | number | ''> = {
        ...baseRow,
        Title: '',
        'Body (HTML)': '',
        Vendor: '',
        'Product Category': '',
        Type: '',
        Tags: '',
        Published: '',
        'Option1 Value': v.name,
        'Variant SKU': '',
        'Variant Inventory Qty': v.stock,
        'Variant Price': p.price + v.priceDelta,
        'Image Src': '',
        'Image Position': '',
        'Image Alt Text': '',
      };
      rows.push(SHOPIFY_COLUMNS.map((col) => csvEscape(variantRow[col] ?? '')));
    }
  }

  const csv =
    SHOPIFY_COLUMNS.map(csvEscape).join(',') +
    '\n' +
    rows.map((r) => r.join(',')).join('\n') +
    '\n';

  const outDir = path.resolve(__dirname, '..', 'exports');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'shopify-products.csv');
  fs.writeFileSync(outPath, csv, 'utf8');

  console.log(`✓ ${products.length} produits exportés → ${outPath}`);
  console.log(`  ${rows.length} lignes CSV au total (variantes incluses)`);
  if (!PUBLIC_URL) {
    console.log(
      '\n⚠  Aucune URL publique fournie. Les chemins d\'image resteront relatifs\n' +
        '    (/products/xxx.png). Passe --public-url=https://tonsite.com pour\n' +
        '    générer des URLs absolues que Shopify pourra importer.',
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
