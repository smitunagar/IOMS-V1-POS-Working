# IOMS Marketplace

A comprehensive business applications marketplace built with Next.js, featuring the Smart POS system, AI-powered waste tracking, and other business tools.

## 🚀 Features

- **Modern Marketplace UI**: Beautiful, responsive design with search and filtering
- **Smart POS Integration**: Full integration with the existing IOMS POS system
- **AI-Powered Waste Tracking**: Camera-based waste analysis with Gemini AI
- **Inventory Management**: CSV import/export with smart data processing
- **App Management**: Install, uninstall, and manage business applications
- **Category Filtering**: Browse apps by category (Point of Sale, Inventory, Analytics, etc.)
- **Real-time Stats**: View marketplace statistics and app metrics
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 📱 Available Apps

### Smart POS 🛒
- **Status**: Available
- **Rating**: 4.8/5
- **Downloads**: 15,420+
- **Features**: AI Inventory Management, Real-time Analytics, Payment Processing, Barcode Scanning

### WasteWatchDog ♻️
- **Status**: Available (Toggle-activated)
- **Rating**: 4.9/5
- **Downloads**: 3,240+
- **Features**: 
  - AI-powered waste identification via camera
  - Image upload and analysis
  - Dish recognition with Gemini AI
  - Waste quantification and carbon footprint calculation
  - Sustainability recommendations
  - Real-time waste tracking dashboard

### Inventory Pro 📦
- **Status**: Available
- **Rating**: 4.6/5
- **Downloads**: 8,920+
- **Features**: Smart Forecasting, Automated Reordering, Multi-warehouse Support, CSV Import/Export

### Analytics Dashboard 📊
- **Status**: Available
- **Rating**: 4.7/5
- **Downloads**: 12,340+
- **Features**: Custom Dashboards, Real-time Reports, Data Visualization

### Customer CRM 👥
- **Status**: Coming Soon
- **Features**: Lead Management, Sales Pipeline, Customer Insights

### HR Management 👨‍💼
- **Status**: Beta
- **Rating**: 4.2/5
- **Downloads**: 2,340+
- **Features**: Employee Management, Payroll Processing, Performance Tracking

## 🆕 Recent Updates

### WasteWatchDog Module (Latest)
- **AI-Powered Waste Analysis**: Uses Google Gemini AI for intelligent dish identification
- **Camera Integration**: Live camera feed with image capture capabilities
- **Image Upload**: Support for JPEG, PNG, and other image formats
- **Comprehensive Analysis**: 
  - Dish name and confidence scoring
  - Ingredient breakdown and waste estimation
  - Carbon footprint calculation
  - Sustainability recommendations
- **Sidebar Integration**: Seamlessly integrated with IOMS navigation system

### Enhanced Inventory Management
- **CSV Import Functionality**: Direct CSV upload for bulk inventory updates
- **Smart Data Processing**: Automatic validation and error handling
- **Template Downloads**: Pre-formatted CSV templates for easy data entry
- **Real-time Preview**: See imported data before committing changes

