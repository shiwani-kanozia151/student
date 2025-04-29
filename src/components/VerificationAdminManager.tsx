'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import styles from './VerificationAdminManager.module.css';
import { Button, TextField, Typography, Paper, List, ListItem, Box, Container, CircularProgress, Snackbar, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useSearchParams } from 'next/navigation';

type VerificationAdmin = {
  id: string;
  email: string;
  course_id: string;
  course_name: string;
  created_at: string;
  last_login: string | null;
};

type Course = {
  course_id: string;
  name: string;
};

export default function VerificationAdminManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [verificationAdmins, setVerificationAdmins] = useState<VerificationAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const searchParams = useSearchParams();
  const supabaseUrl = searchParams.get('supabaseUrl') || '';
  const supabaseKey = searchParams.get('supabaseKey') || '';
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  useEffect(() => {
    async function createTableIfNotExists() {
      try {
        // First, check if the table exists by attempting to select from it
        const { error: selectError } = await supabase
          .from('verification_admins')
          .select('id')
          .limit(1);

        if (selectError && selectError.code === '42P01') {
          // Table doesn't exist, create it using our API endpoint
          const response = await fetch('/api/auth/create-verification-admins-table', {
            method: 'POST',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create verification_admins table');
          }
          
          setNotification({
            message: 'Verification admins table created successfully',
            type: 'success'
          });
        }
      } catch (err: any) {
        console.error('Error checking/creating verification_admins table:', err);
        setError('Failed to initialize verification admin system: ' + err.message);
      }
    }

    async function fetchData() {
      setLoading(true);
      try {
        await createTableIfNotExists();
        
        // Fetch courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('course_id, name')
          .eq('active', true);
        
        if (coursesError) throw coursesError;
        setCourses(coursesData || []);
        
        // Fetch verification admins
        const { data: adminsData, error: adminsError } = await supabase
          .from('verification_admins')
          .select('*');
        
        if (adminsError) throw adminsError;
        setVerificationAdmins(adminsData || []);
        
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load data: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    if (supabaseUrl && supabaseKey) {
      fetchData();
    }
  }, [supabaseUrl, supabaseKey]);

  const addVerificationAdmin = async () => {
    if (!newEmail || !newPassword || !selectedCourse) {
      setNotification({
        message: 'Please fill in all fields',
        type: 'error'
      });
      return;
    }

    try {
      const selectedCourseObj = courses.find(c => c.course_id === selectedCourse);
      if (!selectedCourseObj) {
        throw new Error('Selected course not found');
      }

      // Hash the password before storing (this would be done server-side)
      const response = await fetch('/api/auth/create-verification-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          course_id: selectedCourse,
          course_name: selectedCourseObj.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create verification admin');
      }

      const newAdmin = await response.json();
      
      setVerificationAdmins([...verificationAdmins, newAdmin]);
      setNewEmail('');
      setNewPassword('');
      setSelectedCourse('');
      setNotification({
        message: 'Verification admin added successfully',
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error adding verification admin:', err);
      setNotification({
        message: 'Failed to add verification admin: ' + err.message,
        type: 'error'
      });
    }
  };

  const deleteVerificationAdmin = async (id: string) => {
    try {
      const { error } = await supabase
        .from('verification_admins')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setVerificationAdmins(verificationAdmins.filter(admin => admin.id !== id));
      setNotification({
        message: 'Verification admin deleted successfully',
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error deleting verification admin:', err);
      setNotification({
        message: 'Failed to delete verification admin: ' + err.message,
        type: 'error'
      });
    }
  };

  if (!supabaseUrl || !supabaseKey) {
    return (
      <Container>
        <Typography variant="h6" color="error">
          Missing Supabase credentials. Please provide supabaseUrl and supabaseKey as query parameters.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Verification Admin Manager
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Add New Verification Admin
            </Typography>
            <Box component="form" noValidate sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <TextField
                select
                margin="normal"
                required
                fullWidth
                label="Course"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.name} ({course.course_id})
                  </option>
                ))}
              </TextField>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={addVerificationAdmin}
                sx={{ mt: 3, mb: 2 }}
              >
                Add Verification Admin
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Verification Admins
            </Typography>
            {verificationAdmins.length === 0 ? (
              <Typography variant="body1" color="textSecondary">
                No verification admins found.
              </Typography>
            ) : (
              <List>
                {verificationAdmins.map((admin) => (
                  <ListItem
                    key={admin.id}
                    divider
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1">{admin.email}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Course: {admin.course_name} ({admin.course_id})
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Created: {new Date(admin.created_at).toLocaleString()}
                      </Typography>
                      {admin.last_login && (
                        <Typography variant="body2" color="textSecondary">
                          Last Login: {new Date(admin.last_login).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => deleteVerificationAdmin(admin.id)}
                    >
                      Delete
                    </Button>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </>
      )}
      
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
      >
        {notification && (
          <Alert 
            onClose={() => setNotification(null)} 
            severity={notification.type}
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Container>
  );
} 