import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo (in production, use a database)
let vendors: any[] = [
  {
    id: 'v1',
    name: 'Fresh Valley Farms',
    category: 'Fresh Produce',
    contactInfo: {
      email: 'orders@freshvalley.de',
      phone: '+49-711-123456',
      address: 'Farm Road 15, Stuttgart, Germany',
      website: 'www.freshvalley.de'
    },
    contacts: [
      {
        name: 'Maria Schmidt',
        email: 'maria@freshvalley.de',
        phone: '+49-711-123456',
        position: 'Sales Manager'
      }
    ],
    products: ['Fresh Chicken', 'Vegetables', 'Organic Produce'],
    performance: {
      reliability: 95,
      qualityScore: 92,
      deliveryTime: 88,
      priceCompetitiveness: 85,
      responseTime: 90
    },
    status: 'active',
    createdDate: '2024-01-15',
    lastOrderDate: '2025-07-20',
    totalOrders: 156,
    averageOrderValue: 425.50,
    paymentTerms: 'Net 30',
    deliveryRadius: '100km',
    minimumOrder: 200,
    notes: 'Excellent quality fresh produce. Reliable delivery.'
  },
  {
    id: 'v2',
    name: 'Hechingen Local Market',
    category: 'Local Suppliers',
    contactInfo: {
      email: 'info@hechingen-market.de',
      phone: '+49-7471-987654',
      address: 'Market Square 1, Hechingen, Germany'
    },
    contacts: [
      {
        name: 'Klaus Weber',
        email: 'klaus@hechingen-market.de',
        phone: '+49-7471-987654',
        position: 'Owner'
      }
    ],
    products: ['Local Vegetables', 'Dairy Products', 'Bakery Items'],
    performance: {
      reliability: 88,
      qualityScore: 90,
      deliveryTime: 95,
      priceCompetitiveness: 92,
      responseTime: 85
    },
    status: 'active',
    createdDate: '2024-02-10',
    lastOrderDate: '2025-07-22',
    totalOrders: 89,
    averageOrderValue: 245.75,
    paymentTerms: 'Net 15',
    deliveryRadius: '25km',
    minimumOrder: 100,
    notes: 'Local supplier with competitive prices. Quick delivery.'
  }
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let filteredVendors = [...vendors];

    if (category && category !== 'all') {
      filteredVendors = filteredVendors.filter(vendor => vendor.category === category);
    }

    if (status) {
      filteredVendors = filteredVendors.filter(vendor => vendor.status === status);
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredVendors = filteredVendors.filter(vendor =>
        vendor.name.toLowerCase().includes(searchTerm) ||
        vendor.category.toLowerCase().includes(searchTerm) ||
        vendor.products.some((product: string) => product.toLowerCase().includes(searchTerm))
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredVendors,
      total: filteredVendors.length
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      contactInfo,
      contacts,
      products,
      status,
      paymentTerms,
      deliveryRadius,
      minimumOrder,
      notes
    } = body;

    if (!name || !category) {
      return NextResponse.json(
        { success: false, error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const newVendor = {
      id: `v${Date.now()}`,
      name,
      category,
      contactInfo: contactInfo || {
        email: '',
        phone: '',
        address: '',
        website: ''
      },
      contacts: contacts || [],
      products: products || [],
      performance: {
        reliability: 0,
        qualityScore: 0,
        deliveryTime: 0,
        priceCompetitiveness: 0,
        responseTime: 0
      },
      status: status || 'active',
      createdDate: new Date().toISOString().split('T')[0],
      totalOrders: 0,
      averageOrderValue: 0,
      paymentTerms: paymentTerms || 'Net 30',
      deliveryRadius: deliveryRadius || '50km',
      minimumOrder: minimumOrder || 0,
      notes: notes || ''
    };

    vendors.push(newVendor);

    return NextResponse.json({
      success: true,
      data: newVendor,
      message: 'Vendor created successfully'
    });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const vendorIndex = vendors.findIndex(vendor => vendor.id === id);
    if (vendorIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    vendors[vendorIndex] = { ...vendors[vendorIndex], ...updateData };

    return NextResponse.json({
      success: true,
      data: vendors[vendorIndex],
      message: 'Vendor updated successfully'
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const vendorIndex = vendors.findIndex(vendor => vendor.id === id);
    if (vendorIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const deletedVendor = vendors.splice(vendorIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedVendor,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}
