# 🏪 IOMS Marketplace Development Guide

## Overview

The IOMS Marketplace is a centralized platform for business applications that follows a standardized architecture for consistency, maintainability, and scalability.

## 🏗️ Architecture

### Directory Structure
```
src/
├── app/
│   └── apps/                    # All marketplace apps
│       ├── [app-id]/
│       │   ├── page.tsx         # Main app page
│       │   ├── components/      # App-specific components
│       │   ├── features/        # App-specific features
│       │   └── api/            # App-specific API routes
├── lib/
│   ├── appRegistry.ts          # Central app registry
│   └── [shared-services]/      # Shared business logic
└── components/
    └── ui/                     # Shared UI components
```

### App Registry System
All apps are registered in `src/lib/appRegistry.ts` with consistent metadata:

```typescript
interface AppMetadata {
  id: string;                    // Unique app identifier
  name: string;                  // Display name
  description: string;           // App description
  icon: string;                  // Emoji or icon
  category: 'business' | 'productivity' | 'analytics' | 'communication' | 'finance';
  status: 'active' | 'beta' | 'coming-soon' | 'deprecated';
  version: string;               // Semantic versioning
  author: string;                // App author/team
  features: string[];            // Key features list
  pricing: 'free' | 'freemium' | 'paid' | 'enterprise';
  route: string;                 // App URL path
  requiresAuth: boolean;         // Authentication requirement
  permissions?: string[];        // Required permissions
}
```

## 🚀 Quick Start: Creating a New App

### Method 1: Using the Generator Script
```bash
# Navigate to the IOMS directory
cd IOMS-Version2_IOMS_POS_Working/IOMS

# Generate a new app
node scripts/generateApp.js "Your App Name" --category=business --pricing=free --features="Feature 1,Feature 2,Feature 3"
```

### Method 2: Manual Creation

1. **Create App Directory**
   ```bash
   mkdir -p src/app/apps/your-app-id
   mkdir -p src/app/apps/your-app-id/components
   mkdir -p src/app/apps/your-app-id/features
   mkdir -p src/app/apps/your-app-id/api
   ```

2. **Create Main App Page**
   ```tsx
   // src/app/apps/your-app-id/page.tsx
   "use client";
   
   import { useState } from 'react';
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   
   export default function YourAppPage() {
     return (
       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
         <div className="max-w-4xl mx-auto">
           <h1 className="text-4xl font-bold text-gray-900 mb-4">
             Your App Name
           </h1>
           {/* Your app content */}
         </div>
       </div>
     );
   }
   ```

3. **Register in App Registry**
   ```typescript
   // Add to src/lib/appRegistry.ts
   {
     id: 'your-app-id',
     name: 'Your App Name',
     description: 'Your app description',
     icon: '🚀',
     category: 'business',
     status: 'beta',
     version: '1.0.0',
     author: 'IOMS Team',
     features: ['Feature 1', 'Feature 2', 'Feature 3'],
     pricing: 'free',
     route: '/apps/your-app-id',
     requiresAuth: false,
     permissions: ['your-app:read']
   }
   ```

## 📋 App Development Standards

### 1. **UI/UX Guidelines**
- Use consistent color scheme (blue/purple gradients)
- Follow responsive design principles
- Use shared UI components from `@/components/ui/`
- Implement loading states and error handling
- Add proper TypeScript types

### 2. **Component Structure**
```tsx
// Recommended component structure
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface YourComponentProps {
  // Define props
}

export function YourComponent({ ...props }: YourComponentProps) {
  const [state, setState] = useState();
  
  useEffect(() => {
    // Side effects
  }, []);
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Component Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
}
```

### 3. **API Integration**
```tsx
// API route example
// src/app/apps/your-app-id/api/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Your API logic
    return NextResponse.json({ data: 'success' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Process data
    return NextResponse.json({ result: 'processed' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Bad request' },
      { status: 400 }
    );
  }
}
```

### 4. **State Management**
- Use React hooks for local state
- Consider context for app-wide state
- Implement proper error boundaries
- Add loading and error states

## 🎨 Design Patterns

### 1. **Dashboard Layout**
```tsx
// Standard dashboard structure
<div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
  <div className="max-w-7xl mx-auto">
    {/* Header */}
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">App Name</h1>
      <p className="text-xl text-gray-600">App description</p>
    </div>
    
    {/* Filters/Controls */}
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      {/* Filter controls */}
    </div>
    
    {/* Key Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Metric cards */}
    </div>
    
    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Content cards */}
    </div>
  </div>
</div>
```

