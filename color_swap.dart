import 'dart:io';

void main() {
  final file = File(r'd:\s9\SportVerse\flutter_frontend\lib\screens\ai_assistant_screen.dart');
  var text = file.readAsStringSync();

  final replacements = {
    'const AppColors.warmAccent': 'AppColors.warmAccent',
    'const AppColors.warmAccentSecondary': 'AppColors.warmAccentSecondary',
    'const AppColors.lightDecorAccent': 'AppColors.lightDecorAccent',
    'const AppColors.border': 'AppColors.border',
    // also handle lists if they had const
    'const [AppColors.warmAccent': '[AppColors.warmAccent',
  };

  replacements.forEach((oldStr, newStr) {
    text = text.replaceAll(oldStr, newStr);
  });

  file.writeAsStringSync(text);
  print('Fixed const modifiers in ai_assistant_screen.dart.');
}
