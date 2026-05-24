import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    id: "product-headphones",
    name: "Wireless Noise-Cancelling Headphones",
    sku: "WH-1000",
    description:
      "Premium wireless headphones with active noise cancellation and 30-hour battery life.",
    price: 12999,
    images: [
      "/images/products/product-headphones/image-1.png",
      "/images/products/product-headphones/image-2.png",
      "/images/products/product-headphones/image-3.png",
    ].join(","),
  },
  {
    id: "product-keyboard",
    name: "Mechanical Keyboard TKL",
    sku: "MK-TKL-87",
    description:
      "Full programmable mechanical keyboard with RGB switches, compact TKL layout.",
    price: 7499,
    images: [
      "/images/products/product-keyboard/image-1.png",
      "/images/products/product-keyboard/image-2.png",
      "/images/products/product-keyboard/image-3.png",
    ].join(","),
  },
  {
    id: "product-hub",
    name: "USB-C 7-Port Hub",
    sku: "HUB-7C",
    description:
      "Compact 7-port USB-C hub with high-speed data transfer and fast charging.",
    price: 3499,
    images: [
      "/images/products/product-hub/image-1.png",
      "/images/products/product-hub/image-2.png",
      "/images/products/product-hub/image-3.png",
    ].join(","),
  },
  {
    id: "product-mouse",
    name: "Wireless Mouse Pro",
    sku: "MOUSE-PRO",
    description:
      "Ergonomic wireless mouse with precision tracking and multi-device support.",
    price: 2599,
    images: [
      "/images/products/product-mouse/image-1.png",
      "/images/products/product-mouse/image-2.png",
      "/images/products/product-mouse/image-3.png",
    ].join(","),
  },
  {
    id: "product-cable",
    name: "USB-C Cable 2m",
    sku: "CABLE-2M",
    description:
      "Durable 2m USB-C cable supporting fast charging and high-speed data transfer.",
    price: 799,
    images: [
      "/images/products/product-cable/image-1.png",
      "/images/products/product-cable/image-2.png",
      "/images/products/product-cable/image-3.png",
    ].join(","),
  },
  {
    id: "product-stand",
    name: "Laptop Stand Aluminum",
    sku: "STAND-ALU",
    description:
      "Adjustable aluminum laptop stand with ergonomic design for improved posture.",
    price: 4999,
    images: [
      "/images/products/product-stand/image-1.png",
      "/images/products/product-stand/image-2.png",
      "/images/products/product-stand/image-3.png",
    ].join(","),
  },
  {
    id: "product-phonestand",
    name: "Phone Stand Premium",
    sku: "PHONE-STAND",
    description:
      "Lightweight phone stand with adjustable angles, perfect for streaming and video calls.",
    price: 1499,
    images: [
      "/images/products/product-phonestand/image-1.png",
      "/images/products/product-phonestand/image-2.png",
      "/images/products/product-phonestand/image-3.png",
    ].join(","),
  },
  {
    id: "product-ssd",
    name: "Portable SSD 1TB",
    sku: "SSD-1TB",
    description:
      "Ultra-fast 1TB portable SSD with rugged design and USB-C connectivity.",
    price: 8999,
    images: [
      "/images/products/product-ssd/image-1.png",
      "/images/products/product-ssd/image-2.png",
      "/images/products/product-ssd/image-3.png",
    ].join(","),
  },
];

