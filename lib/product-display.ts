type ProductDisplaySource = {
  description?: string | null;
  price?: number | null;
  images?: string | null;
};

export function resolveProductDisplay(product: ProductDisplaySource) {
  const images = product.images
    ? product.images.split(",").map((path) => path.trim()).filter(Boolean)
    : [];

  return {
    description: product.description ?? "",
    price: product.price ?? 0,
    images,
  };
}

export function formatPrice(rupees: number) {
  return `₹${rupees.toLocaleString("en-IN")}`;
}
