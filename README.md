# IOMS Marketplace

A comprehensive business applications marketplace built with Next.js, featuring the Smart POS system and other business tools.

## 🚀 Features

- **Modern Marketplace UI**: Beautiful, responsive design with search and filtering
- **Smart POS Integration**: Full integration with the existing IOMS POS system
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

### Inventory Pro 📦
- **Status**: Available
- **Rating**: 4.6/5
- **Downloads**: 8,920+
- **Features**: Smart Forecasting, Automated Reordering, Multi-warehouse Support

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

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **State Management**: React Context API
- **Icons**: Lucide React
- **Animations**: Tailwind CSS Animations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

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

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
IOMS-V1-POS-Working/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── apps/              # Individual app pages
│   │   │   └── smart-pos/     # Smart POS app integration
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Marketplace homepage
│   ├── components/            # Reusable components
│   │   ├── ui/               # UI components (toast, etc.)
│   │   ├── AppCard.tsx       # App card component
│   │   ├── CategoryFilter.tsx # Category filter
│   │   ├── Header.tsx        # Navigation header
│   │   └── Stats.tsx         # Statistics component
│   ├── contexts/             # React contexts
│   │   └── MarketplaceContext.tsx # Marketplace state management
│   ├── hooks/                # Custom hooks
│   │   └── use-toast.ts      # Toast notifications
│   └── lib/                  # Utility functions
│       └── utils.ts          # Common utilities
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

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for environment-specific settings:

```env
NEXT_PUBLIC_MARKETPLACE_NAME=IOMS Marketplace
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Customization
- **App Data**: Modify `src/contexts/MarketplaceContext.tsx` to add/remove apps
- **Styling**: Update `src/app/globals.css` for theme customization
- **Components**: Extend components in `src/components/` for additional features

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Configure build settings
3. Deploy automatically on push

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

- [ ] User authentication and profiles
- [ ] App reviews and ratings system
- [ ] Advanced search filters
- [ ] App recommendations
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Mobile app version
- [ ] API for third-party integrations

---

**Built with ❤️ by the IOMS Team**