async function main() {
  const mumbaiWarehouse = await prisma.warehouse.upsert({
    where: { id: "warehouse-mumbai" },
    update: {},
    create: {
      id: "warehouse-mumbai",
      name: "Mumbai Central",
      location: "Mumbai, Maharashtra",
    },
  });

  const delhiWarehouse = await prisma.warehouse.upsert({
    where: { id: "warehouse-delhi" },
    update: {},
    create: {
      id: "warehouse-delhi",
      name: "Delhi North",
      location: "Delhi, NCR",
    },
  });

  const bangaloreWarehouse = await prisma.warehouse.upsert({
    where: { id: "warehouse-bangalore" },
    update: {},
    create: {
      id: "warehouse-bangalore",
      name: "Bangalore South",
      location: "Bangalore, Karnataka",
    },
  });

  console.log("✓ Warehouses seeded:", {
    mumbai: mumbaiWarehouse.id,
    delhi: delhiWarehouse.id,
    bangalore: bangaloreWarehouse.id,
  });

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        description: product.description,
        price: product.price,
        images: product.images,
      },
      create: product,
    });
  }

  console.log("✓ Products seeded:", products.length);

  const inventoryRecords = [
    { id: "inv-headphones-mumbai", productId: "product-headphones", warehouseId: "warehouse-mumbai", totalQuantity: 15 },
    { id: "inv-headphones-delhi", productId: "product-headphones", warehouseId: "warehouse-delhi", totalQuantity: 8 },
    { id: "inv-headphones-bangalore", productId: "product-headphones", warehouseId: "warehouse-bangalore", totalQuantity: 12 },
    { id: "inv-keyboard-mumbai", productId: "product-keyboard", warehouseId: "warehouse-mumbai", totalQuantity: 6 },
    { id: "inv-keyboard-delhi", productId: "product-keyboard", warehouseId: "warehouse-delhi", totalQuantity: 3 },
    { id: "inv-keyboard-bangalore", productId: "product-keyboard", warehouseId: "warehouse-bangalore", totalQuantity: 9 },
    { id: "inv-hub-mumbai", productId: "product-hub", warehouseId: "warehouse-mumbai", totalQuantity: 1 },
    { id: "inv-hub-delhi", productId: "product-hub", warehouseId: "warehouse-delhi", totalQuantity: 20 },
    { id: "inv-hub-bangalore", productId: "product-hub", warehouseId: "warehouse-bangalore", totalQuantity: 5 },
    { id: "inv-mouse-mumbai", productId: "product-mouse", warehouseId: "warehouse-mumbai", totalQuantity: 25 },
    { id: "inv-mouse-delhi", productId: "product-mouse", warehouseId: "warehouse-delhi", totalQuantity: 18 },
    { id: "inv-mouse-bangalore", productId: "product-mouse", warehouseId: "warehouse-bangalore", totalQuantity: 22 },
    { id: "inv-cable-mumbai", productId: "product-cable", warehouseId: "warehouse-mumbai", totalQuantity: 50 },
    { id: "inv-cable-delhi", productId: "product-cable", warehouseId: "warehouse-delhi", totalQuantity: 40 },
    { id: "inv-cable-bangalore", productId: "product-cable", warehouseId: "warehouse-bangalore", totalQuantity: 45 },
    { id: "inv-stand-mumbai", productId: "product-stand", warehouseId: "warehouse-mumbai", totalQuantity: 10 },
    { id: "inv-stand-delhi", productId: "product-stand", warehouseId: "warehouse-delhi", totalQuantity: 7 },
    { id: "inv-stand-bangalore", productId: "product-stand", warehouseId: "warehouse-bangalore", totalQuantity: 14 },
    { id: "inv-phonestand-mumbai", productId: "product-phonestand", warehouseId: "warehouse-mumbai", totalQuantity: 30 },
    { id: "inv-phonestand-delhi", productId: "product-phonestand", warehouseId: "warehouse-delhi", totalQuantity: 24 },
    { id: "inv-phonestand-bangalore", productId: "product-phonestand", warehouseId: "warehouse-bangalore", totalQuantity: 28 },
    { id: "inv-ssd-mumbai", productId: "product-ssd", warehouseId: "warehouse-mumbai", totalQuantity: 8 },
    { id: "inv-ssd-delhi", productId: "product-ssd", warehouseId: "warehouse-delhi", totalQuantity: 6 },
    { id: "inv-ssd-bangalore", productId: "product-ssd", warehouseId: "warehouse-bangalore", totalQuantity: 11 },
  ];

  for (const record of inventoryRecords) {
    await prisma.inventory.upsert({
      where: {
        productId_warehouseId: {
          productId: record.productId,
          warehouseId: record.warehouseId,
        },
      },
      update: {
        totalQuantity: record.totalQuantity,
      },
      create: {
        id: record.id,
        productId: record.productId,
        warehouseId: record.warehouseId,
        totalQuantity: record.totalQuantity,
        reservedQuantity: 0,
      },
    });
  }

  console.log("✓ Inventory seeded:", inventoryRecords.length, "records");
  console.log("Seed completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
