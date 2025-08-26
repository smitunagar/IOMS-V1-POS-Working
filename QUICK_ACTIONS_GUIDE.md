# Quick Actions Customization Guide

## Overview

The IOMS Dashboard now features a fully customizable Quick Actions section that allows users to personalize their dashboard by adding, removing, and reordering quick action buttons.

## Features

### 🎯 **Customizable Quick Actions**
- **Add/Remove Actions**: Users can add new quick actions from a predefined list or remove existing ones
- **Drag & Drop Reordering**: Actions can be reordered by dragging and dropping in edit mode
- **Persistent Storage**: User preferences are saved in localStorage and persist across sessions
- **Visual Feedback**: Color-coded actions with hover effects and clear visual indicators

### 🔧 **Available Quick Actions**

#### Default Actions (Pre-configured)
1. **Start POS** - Process transactions
2. **Upload Menu** - Add new menu items
3. **Analytics & Dashboard** - Business insights & reports
4. **Table Management** - Manage tables & reservations
5. **AI Ingredient Generator** - Generate ingredients for dishes

#### Additional Actions (Can be added)
6. **Inventory Management** - Track stock levels
7. **Customer Management** - Manage customer data
8. **Reports** - Generate business reports
9. **Settings** - Configure system settings
10. **Barcode Scanner** - Scan products quickly

## How to Use

### 1. **Accessing the IOMS Dashboard**
- Navigate to the marketplace at `http://localhost:3000/`
- Click on the **IOMS** app card
- Login with any credentials (demo mode)
- You'll be redirected to the IOMS Dashboard

### 2. **Customizing Quick Actions**
- In the Quick Actions section, click the **"Customize"** button
- The section will enter edit mode with additional controls

### 3. **Adding New Actions**
- Click the **"Add Action"** button that appears in edit mode
- A modal will open showing available actions you can add
- Click on any action to add it to your dashboard
- The action will appear in your Quick Actions grid

### 4. **Removing Actions**
- In edit mode, each action card will show a red **"X"** button in the top-left corner
- Click the **"X"** button to remove that action from your dashboard
- The action will be removed immediately

### 5. **Reordering Actions**
- In edit mode, actions become draggable
- Click and drag any action card to a new position
- Drop it in the desired location
- The order will be automatically saved

### 6. **Saving Changes**
- Click **"Done"** to exit edit mode
- All changes are automatically saved to localStorage
- Your custom configuration will persist across browser sessions

## Technical Implementation

### Files Created/Modified

1. **`src/lib/quickActionsRegistry.ts`**
   - Defines the QuickAction interface
   - Contains default and available quick actions
   - Provides functions for managing quick actions (add, remove, reorder, save)

2. **`src/components/QuickActions.tsx`**
   - Main component for the customizable quick actions
   - Handles drag & drop functionality
   - Manages edit mode and modal interactions

3. **`src/app/ioms-dashboard/page.tsx`**
   - Updated to use the new QuickActions component
   - Replaced hardcoded quick actions with dynamic component

### Key Features

#### **Local Storage Integration**
```typescript
// Actions are automatically saved to localStorage
const QUICK_ACTIONS_STORAGE_KEY = 'ioms-quick-actions';
```

#### **Drag & Drop Reordering**
```typescript
// Drag and drop functionality for reordering
const handleDrop = (e: React.DragEvent, targetActionId: string) => {
  // Reorder logic with automatic order number updates
}
```

#### **Dynamic Icon Mapping**
```typescript
// Icons are dynamically mapped from Lucide React
const iconMap: Record<string, any> = {
  CreditCard, Upload, BarChart3, MapPin, ChefHat, Package, 
  Users, FileText, Settings, Scan
}
```

#### **Color-Coded Actions**
```typescript
// Each action has a predefined color scheme
const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-600',
  green: 'bg-green-50 border-green-200 hover:border-green-300 text-green-600',
  // ... more colors
}
```

## Benefits

### 🎨 **User Experience**
- **Personalized Dashboard**: Users can customize their workspace to match their workflow
- **Intuitive Interface**: Simple drag & drop and click interactions
- **Visual Consistency**: Color-coded actions with consistent styling

### 🔧 **Developer Experience**
- **Modular Architecture**: Separate registry and component for easy maintenance
- **Type Safety**: Full TypeScript support with proper interfaces
- **Extensible**: Easy to add new actions by updating the registry

### 📱 **Responsive Design**
- **Mobile Friendly**: Works on all screen sizes
- **Touch Support**: Drag & drop works on touch devices
- **Accessible**: Proper ARIA labels and keyboard navigation

## Future Enhancements

### Potential Features
1. **Custom Actions**: Allow users to create completely custom quick actions
2. **Action Categories**: Group actions by category (Sales, Inventory, Reports, etc.)
3. **Action Permissions**: Role-based access control for different actions
4. **Action Analytics**: Track which actions are used most frequently
5. **Import/Export**: Share quick action configurations between users

### Technical Improvements
1. **Server-Side Storage**: Move from localStorage to database storage
2. **Real-time Sync**: Sync changes across multiple browser tabs
3. **Action Templates**: Predefined action sets for different business types
4. **API Integration**: Connect actions to actual backend functionality

## Troubleshooting

### Common Issues

1. **Actions not saving**
   - Check browser localStorage support
   - Verify no JavaScript errors in console

2. **Drag & drop not working**
   - Ensure you're in edit mode
   - Check if JavaScript is enabled
   - Try refreshing the page

3. **Actions not loading**
   - Clear browser cache and localStorage
   - Check for JavaScript errors
   - Verify component imports are correct

### Debug Information
- Quick actions are stored in localStorage under key: `ioms-quick-actions`
- You can inspect this in browser DevTools → Application → Local Storage
- Component state is managed with React hooks for optimal performance

## Conclusion

The customizable Quick Actions feature transforms the IOMS Dashboard from a static interface into a dynamic, personalized workspace. Users can now tailor their dashboard to their specific needs, improving productivity and user satisfaction.

The implementation follows modern React patterns with TypeScript, ensuring maintainability and extensibility for future enhancements. 