import { NextRequest, NextResponse } from 'next/server';
import { getDishes } from '@/lib/menuService';
import { getServerSideDishes } from '@/lib/serverMenuService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('[Voice Agent Menu API] Fetching menu for user:', userId);

    // Get real menu items - try client-side first, then server-side
    let dishes = getDishes(userId);
    
    // If client-side returns empty (server environment), use server-side menu service  
    if (dishes.length === 0) {
      console.log('[Voice Agent Menu API] Client-side menu empty, using server-side menu');
      dishes = getServerSideDishes(userId);
    }

    console.log('[Voice Agent Menu API] Raw dishes returned:', dishes.length, 'items');
    
    // If no dishes found for this user, try the default user
    let finalDishes = dishes;
    if (dishes.length === 0) {
      console.log('[Voice Agent Menu API] No dishes for user, trying DEFAULT_USER_ID');
      const defaultUserId = process.env.DEFAULT_USER_ID || 'user_1752538556589_u705p8e0q';
      finalDishes = getDishes(defaultUserId);
      
      // Try server-side for default user too
      if (finalDishes.length === 0) {
        finalDishes = getServerSideDishes(defaultUserId);
      }
      
      console.log('[Voice Agent Menu API] Default user dishes:', finalDishes.length, 'items');
    }

    // Format menu items for voice AI with availability information
    const menuItems = finalDishes.map(dish => {
      // Handle price conversion safely
      let price = 0;
      if (typeof dish.price === 'number') {
        price = dish.price;
      } else if (dish.price) {
        const priceStr = String(dish.price);
        price = parseFloat(priceStr.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
      }

      // Handle ingredients conversion safely
      let ingredientsStr = '';
      if (Array.isArray(dish.ingredients)) {
        ingredientsStr = dish.ingredients
          .map(ing => typeof ing === 'string' ? ing : (ing as any).inventoryItemName || String(ing))
          .join(', ');
      } else if (dish.ingredients) {
        ingredientsStr = String(dish.ingredients);
      }

      return {
        id: dish.id,
        name: dish.name,
        price,
        category: dish.category,
        ingredients: ingredientsStr,
        available: true, // TODO: Integrate with inventory availability checking
        description: `${dish.name} - ${dish.category}`
      };
    });

    console.log(`[Voice Agent Menu API] Found ${menuItems.length} menu items`);

    return NextResponse.json({
      success: true,
      menuItems,
      totalItems: menuItems.length,
      categories: [...new Set(finalDishes.map(dish => dish.category))].filter(Boolean),
      debug: {
        requestedUserId: userId,
        usedFallback: dishes.length === 0,
        originalDishCount: dishes.length,
        finalDishCount: finalDishes.length
      }
    });

  } catch (error) {
    console.error('[Voice Agent Menu API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}
