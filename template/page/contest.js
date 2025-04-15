export const ContestPage = async () => {
    const products = await mockApiGetProducts();
    return `
      <h1 class="text-3xl font-bold mb-4">Mahsulotlar</h1>
      <ul class="space-y-2">
        ${products.map(p => `
          <li class="border p-3 rounded shadow-sm bg-white">
            <strong>${p.name}</strong> - $${p.price}
          </li>
        `).join('')}
      </ul>
    `;
  };