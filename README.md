# Vocab Match Edu ⚡

เว็บแอปพลิเคชันจับคู่คำศัพท์เรียลไทม์ พัฒนาด้วย **Next.js 14**, **Tailwind CSS**, และ **TypeScript** รองรับการทำงานร่วมกับ **GitHub** และ **Vercel**

## ฟีเจอร์เด่น
- **ระบบครู (Teacher Admin):** เข้าสู่ระบบด้วย `mon` / `1234` เพิ่ม ลบ แก้ไขคำศัพท์และหมวดหมู่ พร้อมปุ่มลบและปุ่มออกจากระบบที่แก้ไขแล้ว
- **ระบบนักเรียน (Student Game):** ใส่รหัสห้อง 6 หลัก รอนักเรียนเข้าห้อง เล่นเกมจับคู่คำศัพท์
- **หน้าสรุปผล TOP 10:** แยกหน้า Leaderboard หลังจบเกม แสดงอันดับคะแนน

## วิธีการนำขึ้น GitHub & Deploy บน Vercel
1. แตกไฟล์ `vocab-match-app.zip`
2. สร้าง GitHub Repository ใหม่
3. พิมพ์คำสั่ง:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <YOUR_GITHUB_REPO_URL>
   git push -u origin main
   ```
4. ไปที่ Vercel (vercel.com) กด **New Project** -> เลือกรีโพซิโทรี GitHub -> กด **Deploy**
