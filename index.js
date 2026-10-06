import { Command } from 'commander';
import fs from 'fs';

const program = new Command();

// Налаштування програми та глобальної опції
program
  .name('order-cli')
  .description('CLI-програма для роботи з системою замовлень')
  .version('1.0.0')
  .option('-f, --file ', 'Шлях до JSON-файлу з даними', 'data.json');

// Функція для завантаження даних із обробкою помилок
const loadData = () => {
  const options = program.opts();
  try {
    if (!fs.existsSync(options.file)) {
      console.error(`Помилка: Файл "${options.file}" не знайдено.`);
      process.exit(1);
    }
    const rawData = fs.readFileSync(options.file, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Помилка: Не вдалося прочитати або розібрати JSON-файл.');
    process.exit(1);
  }
};

// ================= ЗАГАЛЬНІ МОЖЛИВОСТІ =================

// 1. Перелік: Стислий список замовлень
program.command('list')
  .description('Показати стислий список замовлень')
  .option('-l, --limit ', 'Обмежити кількість виведених замовлень')
  .action((options) => {
    const data = loadData();
    let orders = data.orders;
    if (options.limit) {
      orders = orders.slice(0, parseInt(options.limit, 10));
    }
    console.table(orders.map(o => ({ id: o.id, customer: o.customer, date: o.date })));
  });

// 2. Один елемент: Показати замовлення повністю
program.command('get')
  .description('Показати всі дані конкретного замовлення за ID')
  .argument('', 'Ідентифікатор замовлення')
  .action((id) => {
    const data = loadData();
    const order = data.orders.find(o => o.id === id);
    if (!order) {
      console.error(`Помилка: Замовлення з ID ${id} не знайдено.`);
      process.exit(1);
    }
    console.log(JSON.stringify(order, null, 2));
  });

// 3. Окреме поле: Показати конкретне поле
program.command('field')
  .description('Показати значення окремого поля замовлення')
  .argument('', 'Ідентифікатор замовлення')
  .argument('', 'Назва поля (наприклад, customer або date)')
  .action((id, field) => {
    const data = loadData();
    const order = data.orders.find(o => o.id === id);
    if (!order) {
      console.error(`Помилка: Замовлення з ID ${id} не знайдено.`);
      process.exit(1);
    }
    if (order[field] === undefined) {
      console.error(`Помилка: Поле "${field}" відсутнє у цьому замовленні.`);
      process.exit(1);
    }
    console.log(order[field]);
  });

// ================= МОЖЛИВОСТІ 5 ВАРІАНТА =================

// 1. Позиції замовлення із сумою за кожну та сортуванням
program.command('items')
  .description('Показати позиції замовлення із сумою за кожну')
  .argument('', 'Ідентифікатор замовлення')
  .option('-s, --sort', 'Відсортувати за сумою (за спаданням)')
  .action((id, options) => {
    const data = loadData();
    const order = data.orders.find(o => o.id === id);
    if (!order) {
      console.error(`Помилка: Замовлення з ID ${id} не знайдено.`);
      process.exit(1);
    }
    
    // Рахуємо суму для кожної позиції (ціна * кількість)
    let itemsInfo = order.items.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total_item_sum: item.price * item.quantity
    }));

    // Сортування (прапорець)
    if (options.sort) {
      itemsInfo.sort((a, b) => b.total_item_sum - a.total_item_sum);
    }
    
    console.table(itemsInfo);
  });

// 2. Загальна сума замовлення
program.command('total')
  .description('Порахувати загальну суму замовлення (товари + доставка)')
  .argument('', 'Ідентифікатор замовлення')
  .action((id) => {
    const data = loadData();
    const order = data.orders.find(o => o.id === id);
    if (!order) {
      console.error(`Помилка: Замовлення з ID ${id} не знайдено.`);
      process.exit(1);
    }

    const itemsSum = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCost = order.delivery.cost;
    const total = itemsSum + deliveryCost;

    console.log(`Замовлення ID: ${id}`);
    console.log(`Сума товарів: ${itemsSum} грн`);
    console.log(`Вартість доставки: ${deliveryCost} грн`);
    console.log(`ЗАГАЛЬНА СУМА: ${total} грн`);
  });

// 3. Зведення про доставку й оплату
program.command('summary')
  .description('Показати зведення про доставку й оплату замовлення')
  .argument('', 'Ідентифікатор замовлення')
  .action((id) => {
    const data = loadData();
    const order = data.orders.find(o => o.id === id);
    if (!order) {
      console.error(`Помилка: Замовлення з ID ${id} не знайдено.`);
      process.exit(1);
    }

    console.log(`📦 Доставка: ${order.delivery.method}, ${order.delivery.address} (Вартість: ${order.delivery.cost} грн)`);
console.log(`💳 Оплата: ${order.payment.method} (Статус: ${order.payment.status})`);
  });

program.parse();