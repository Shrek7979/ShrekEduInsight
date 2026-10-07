' Runs sns-update.cmd without showing a console window (used by the Windows scheduled task)
CreateObject("WScript.Shell").Run "cmd /c ""D:\SEOK\ShrekEduInsight\scripts\sns-update.cmd""", 0, True
