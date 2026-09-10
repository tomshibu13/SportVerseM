import os

file_path = r"d:\s9\SportVerse\flutter_frontend\lib\screens\ai_assistant_screen.dart"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

replacements = {
    "Color(0xFF0F766E)": "AppColors.warmAccent",
    "Color(0xFF14B8A6)": "AppColors.warmAccentSecondary",
    "Color(0xFFF0FDFA)": "AppColors.lightDecorAccent",
    "Color(0xFFCCFBF1)": "AppColors.border",
    "Color(0xFF115E59)": "AppColors.warmAccent",
    "Color(0xFF99F6E4)": "AppColors.border",
}

for old, new in replacements.items():
    text = text.replace(old, new)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Colors swapped successfully in ai_assistant_screen.dart.")
