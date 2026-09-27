Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "d:\BA\1-Project\ตรวจสอบเว็บล่ม\Test"
WshShell.Run "node worker.js", 0, False
