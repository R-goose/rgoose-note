; 欢迎页和完成页由 Electron Builder 的 assisted installer 插入。保留默认的目录选择、
; 更新参数和启动行为，只为向导补充清晰的中文引导文案。
!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "欢迎使用 R-Goose Note"
  !define MUI_WELCOMEPAGE_TEXT "将灵感、知识和计划留在同一个轻盈的笔记空间。$\r$\n$\r$\n安装只需片刻，稍后你可以自由选择安装位置。"
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customFinishPage
  !ifndef HIDE_RUN_AFTER_FINISH
    Function StartApp
      ${if} ${isUpdated}
        StrCpy $1 "--updated"
      ${else}
        StrCpy $1 ""
      ${endif}
      ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
    FunctionEnd

    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_TEXT "立即打开 R-Goose Note"
    !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !endif
  !define MUI_FINISHPAGE_TITLE "R-Goose Note 已准备就绪"
  !define MUI_FINISHPAGE_TEXT "安装完成。你可以立即开始记录、整理和连接每一个想法。"
  !insertmacro MUI_PAGE_FINISH
!macroend

!macro customInstall
  ; 强制 Windows 重建图标缓存，确保桌面/任务栏立即显示新图标（避免旧版缓存）
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend
