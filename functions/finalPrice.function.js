const calculateFinalPrice = (basePrice, discountRules, taxCategory) => {
  let finalPrice = basePrice;

  discountRules
    .filter((d) => d.stackable)
    .forEach((discount) => {
      if (discount.type === "fixed") {
        finalPrice -= discount.value;
      } else if (discount.type === "percentage") {
        finalPrice -= finalPrice * (discount.value / 100); // Apply percentage discount
      }
    });

  // Apply non-stackable discounts
  discountRules
    .filter((d) => !d.stackable)
    .forEach((discount) => {
      if (discount.type === "fixed") {
        finalPrice -= discount.value;
      } else if (discount.type === "percentage") {
        finalPrice -= finalPrice * (discount.value / 100); // Apply percentage discount
      }
    });

  // Ensure the final price is not negative
  finalPrice = Math.max(0, finalPrice);

  if (taxCategory === "basic") {
    finalPrice += finalPrice * 0.1; 
  } else if (taxCategory === "luxury") {
    finalPrice += finalPrice * 0.2; x
  } else if (taxCategory === "zero-tax") {
    finalPrice = finalPrice;
  }

  return finalPrice;
};

module.exports = calculateFinalPrice;
