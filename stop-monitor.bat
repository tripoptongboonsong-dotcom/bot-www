@echo off
chcp 65001 > nul
echo กำลังหยุดการทำงานของระบบตรวจจับเว็บล่ม...
taskkill /f /im node.exe > nul 2>&1
echo [OK] สั่งหยุดระบบเรียบร้อยแล้ว
pause