### 2. **Metric Cards**
```tsx
<Card className="shadow-lg">
  <CardContent className="p-6">
    <div className="flex items-center space-x-3">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <p className="text-sm text-gray-600">Metric Label</p>
        <p className="text-2xl font-bold text-gray-900">Value</p>
      </div>
    </div>
  </CardContent>
</Card>
```

### 3. **Data Tables**
```tsx
<Card className="shadow-lg">
  <CardHeader>
    <CardTitle>Data Table</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          {/* Table row content */}
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

## 🔧 Development Workflow

### 1. **Planning Phase**
- [ ] Define app requirements and features
- [ ] Choose appropriate category and pricing
- [ ] Design UI/UX mockups
- [ ] Plan API endpoints and data flow

### 2. **Development Phase**
- [ ] Create app directory structure
- [ ] Implement core functionality
- [ ] Add UI components and styling
- [ ] Integrate with shared services
- [ ] Add error handling and loading states

### 3. **Testing Phase**
- [ ] Test functionality across devices
- [ ] Verify API integrations
- [ ] Check accessibility compliance
- [ ] Performance testing

### 4. **Deployment Phase**
- [ ] Update app registry
- [ ] Test in staging environment
- [ ] Deploy to production
- [ ] Monitor performance and errors

## 📊 App Categories

### Business Apps
- **IOMS**: Integrated Operations Management System
- **Smart POS**: Point of Sale System
- **Inventory Pro**: Advanced Inventory Management

### Analytics Apps
- **Analytics Dashboard**: Business Analytics
- **Customer Analytics**: Customer Behavior Analysis

### Productivity Apps
- **AI Ingredient Generator**: Recipe Ingredient Lists

### Communication Apps
- *Future apps for team collaboration, messaging, etc.*

### Finance Apps
- *Future apps for accounting, invoicing, etc.*

## 🔐 Authentication & Permissions

### Authentication Levels
- **Public**: No authentication required
- **Authenticated**: User must be logged in
- **Premium**: Requires subscription

### Permission System
```typescript
// Permission format: resource:action
const permissions = [
  'inventory:read',      // Read inventory data
  'inventory:write',     // Modify inventory
  'analytics:read',      // View analytics
  'customers:read',      // Access customer data
  'pos:write',          // Process transactions
];
```

## 🚀 Performance Best Practices

### 1. **Code Splitting**
- Use dynamic imports for large components
- Implement lazy loading for routes
- Optimize bundle size

### 2. **Data Fetching**
- Implement proper caching strategies
- Use SWR or React Query for data management
- Add loading and error states

### 3. **Image Optimization**
- Use Next.js Image component
- Implement proper image formats and sizes
- Add lazy loading for images

### 4. **SEO Optimization**
- Add proper meta tags
- Implement structured data
- Optimize for search engines

## 🧪 Testing Strategy

### 1. **Unit Testing**
- Test individual components
- Mock API calls
- Test error scenarios

### 2. **Integration Testing**
- Test app workflows
- Verify API integrations
- Test user interactions

### 3. **E2E Testing**
- Test complete user journeys
- Cross-browser testing
- Mobile responsiveness

## 📈 Monitoring & Analytics

### 1. **Performance Monitoring**
- Track page load times
- Monitor API response times
- Monitor error rates

### 2. **User Analytics**
- Track user interactions
- Monitor feature usage
- Analyze user behavior

### 3. **Error Tracking**
- Implement error boundaries
- Log errors to monitoring service
- Set up alerts for critical errors

## 🔄 Maintenance & Updates

### 1. **Version Management**
- Follow semantic versioning
- Maintain changelog
- Plan backward compatibility

### 2. **Security Updates**
- Regular dependency updates
- Security audits
- Vulnerability scanning

### 3. **Feature Updates**
- User feedback collection
- Feature request tracking
- Regular app improvements

## 📚 Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Tools
- **Development**: VS Code, TypeScript, ESLint
- **Design**: Figma, Adobe XD
- **Testing**: Jest, React Testing Library
- **Monitoring**: Sentry, Google Analytics

### Templates
- Use the generator script for consistent app structure
- Follow established patterns in existing apps
- Reference the Customer Analytics app as a template

---

## 🎯 Next Steps

1. **Choose an app idea** that fits your business needs
2. **Plan the features** and user experience
3. **Use the generator script** to create the app structure
4. **Implement core functionality** following the guidelines
5. **Test thoroughly** before deployment
6. **Register in the app registry** and deploy

For questions or support, refer to the existing app implementations or contact the development team. 