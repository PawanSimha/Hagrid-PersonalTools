@echo off
setlocal
echo ==========================================
echo    Hagrid Repository Optimizer 🧹
echo ==========================================
echo.

set TARGETS=dist build public Hagrid.lnk Hagrid_Project_Report.docx

echo [1/2] Removing identified build artifacts and temporary files...
for %%f in (%TARGETS%) do (
    if exist "%%f" (
        if exist "%%f\" (
            echo   Removing directory: %%f
            rmdir /s /q "%%f"
        ) else (
            echo   Removing file: %%f
            del /f /q "%%f"
        )
    )
)

echo [2/2] Cleaning up Python bytecode caches...
for /d /r . %%d in (__pycache__) do (
    if exist "%%d" (
        echo   Removing: %%d
        rmdir /s /q "%%d"
    )
)

echo.
echo ==========================================
echo    Cleanup Complete! Hagrid is Lean. ✨
echo ==========================================
pause
