#!/bin/bash

# IOMS Deployment Script
# This script helps manage deployments to different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
}

# Function to check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Please install it first:"
        echo "npm i -g vercel"
        exit 1
    fi
}

# Function to deploy to development
deploy_dev() {
    print_status "Deploying to development environment..."
    
    # Build the project
    print_status "Building project..."
    npm run build
    
    # Deploy to Vercel (development)
    print_status "Deploying to Vercel development..."
    vercel --prod=false
    
    print_success "Development deployment completed!"
}

# Function to deploy to production
deploy_prod() {
    print_warning "You are about to deploy to PRODUCTION!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Production deployment cancelled."
        exit 0
    fi
    
    print_status "Deploying to production environment..."
    
    # Build the project
    print_status "Building project..."
    npm run build
    
    # Deploy to Vercel (production)
    print_status "Deploying to Vercel production..."
    vercel --prod
    
    print_success "Production deployment completed!"
}

# Function to show help
show_help() {
    echo "IOMS Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev     Deploy to development environment"
    echo "  prod    Deploy to production environment"
    echo "  help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev     # Deploy to development"
    echo "  $0 prod    # Deploy to production"
}

# Main script logic
main() {
    check_directory
    check_vercel_cli
    
    case "${1:-help}" in
        "dev")
            deploy_dev
            ;;
        "prod")
            deploy_prod
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
