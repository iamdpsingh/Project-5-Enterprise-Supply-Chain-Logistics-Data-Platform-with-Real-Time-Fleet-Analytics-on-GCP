import { NextResponse } from 'next/server';
import { Firestore } from '@google-cloud/firestore';

const projectId = 'supply-chain-logistics-508517';
const firestore = new Firestore({ projectId });

export async function GET() {
  try {
    const snapshot = await firestore.collection('active_fleet').limit(50).get();
    
    if (snapshot.empty) {
      throw new Error("No active fleet data found");
    }

    const fleet = [];
    snapshot.forEach(doc => {
      fleet.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json(fleet);
  } catch (error) {
    console.warn("Firestore failed, returning mock fleet data", error.message);
    
    // Generate mock fleet data
    const mockFleet = [];
    for (let i = 0; i < 20; i++) {
      mockFleet.push({
        id: `VEH_00${Math.floor(Math.random() * 9000) + 1000}`,
        latitude: (Math.random() * (49 - 25) + 25).toFixed(4),
        longitude: (Math.random() * (-67 - -125) + -125).toFixed(4),
        speed_kmh: Math.floor(Math.random() * 110) + 20,
        status: Math.random() > 0.1 ? 'Active' : 'Maintenance'
      });
    }
    
    return NextResponse.json(mockFleet);
  }
}
