# ប្រព័ន្ធគ្រប់គ្រងការលក់ និងស្តុកគ្រឿងសំណង់ (Inventory System V3)

គម្រោងពេញលេញដែលត្រូវបានរចនាឡើងសម្រាប់ដេប៉ូគ្រឿងសំណង់ ដោយប្រើប្រាស់៖
* **Database:** Neon PostgreSQL Console (Cloud Database)
* **Backend:** Node.js + Express (pg library)
* **Frontend:** React + Vite + Tailwind CSS
* **Repository:** `https://github.com/EatRothaKingzWar/Inventory-System-V3`

---

## មុខងារស្នូលទាំង ៤ ក្នុងប្រព័ន្ធ៖

1. **Assign Role & Permissions តាម Tick Box:**
   - Admin អាច Tick លើប្រអប់តាមម៉ូឌុល (POS, Products, Stock In, Debt, Reports) ដោយមិនបាច់កែកូដឡើយ។
2. **កន្លែងលក់ POS គ្រឿងសំណង់:**
   - គាំទ្រឯកតាពិត (បាវ, ដើម, គីឡូ, ធុង, ប្រអប់, ឡាន, ម៉ែត្រ...)។
   - គណនាលុយពីរប្រព័ន្ធស្វ័យប្រវត្តិ ($ និង ៛ 4,100) និងគណនាលុយអាប់ទាំងពីររូបិយប័ណ្ណ។
   - កត់ត្រាការទិញជំពាក់ (Credit) និងប៊ូតុងកត់ត្រាសងលុយ (Mark as Paid)។
3. **ការបោះពុម្ព (Print Options):**
   - វិក្កយបត្រតូច 80mm (Thermal POS Receipt)។
   - ប័ណ្ណដឹកជញ្ជូន និងវិក្កយបត្រ A4/A5 មាន ៣ កន្លែងចុះហត្ថលេខា (អ្នកចេញទំនិញ, អ្នកដឹក, មេការទទួល)។
4. **របាយការណ៍ហិរញ្ញវត្ថុ & ចំណេញខាត:**
   - បិទបញ្ជីលុយប្រចាំថ្ងៃ (Daily Cash Close)។
   - របាយការណ៍ប្រចាំខែ (Revenue, COGS, Profit, Debt List)។
   - ទាញយកទិន្នន័យទាំងអស់ជា Excel All-in-One Multi-Sheets (SpreadsheetML)។

---

## របៀបដំណើរការក្នុង VS Code៖

### ១. រៀបចំ Database ក្នុង Neon Console
- បើកឯកសារ `neon_schema.sql` រួច Copy កូដទាំងអស់ទៅ Paste ក្នុង **Neon SQL Editor** រួចចុច **Run**។

### ២. ដំណើរការ Backend
```bash
cd backend
npm install
node server.js
```

### ៣. ដំណើរការ Frontend
```bash
cd ../frontend
npm install
npm run dev
```

---

## បញ្ជា Git សម្រាប់ Push ទៅកាន់ GitHub (`EatRothaKingzWar/Inventory-System-V3`)៖

```bash
git init
git add .
git commit -m "feat: complete construction materials POS and inventory system"
git branch -M main
git remote add origin https://github.com/EatRothaKingzWar/Inventory-System-V3.git
git push -u origin main
```
