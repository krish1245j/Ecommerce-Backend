export function getSubTotal(cart) {
    let subTotal = 0;
    for (const item of cart.items) {
        subTotal += item.product.price * item.quantity;
    }
    return subTotal;
}
export function getTotalQuantity(cart) {
    let totalQuantity = 0;

    for (const item of cart.items) {
        totalQuantity += item.quantity;
    }

    return totalQuantity;
}