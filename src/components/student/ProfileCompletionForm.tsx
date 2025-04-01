
import React from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfileCompletionForm() {
  const [formData, setFormData] = React.useState({
    fullName: '',
    phone: '',
    department: '',
    batchYear: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: ''
    }
  });
  
  const supabase = useSupabaseClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('student')
        .update({
          name: formData.fullName,
          phone: formData.phone,
          department: formData.department,
          batch_year: formData.batchYear,
          address: formData.address,
          status: 'active' // Update status after profile completion
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      router.push('/student/dashboard'); // Redirect to dashboard
    } catch (err) {
      console.error('Profile update error:', err);
      alert('Failed to save profile!');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Complete Your Profile</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Details */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
          />
        </div>

        {/* Academic Details */}
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="batchYear">Batch Year</Label>
          <Input
            id="batchYear"
            type="number"
            value={formData.batchYear}
            onChange={(e) => setFormData({...formData, batchYear: e.target.value})}
            required
          />
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label>Address</Label>
          <Input
            placeholder="Street"
            value={formData.address.street}
            onChange={(e) => setFormData({
              ...formData,
              address: {...formData.address, street: e.target.value}
            })}
            className="mb-2"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="City"
              value={formData.address.city}
              onChange={(e) => setFormData({
                ...formData,
                address: {...formData.address, city: e.target.value}
              })}
            />
            <Input
              placeholder="State"
              value={formData.address.state}
              onChange={(e) => setFormData({
                ...formData,
                address: {...formData.address, state: e.target.value}
              })}
            />
          </div>
          <Input
            placeholder="Postal Code"
            value={formData.address.postalCode}
            onChange={(e) => setFormData({
              ...formData,
              address: {...formData.address, postalCode: e.target.value}
            })}
          />
        </div>

        <Button type="submit" className="w-full">
          Save Profile
        </Button>
      </form>
    </div>
  );
}