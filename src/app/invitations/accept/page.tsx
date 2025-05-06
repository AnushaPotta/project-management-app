'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  Box,
  Button,
  Center,
  Container,
  Heading,
  Spinner,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [boardName, setBoardName] = useState('Board');
  
  const boardId = searchParams.get('boardId');
  const memberId = searchParams.get('memberId');
  
  useEffect(() => {
    if (!boardId || !memberId) {
      setError('Invalid invitation link. Missing required parameters.');
      setLoading(false);
      return;
    }
    
    // Just stop loading after checking parameters
    // We'll fetch details when user clicks accept
    setLoading(false);
  }, [boardId, memberId]);
  
  const acceptInvitation = async () => {
    console.log('Accept invitation button clicked');
    console.log('BoardId:', boardId, 'MemberId:', memberId);
    
    // Display a toast to confirm the button was clicked
    toast({
      title: 'Processing invitation...',
      description: 'Please wait while we process your invitation.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    
    if (!boardId || !memberId) {
      console.error('Missing boardId or memberId');
      toast({
        title: 'Invalid invitation',
        description: 'This invitation link is invalid or has expired.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to accept this invitation.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Get the ID token for authorization
      console.log('Getting ID token for user:', user.email);
      const idToken = await user.getIdToken();
      
      // Use the server API endpoint to update the invitation status
      console.log('Sending POST request to accept invitation');
      console.log(`URL: /api/invitations/accept?boardId=${boardId}&memberId=${memberId}`);
      
      const response = await fetch(`/api/invitations/accept?boardId=${boardId}&memberId=${memberId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          email: user.email
        })
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }
      
      toast({
        title: 'Invitation accepted',
        description: `You are now a member of the board!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Navigate to the board
      router.push(`/boards/${boardId}`);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      toast({
        title: 'Failed to accept invitation',
        description: error.message || 'An error occurred while trying to accept the invitation.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Center minH="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="purple.500" />
          <Text>Loading invitation...</Text>
        </VStack>
      </Center>
    );
  }
  
  if (error) {
    return (
      <Container maxW="container.md" py={10}>
        <VStack spacing={6} align="center">
          <Heading as="h1" size="xl" color="red.500">
            Invitation Error
          </Heading>
          <Text fontSize="lg" textAlign="center">
            {error}
          </Text>
          <Button colorScheme="blue" onClick={() => router.push('/')}>
            Go to Dashboard
          </Button>
        </VStack>
      </Container>
    );
  }
  
  // Check if user is not logged in
  const auth = getAuth();
  if (!auth.currentUser) {
    return (
      <Container maxW="container.md" py={10}>
        <VStack spacing={6} align="center">
          <Heading as="h1" size="xl">
            Board Invitation
          </Heading>
          <Text fontSize="lg" textAlign="center">
            You need to sign in to accept this invitation.
          </Text>
          <Button colorScheme="purple" onClick={() => router.push('/login')}>
            Sign In
          </Button>
        </VStack>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="center">
        <Heading as="h1" size="xl">
          Board Invitation
        </Heading>
        <Box p={6} borderWidth={1} borderRadius="lg" width="100%">
          <VStack spacing={4} align="start">
            <Text fontSize="lg">
              <strong>Board:</strong> {boardName || 'Untitled Board'}
            </Text>
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              You've been invited to join this board
            </Text>
            <Text fontSize="lg">
              <strong>Role:</strong> Member
            </Text>
            <Text fontSize="md" color="gray.600" mt={2}>
              Click the button below to accept this invitation and gain access to the board.
            </Text>
          </VStack>
        </Box>
        <Box>
          <Button 
            colorScheme="green" 
            size="lg" 
            onClick={acceptInvitation}
            leftIcon={<Text>✓</Text>}
            px={8}
            py={6}
            fontSize="lg"
            _hover={{ transform: 'scale(1.05)' }}
            transition="all 0.2s"
          >
            ACCEPT INVITATION
          </Button>
        </Box>
      </VStack>
    </Container>
  );
}
