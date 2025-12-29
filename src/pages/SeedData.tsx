import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'owner' | 'expert' | 'visitor';
  phone: string;
  country: string;
  gender: 'male' | 'female' | 'other';
  birthdate: string;
}

const testUsers: TestUser[] = [
  {
    email: 'admin@test.com',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    phone: '+966501234567',
    country: 'Saudi Arabia',
    gender: 'male',
    birthdate: '1985-01-15'
  },
  {
    email: 'owner1@test.com',
    password: 'password123',
    firstName: 'Mohammed',
    lastName: 'Al-Saud',
    role: 'owner',
    phone: '+966502345678',
    country: 'Saudi Arabia',
    gender: 'male',
    birthdate: '1990-05-20'
  },
  {
    email: 'owner2@test.com',
    password: 'password123',
    firstName: 'Fatima',
    lastName: 'Al-Rashid',
    role: 'owner',
    phone: '+966503456789',
    country: 'Saudi Arabia',
    gender: 'female',
    birthdate: '1988-08-12'
  },
  {
    email: 'expert1@test.com',
    password: 'password123',
    firstName: 'Ahmed',
    lastName: 'Al-Qahtani',
    role: 'expert',
    phone: '+966504567890',
    country: 'Saudi Arabia',
    gender: 'male',
    birthdate: '1982-03-25'
  },
  {
    email: 'expert2@test.com',
    password: 'password123',
    firstName: 'Khalid',
    lastName: 'Al-Otaibi',
    role: 'expert',
    phone: '+966505678901',
    country: 'Saudi Arabia',
    gender: 'male',
    birthdate: '1980-11-30'
  },
  {
    email: 'visitor@test.com',
    password: 'password123',
    firstName: 'Sara',
    lastName: 'Al-Mutairi',
    role: 'visitor',
    phone: '+966506789012',
    country: 'Saudi Arabia',
    gender: 'female',
    birthdate: '1995-07-18'
  }
];

export default function SeedData() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addProgress = (message: string) => {
    setProgress(prev => [...prev, message]);
  };

  const seedUsers = async () => {
    setLoading(true);
    setProgress([]);
    setError(null);

    try {
      addProgress('Starting user creation...');

      for (const user of testUsers) {
        addProgress(`Creating ${user.email}...`);

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              first_name: user.firstName,
              last_name: user.lastName,
            }
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            addProgress(`  ✓ ${user.email} already exists`);
            continue;
          }
          throw signUpError;
        }

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              email: user.email,
              first_name: user.firstName,
              last_name: user.lastName,
              role: user.role,
              phone: user.phone,
              country: user.country,
              gender: user.gender,
              birthdate: user.birthdate
            });

          if (profileError) throw profileError;

          addProgress(`  ✓ Created ${user.email} (${user.role})`);
        }
      }

      addProgress('All users created successfully!');
      addProgress('Creating sample camels...');

      await seedCamels();

      addProgress('Database seeding complete!');

      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
      addProgress(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const seedCamels = async () => {
    const { data: owner1 } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'owner1@test.com')
      .single();

    const { data: owner2 } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'owner2@test.com')
      .single();

    if (!owner1 || !owner2) return;

    const camels = [
      {
        owner_id: owner1.id,
        name: 'Majesty',
        breed: 'Majahim',
        gender: 'male',
        age: 5,
        notes: 'Champion breed with excellent lineage'
      },
      {
        owner_id: owner1.id,
        name: 'Desert Star',
        breed: 'Shaele',
        gender: 'female',
        age: 4,
        notes: 'Beautiful camel with great temperament'
      },
      {
        owner_id: owner1.id,
        name: 'Thunder',
        breed: 'Majahim',
        gender: 'male',
        age: 6,
        notes: 'Strong and powerful camel'
      },
      {
        owner_id: owner2.id,
        name: 'Pearl',
        breed: 'Shaele',
        gender: 'female',
        age: 3,
        notes: 'Young and promising camel'
      },
      {
        owner_id: owner2.id,
        name: 'Golden Sand',
        breed: 'Homor',
        gender: 'male',
        age: 7,
        notes: 'Experienced racing camel'
      }
    ];

    for (const camel of camels) {
      const { data: camelData, error: camelError } = await supabase
        .from('camels')
        .insert(camel)
        .select()
        .single();

      if (camelError) {
        addProgress(`  Warning: Could not create camel ${camel.name}`);
        continue;
      }

      const { error: imageError } = await supabase
        .from('camel_images')
        .insert({
          camel_id: camelData.id,
          image_url: 'https://images.pexels.com/photos/2382681/pexels-photo-2382681.jpeg'
        });

      if (!imageError) {
        addProgress(`  ✓ Created camel: ${camel.name}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Seed Test Data</h1>
        <p className="text-gray-600 mb-6">
          This will create test accounts and sample data for development purposes.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Test Accounts:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>admin@test.com / password123 (Admin)</li>
            <li>owner1@test.com / password123 (Owner)</li>
            <li>owner2@test.com / password123 (Owner)</li>
            <li>expert1@test.com / password123 (Expert)</li>
            <li>expert2@test.com / password123 (Expert)</li>
            <li>visitor@test.com / password123 (Visitor)</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {progress.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
            <div className="font-mono text-sm space-y-1">
              {progress.map((msg, idx) => (
                <div key={idx} className="text-gray-700">{msg}</div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={seedUsers}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Seeding...' : 'Seed Database'}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
