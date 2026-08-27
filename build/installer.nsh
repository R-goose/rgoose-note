!macro customInstall
  ; 强制 Windows 重建图标缓存，确保桌面/任务栏立即显示新图标（避免旧版缓存）
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend
