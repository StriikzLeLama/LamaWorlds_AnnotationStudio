# Changelog

All notable changes to Lama Worlds Annotation Studio will be documented in this file.

## [1.1.0] - 2024

### Added

#### Interface Improvements
- **Layout Manager**: Customizable layouts with presets (Annotation Focus, Stats Focus, Balanced, Minimal)
- **Custom Layouts**: Save and reuse your own layout configurations
- **Theme Manager**: Multiple themes (Dark, Light, Cyberpunk) with customization
- **Mini-map**: Visual overview of the entire dataset with quick navigation
- **Image Preview Tooltip**: Hover preview with annotation details
- **Collapsible Panels**: Statistics, Analytics, and Validation panels can be completely hidden
- **Compact Mode**: Toggle between compact and extended button modes

#### Navigation & Search
- **Advanced Search**: Multi-filter search system with:
  - Text search in image names and annotations
  - Filter by class
  - Filter by annotation size (min/max pixels)
  - Filter by date modified
  - Filter by tags
- **Quick Actions**: Hover actions on images (open, delete)
- **Export History**: Track and quickly re-export previous exports

#### Batch Operations
- **Multiple Image Selection**: Select multiple images with Ctrl+Click
- **Batch Actions Toolbar**: Bottom toolbar for batch operations
- **Batch Delete**: Delete multiple selected images
- **Batch Tag**: Tag multiple images at once
- **Batch Export**: Export only selected images

#### Workflow Modes
- **Normal Mode**: Standard annotation workflow
- **Speed Mode**: Fast annotation with Quick Draw enabled
- **Review Mode**: Review and validate with measurements enabled
- **Precision Mode**: Precise annotation with measurements enabled

#### Export Improvements
- **Export Menu**: Consolidated export options in a dropdown menu
- **Export History**: Track last 10 exports with quick re-export
- **Selective Export**: Export only selected images
- **Export Formats**: COCO, Pascal VOC, Preview, Report, Project

#### UI/UX Enhancements
- **Compact Sidebar**: Reorganized buttons into dropdown menus
- **Compact Right Panel**: Consolidated export buttons into a menu
- **Better Tooltips**: Improved tooltips with keyboard shortcuts
- **Smooth Animations**: Better transitions and animations
- **Responsive Design**: Better adaptation to different screen sizes

### Fixed
- **Scrollbar Issues**: Fixed horizontal scrollbar in Statistics, Analytics, and Validation panels
- **Layout Issues**: Fixed panel width and overflow issues
- **Performance**: Improved rendering performance with better virtualization

### Changed
- **Export UI**: Replaced individual export buttons with a dropdown menu
- **Sidebar Organization**: Reorganized tools into logical groups (Templates, Tools, Options)
- **Right Panel**: Improved button organization and compact mode

## [1.0.0] - Initial Release

### Features
- Basic annotation functionality
- YOLO format support
- Vision LLM integration
- Export/Import functionality
- Statistics and validation panels

