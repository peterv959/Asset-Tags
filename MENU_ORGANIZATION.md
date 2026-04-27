# Menu-Based UI Organization

The application has been reorganized to move label templates and consecutive printing options from the main screen to the menu bar, reducing UI clutter and making the form more focused.

## Changes Made

### Templates Menu
- **Location**: Menu bar → Templates
- **Display**: Shows up to 9 most-used templates with keyboard shortcuts (Cmd/Ctrl+1 through 9)
- **More Option**: If there are more than 9 templates, a "More Templates..." option opens a template selector dialog
- **Selection**: Click any template to select it, or use the keyboard shortcut
- **Auto-Save**: Your template selection is automatically saved for next time

### Printing Menu
- **Location**: Menu bar → Printing
- **Option**: "Print Consecutive Labels..." (Cmd/Ctrl+Shift+P)
- **Functionality**: Opens a dialog where you can enter how many labels to print (1-100)
- **Workflow**:
  1. Fill in Asset Tag and Serial Number
  2. Use menu: Printing → Print Consecutive Labels...
  3. Enter the count
  4. Click "Print"
  5. The application will print that many labels with the same asset tag

## Main Screen Changes

### What's New
- Cleaner form with just Asset Tag and Serial Number fields
- More space for the label preview
- Template selector removed (now in menu)

### How to Switch Templates
1. Click "Templates" in the menu bar
2. Select your desired template from the list
3. The template is immediately selected and saved

### How to Print Multiple Labels
1. Fill in your Asset Tag and Serial Number as usual
2. Click "Printing" → "Print Consecutive Labels..."
3. Enter the number of labels (1-100)
4. Click "Print"

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Select Template 1 | Cmd/Ctrl+1 |
| Select Template 2 | Cmd/Ctrl+2 |
| ... | ... |
| Select Template 9 | Cmd/Ctrl+9 |
| Print Consecutive Labels | Cmd/Ctrl+Shift+P |
| Preferences | Cmd/Ctrl+, |

## Demo Mode

In demo mode, consecutive printing will process each label but won't show individual ZPL popups for each one (to avoid too many dialogs). Check the console for confirmation that each label was processed.

## Future Enhancements

Possible improvements:
- Add "Recently Used" templates to Templates menu
- Save consecutive print counts as presets
- Add batch printing options (print ranges, repeat patterns)