### Improved User Experience
- **Persistent Authentication**: Single login across all IOMS modules
- **Consistent Navigation**: Unified sidebar across all pages
- **Quick Actions**: Customizable shortcuts to frequently used features
- **Responsive Design**: Mobile-optimized interface for all devices

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **State Management**: React Context API
- **AI Integration**: Google Gemini AI via Genkit
- **Icons**: Lucide React
- **Animations**: Tailwind CSS Animations
- **Database**: SQLite with Prisma ORM

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google AI API key (for WasteWatchDog features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd IOMS-V1-POS-Working
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   GOOGLE_AI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
IOMS-V1-POS-Working/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── apps/              # Individual app pages
│   │   │   ├── smart-pos/     # Smart POS app integration
│   │   │   ├── waste-watchdog/ # AI-powered waste tracking
│   │   │   │   ├── page.tsx   # Main WasteWatchDog page
│   │   │   │   └── module/    # Waste analysis module
│   │   │   └── ioms/          # IOMS main application
│   │   ├── api/               # API endpoints
│   │   │   ├── waste-watchdog/ # Waste analysis API
│   │   │   └── inventory-import/ # CSV processing API
│   │   ├── inventory-import/  # CSV import interface
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Marketplace homepage
│   ├── components/            # Reusable components
│   │   ├── ui/               # UI components (toast, sidebar, etc.)
│   │   ├── layout/           # Layout components
│   │   │   └── AppLayout.tsx # Main application layout with sidebar
│   │   ├── AppCard.tsx       # App card component
│   │   ├── CategoryFilter.tsx # Category filter
│   │   ├── Header.tsx        # Navigation header
│   │   └── Stats.tsx         # Statistics component
│   ├── contexts/             # React contexts
│   │   ├── MarketplaceContext.tsx # Marketplace state management
│   │   ├── AuthContext.tsx   # Authentication management
│   │   └── WasteWatchDogContext.tsx # Waste tracking state
│   ├── hooks/                # Custom hooks
│   │   └── use-toast.ts      # Toast notifications
│   ├── lib/                  # Utility functions
│   │   ├── utils.ts          # Common utilities
│   │   ├── genkit.ts         # AI integration setup
│   │   └── quickActionsRegistry.ts # Quick actions management
│   └── ai/                   # AI-related functionality
│       └── genkit.ts         # Gemini AI configuration
├── IOMS-Version2_IOMS_POS_Working/ # Original POS system
├── package.json              # Dependencies and scripts
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🎯 Key Features

### Marketplace Homepage
- **Hero Section**: Eye-catching introduction with search functionality
- **Statistics Dashboard**: Real-time marketplace metrics
- **Category Filtering**: Filter apps by business category
- **Search & Sort**: Find apps by name, features, or tags
- **Grid/List View**: Toggle between different viewing modes

### Smart POS Integration
- **Seamless Integration**: Direct access to the existing POS system
- **Quick Actions**: Fast access to key POS features
- **Feature Showcase**: Highlighted capabilities and benefits
- **Responsive Design**: Works on all device sizes

### WasteWatchDog System
- **AI-Powered Analysis**: Intelligent waste identification using Gemini AI
- **Camera Integration**: Live camera feed with image capture
- **Image Processing**: Support for multiple image formats
- **Environmental Impact**: Carbon footprint calculation and sustainability insights
- **Real-time Dashboard**: Live waste tracking and analytics

### Enhanced Inventory Management
- **CSV Import/Export**: Bulk data processing capabilities
- **Smart Validation**: Automatic error detection and correction
- **Template System**: Pre-formatted templates for easy data entry
- **Real-time Updates**: Instant inventory synchronization

### App Management
- **Install/Uninstall**: One-click app management
- **Status Tracking**: Real-time installation status
- **Local Storage**: Persistent app state
- **Toast Notifications**: User feedback for actions

## 🎨 Design System

The marketplace uses a modern design system with:

- **Color Palette**: Blue and purple gradients with semantic colors
- **Typography**: Clean, readable fonts with proper hierarchy
- **Components**: Reusable UI components with consistent styling
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first design approach
- **Sidebar Navigation**: Consistent navigation across all modules

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for environment-specific settings:

```env
NEXT_PUBLIC_MARKETPLACE_NAME=IOMS Marketplace
NEXT_PUBLIC_API_URL=http://localhost:3000/api
GOOGLE_AI_API_KEY=your_gemini_api_key_here
```

### AI Integration Setup
1. **Get Google AI API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Add to Environment**: Include the API key in your `.env.local` file
3. **Restart Server**: Restart the development server after adding the key

### Customization
- **App Data**: Modify `src/contexts/MarketplaceContext.tsx` to add/remove apps
- **Styling**: Update `src/app/globals.css` for theme customization
- **Components**: Extend components in `src/components/` for additional features
- **AI Prompts**: Customize AI analysis prompts in the WasteWatchDog API

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Configure build settings
3. Add environment variables (including Google AI API key)
4. Deploy automatically on push

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Self-hosted servers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the existing POS system documentation

## 🔮 Roadmap

- [x] AI-powered waste tracking system
- [x] Enhanced inventory management with CSV import
- [x] Persistent authentication across modules
- [x] Consistent sidebar navigation
- [ ] User authentication and profiles
- [ ] App reviews and ratings system
- [ ] Advanced search filters
- [ ] App recommendations
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Mobile app version
- [ ] API for third-party integrations
- [ ] Advanced waste analytics and reporting
- [ ] Integration with external sustainability platforms

---

**Built with ❤️ by the IOMS Team**