import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  console.log("✓ Warehouses seeded:", {
    mumbai: mumbaiWarehouse.id,
    delhi: delhiWarehouse.id,
  });
  
  const headphones = await prisma.product.upsert({
    where: { id: "product-headphones" },
    update: {},
    create: {
      id: "product-headphones",
      name: "Wireless Noise-Cancelling Headphones",
      sku: "WH-1000",
    },
  });

  const keyboard = await prisma.product.upsert({
    where: { id: "product-keyboard" },
    update: {},
    create: {
      id: "product-keyboard",
      name: "Mechanical Keyboard TKL",
      sku: "MK-TKL-87",
    },
  });

  const hub = await prisma.product.upsert({
    where: { id: "product-hub" },
    update: {},
    create: {
      id: "product-hub",
      name: "USB-C 7-Port Hub",
      sku: "HUB-7C",
    },
  });

  console.log("✓ Products seeded:", {
    headphones: headphones.id,
    keyboard: keyboard.id,
    hub: hub.id,
  });
  
  const inventoryRecords = [
    {
      id: "inv-headphones-mumbai",
      productId: "product-headphones",
      warehouseId: "warehouse-mumbai",
      totalQuantity: 15,
    },
    {
      id: "inv-headphones-delhi",
      productId: "product-headphones",
      warehouseId: "warehouse-delhi",
      totalQuantity: 8,
    },
    {
      id: "inv-keyboard-mumbai",
      productId: "product-keyboard",
      warehouseId: "warehouse-mumbai",
      totalQuantity: 6,
    },
    {
      id: "inv-keyboard-delhi",
      productId: "product-keyboard",
      warehouseId: "warehouse-delhi",
      totalQuantity: 3,
    },
    {
      id: "inv-hub-mumbai",
      productId: "product-hub",
      warehouseId: "warehouse-mumbai",
      totalQuantity: 1,
    },
    {
      id: "inv-hub-delhi",
      productId: "product-hub",
      warehouseId: "warehouse-delhi",
      totalQuantity: 20,
    },
  ];

  for (const record of inventoryRecords) {
    const inventory = await prisma.inventory.upsert({
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
