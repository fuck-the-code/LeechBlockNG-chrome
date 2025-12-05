# Project Context

## Purpose
LeechBlock NG (Next Generation) is a simple productivity Chrome extension designed to block time-wasting websites. Users can specify which sites to block and when to block them using various scheduling options. The extension helps users improve productivity by limiting access to distracting websites during work hours or other designated time periods.

## Tech Stack
- **JavaScript (ES6+)** - Primary programming language
- **HTML5/CSS3** - UI and styling
- **Chrome Extension Manifest V3** - Extension framework
- **jQuery UI** - UI components and interactions
- **Chrome Extension APIs** - Storage, tabs, alarms, webNavigation, contextMenus, offscreen
- **Web Technologies** - Content scripts, background service workers

## Project Conventions

### Code Style
- Use standard JavaScript conventions with ES6+ features
- Modular code structure with separate files for different functionalities
- Consistent indentation and formatting
- Descriptive function and variable names
- Use Chrome extension best practices

### Architecture Patterns
- **Background Service Worker**: Handles core blocking logic, alarms, and data management
- **Content Scripts**: Injected into web pages to implement blocking mechanisms
- **Options Page**: Main configuration interface
- **Popup UI**: Quick access to common functions
- **Localized Files**: Support for multiple languages via _locales directory

### Testing Strategy
- Manual testing through Chrome Extension Developer Tools
- User-reported bug fixes and validation
- No automated testing framework currently implemented

### Git Workflow
- Master branch contains stable releases
- Feature development happens on separate branches
- Commit messages should be descriptive of changes
- PRs are welcome but require careful review

## Domain Context
- **Productivity Extension**: Focuses on digital wellbeing and time management
- **Chrome Ecosystem**: Must follow Chrome Extension Web Store policies
- **Cross-platform Compatibility**: Works across different operating systems where Chrome is available
- **Multi-language Support**: Supports 6+ languages including English, German, Spanish, Italian, Portuguese, Vietnamese, and Hebrew

## Important Constraints
- Must comply with Chrome Extension Manifest V3 requirements
- Privacy-focused: No user data sent to external servers
- Must work with Chrome's extension security model
- Performance: Minimal impact on browser performance
- Compatibility: Works with various website types and technologies

## External Dependencies
- **jQuery UI**: For UI components (must be installed in jquery-ui subfolder)
- **Chrome Extension APIs**: storage, tabs, alarms, webNavigation, contextMenus, offscreen
- **Chrome Web Store**: Distribution platform
- No external web services or APIs required - all processing happens locally
