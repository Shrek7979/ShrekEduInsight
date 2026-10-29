' Runs sns-update.cmd without showing a console window (used by the Windows scheduled task)
' Finds sns-update.cmd next to this file, so moving the project folder keeps it working
Dim dir: dir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run "cmd /c """"" & dir & "\sns-update.cmd""""", 0, True
