# Design Guidelines for Nashik Digital Twin Application

## Design Mandate
**Critical Requirement**: This application must **exactly replicate** the existing CitiPulse design system. No design changes are permitted - only code translation from Reflex/Python to React/HTML-CSS-JS.

## Design Approach
**Reference-Based Approach**: CitiPulse existing implementation serves as the single source of truth for all visual design decisions.

## Core Design Elements

### Color Palette
- **Primary Gradient**: Emerald-500 to Cyan-500 (`from-emerald-500 to-cyan-500`)
- **Background**: Gradient from slate-50 via emerald-50 to cyan-50 (`from-slate-50 via-emerald-50 to-cyan-50`)
- **Text Primary**: Slate-800
- **Text Secondary**: Slate-600, Slate-500
- **Alert Colors**: 
  - Critical: Red-500 borders, Red-50 backgrounds
  - Warning: Amber-500 borders, Amber-50 backgrounds
- **Success/Health**: Green-500, Emerald-600
- **Card Backgrounds**: White with 90% opacity (`bg-white/90`)
- **Borders**: Emerald-100, Emerald-200

### Typography
- **Font Family**: Montserrat (weights: 400, 500, 600, 700)
- **Headings**: 
  - H1: 4xl (Dashboard), 6xl-8xl (Hero)
  - Applied gradient text effect using bg-clip-text
- **Body Text**: Base size with slate color variations
- **Micro Text**: xs and sm sizes for metadata

### Layout System
- **Spacing**: Tailwind spacing units - primarily p-6, p-8, gap-4, gap-6, mb-6, mb-8, mt-4, mt-8
- **Grid Systems**: 
  - Dashboard stats: `grid md:grid-cols-2 lg:grid-cols-4 gap-6`
  - Analytics charts: `grid md:grid-cols-2 gap-6`
  - Green initiatives: `grid md:grid-cols-2 gap-6`
- **Container**: Full viewport with flex centering for hero, standard page padding (p-6 md:p-8) for app pages

### Component Library

#### Cards
- **Stat Cards**: White/90 opacity, rounded-2xl, shadow-xl, emerald-100 border, hover:shadow-2xl transition
- **Alert Cards**: Border-left-4, rounded-lg, backdrop-blur-sm, conditional red/amber styling
- **Recommendation Cards**: White/90 opacity, rounded-2xl, shadow-xl, emerald-400 border-left-4

#### Navigation
- Horizontal navbar with emerald-to-cyan gradient background
- Active state highlighting for current page
- Fixed demo mode toggle (bottom-right, z-50)

#### Buttons
- **Primary CTA**: Emerald-to-cyan gradient, white text, rounded-lg, shadow-lg, hover:scale-105
- **Secondary**: White/80 opacity, slate text, backdrop-blur
- **Demo Toggle**: Conditional red-500 (active) or white/80 (inactive), rounded-full, shadow-2xl

#### Data Visualization
- **Charts**: Recharts library with emerald/cyan/orange/blue color scheme
- **Radial Chart**: CGI display with emerald fill, 80-100% radius, rounded corners
- **Line Charts**: Natural curves, no dots, 2px stroke width, emerald grid

#### Icons
- Icon library integrated throughout (thermometer, droplets, wind, leaf, sparkles, etc.)
- Icon sizes: h-5 w-5 standard, h-12 w-12 for empty states

#### Special Components
- **Live Badge**: Red-500 dot with ping animation, "LIVE" text
- **Health Pulse**: Circular AQI indicator with animate-pulse effect, conditional coloring
- **AI Insight Banner**: Purple-50 background, purple-500 icon, sparkles icon

### Map Design
- **Mapbox GL JS Integration**: Street, Satellite, 3D Buildings, Heatmap, AQI overlay modes
- **View Switcher**: Absolute positioned (top-left), white/50 backdrop-blur, rounded-lg buttons
- **Markers**: Color-coded sensors (conditional based on readings), glowing effects
- **Zones**: Polygon overlays with semi-transparent fills, emerald-based color gradients

### Animations
- **Minimal Usage**: Only pulse effects on live indicators and health status
- **Transitions**: hover:scale-105, hover:shadow-2xl for cards
- **Loading States**: Simple spinner with emerald-to-cyan gradient background

### Responsive Behavior
- **Mobile-First**: Base styles for mobile, md: and lg: breakpoints
- **Grid Collapsing**: 4-column stats → 2-column → 1-column
- **Text Scaling**: Hero 6xl on mobile → 8xl on desktop
- **Padding**: p-6 mobile → p-8 desktop

### Page-Specific Layouts

#### Hero Page
- Full viewport height/width, centered flex layout
- Large gradient headline with emoji prefix
- Subtitle with slate-600 text
- Single prominent CTA button with arrow icon

#### Dashboard
- Header with title + live badge + health indicators
- AI insight banner (purple accent)
- 4-column stat grid
- Charts section below

#### Map Page  
- Full-screen map container
- Absolute positioned view controls (top-left)
- Absolute positioned campus controls (top-left, below view switcher)
- Embedded 3D visualization with UI overlay

#### Alerts
- Vertical stack of alert cards
- Empty state with green checkmark icon centered
- Conditional styling based on alert severity

#### Analytics
- Sensor selector dropdown + export button
- 2-column chart grid
- Consistent chart card styling

### Footer
- Border-top emerald-100
- Tech badges with slate-100 backgrounds
- Copyright text slate-500

## Images
No hero images required. Application uses gradient backgrounds and data visualizations exclusively.

## Critical Constraints
1. **No Design Modifications**: Every visual element must match the existing CitiPulse implementation
2. **Preserve All Interactions**: Hover states, transitions, and animations exactly as specified
3. **Maintain Component Hierarchy**: Card nesting, flex/grid structures unchanged
4. **Color Fidelity**: Exact Tailwind color values must be preserved
5. **Typography Consistency**: Montserrat font across all text elements