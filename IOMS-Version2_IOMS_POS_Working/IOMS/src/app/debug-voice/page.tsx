// Voice AI Debug Page - Check menu data availability
import { getDishes } from '@/lib/menuService';

export default function VoiceAIDebug() {
  const checkMenuData = async () => {
    try {
      // Check menu for current user
      const response = await fetch('/api/voice-agent/menu?userId=demo-user');
      const data = await response.json();
      
      console.log('Menu API Response:', data);
      alert(`Menu items found: ${data.totalItems || 0}\nCheck console for details`);
    } catch (error) {
      console.error('Error:', error);
      alert('Error checking menu data');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Voice AI Debug</h1>
      
      <div className="space-y-4">
        <button 
          onClick={checkMenuData}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Check Menu Data for Voice AI
        </button>
        
        <div className="text-sm text-gray-600">
          <p>This will test if the Voice AI can access menu data.</p>
          <p>Expected: Should find VEGETABLE SAMOSA and other items.</p>
        </div>
      </div>
    </div>
  );
}
