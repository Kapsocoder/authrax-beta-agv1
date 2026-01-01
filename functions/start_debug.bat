@echo off
cd /d C:\Users\kapil\OneDrive\Business\Development\Authrax-Beta-Lv1\authrax\functions
echo Starting Emulator with logging... > debug_output.txt
npm.cmd run serve >> debug_output.txt 2>&1
