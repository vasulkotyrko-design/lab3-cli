import { Command } from 'commander';
import fs from 'fs';

const program = new Command();

// Налаштування програми та глобальної опції
program
  .name('bank-cli')
  .description('CLI-програма для роботи з довідником банків та підрозділів')
  .version('1.0.0')
  .option('-f, --file ', 'Шлях до JSON-файлу з даними', 'data.json');

// Функція для безпечного завантаження даних
const loadData = () => {
  const options = program.opts();
  try {
    if (!fs.existsSync(options.file)) {
      console.error(`Помилка: Файл "${options.file}" не знайдено.`);
      process.exit(1); // Ненульовий код завершення без стеку викликів
    }
    const rawData = fs.readFileSync(options.file, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Помилка: Не вдалося прочитати або розібрати JSON-файл.');
    process.exit(1);
  }
};

// ==========================================
// ЗАГАЛЬНІ МОЖЛИВОСТІ (Частина 3)
// ==========================================

// 1. Перелік: Стислий список банків
program.command('list')
  .description('Показати стислий список банків')
  .option('-l, --limit ', 'Обмежити кількість виведених банків') // Опція зі значенням
  .action((options) => {
    const data = loadData();
    let banks = data.banks;
    if (options.limit) {
      banks = banks.slice(0, parseInt(options.limit, 10));
    }
    console.table(banks.map(b => ({ id: b.id, name: b.name, headquarters: b.headquarters })));
  });

// 2. Один елемент: Показати банк за ідентифікатором
program.command('get')
  .description('Показати всі дані конкретного банку за ID')
  .argument('', 'Ідентифікатор банку') // Обов'язковий аргумент
  .action((id) => {
    const data = loadData();
    const bank = data.banks.find(b => b.id == id);
    if (!bank) {
      console.error(`Помилка: Банк з ID ${id} не знайдено.`);
      process.exit(1);
    }
    console.log(JSON.stringify(bank, null, 2));
  });

// 3. Окреме поле: Показати конкретне поле банку
program.command('field')
  .description('Показати значення окремого поля банку')
  .argument('', 'Ідентифікатор банку')
  .argument('', 'Назва поля (наприклад, name, headquarters)')
  .action((id, field) => {
    const data = loadData();
    const bank = data.banks.find(b => b.id == id);
    if (!bank) {
      console.error(`Помилка: Банк з ID ${id} не знайдено.`);
      process.exit(1);
    }
    if (bank[field] === undefined) {
      console.error(`Помилка: Поле "${field}" відсутнє у цьому банку.`);
      process.exit(1);
    }
    console.log(bank[field]);
  });

// ==========================================
// МОЖЛИВОСТІ ВАРІАНТА: Банки та підрозділи (Частина 4)
// ==========================================

// 1. Підрозділи конкретного банку (з роботою над вкладеними масивами)
program.command('branches')
  .description('Показати всі підрозділи (відділення) конкретного банку')
  .argument('', 'Ідентифікатор банку')
  .option('-a, --atm', 'Показати лише ті відділення, де є банкомат') // Прапорець (boolean)
  .action((id, options) => {
    const data = loadData();
    const bank = data.banks.find(b => b.id == id);
    if (!bank) {
      console.error(`Помилка: Банк з ID ${id} не знайдено.`);
      process.exit(1);
    }
    
    let branches = bank.branches;
    if (options.atm) {
      branches = branches.filter(branch => branch.has_atm === true);
    }
    
    if (branches.length === 0) {
      console.log('Відділень за заданими критеріями не знайдено.');
    } else {
      console.table(branches);
    }
  });

// 2. Пошук підрозділів за містом
program.command('city')
  .description('Знайти всі відділення будь-якого банку у вказаному місті')
  .argument('', 'Назва міста')
  .action((cityName) => {
    const data = loadData();
    let results = [];
    
    // Проходимось по всіх банках і шукаємо відділення в потрібному місті
    data.banks.forEach(bank => {
      const cityBranches = bank.branches.filter(b => b.city.toLowerCase() === cityName.toLowerCase());
      cityBranches.forEach(branch => {
        results.push({
          bank_name: bank.name,
          address: branch.address,
          has_atm: branch.has_atm ? 'Так' : 'Ні'
        });
      });
    });

    if (results.length === 0) {
      console.log(`У місті ${cityName} відділень не знайдено.`);
    } else {
      console.table(results);
    }
  });

// 3. Статистика банків (кількість відділень)
program.command('stats')
  .description('Показати кількість підрозділів для кожного банку')
  .action(() => {
    const data = loadData();
    const stats = data.banks.map(bank => ({
      name: bank.name,
      total_branches: bank.branches.length
    }));
    console.table(stats);
  });

program.parse();