import { NextRequest, NextResponse } from 'next/server';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import admin from 'firebase-admin';
import { db } from '@/lib/firebase';

// Initialize admin Firestore
const adminDb = admin.firestore();

interface FirebaseUser extends UserRecord {
  email: string;
  uid: string;
}

interface BoardInvitation {
  id: string;
  boardId: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  userId?: string;
  createdAt: any;
  updatedAt: any;
}

export async function GET(request: NextRequest) {
  try {
    // Get the invitation details from query parameters
    const boardId = request.nextUrl.searchParams.get('boardId');
    const memberId = request.nextUrl.searchParams.get('memberId');
    
    if (!boardId || !memberId) {
      return NextResponse.json({ error: 'Board ID and Member ID are required' }, { status: 400 });
    }
    
    // Redirect to a dedicated page where the user can accept the invitation after signing in
    const acceptUrl = `/invitations/accept?boardId=${boardId}&memberId=${memberId}`;
    return NextResponse.redirect(new URL(acceptUrl, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  } catch (error) {
    console.error('Error processing invitation:', error);
    return NextResponse.json({ error: 'Failed to process invitation' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the Firebase ID token from headers
    const authHeader = request.headers.get('authorization') || '';
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        // Verify the Firebase token
        const decodedToken = await getAuth().verifyIdToken(token);
        user = await getAuth().getUser(decodedToken.uid);
      } catch (error) {
        console.error('Error verifying token:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request parameters
    const boardId = request.nextUrl.searchParams.get('boardId');
    const memberId = request.nextUrl.searchParams.get('memberId');
    
    if (!boardId || !memberId) {
      return NextResponse.json({ error: 'Board ID and Member ID are required' }, { status: 400 });
    }

    // Get request body
    const body = await request.json();
    const { email } = body;

    console.log(`Accepting invitation for boardId: ${boardId}, memberId: ${memberId}, user: ${user.email}`);
    
    try {
      // Get the invitation details
      const memberDoc = await adminDb.collection('boards')
        .doc(boardId)
        .collection('members')
        .doc(memberId)
        .get();
      
      if (!memberDoc.exists) {
        return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
      }
      
      const inviteData = memberDoc.data();
      if (!inviteData) {
        return NextResponse.json({ error: 'Invalid invitation data' }, { status: 400 });
      }
      
      // Verify the email matches
      if (inviteData.email !== user.email) {
        return NextResponse.json({ 
          error: `This invitation was sent to ${inviteData.email}, but you're signed in as ${user.email}.` 
        }, { status: 403 });
      }
      
      console.log(`Accepting invitation for user ${user.uid} (${user.email})`);
      
      // Get the existing invite data
      const existingMemberData = memberDoc.data();
      
      // Update the existing member document instead of creating a new one
      const updatedMemberData = {
        ...existingMemberData,
        status: 'ACCEPTED',
        userId: user.uid,
        id: memberId, // Keep the original ID
        email: user.email,
        name: user.displayName || user.email,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      console.log('Updating existing member document with ACCEPTED status');
      
      // Update the original invitation document to show it's been accepted
      await adminDb.collection('boards')
        .doc(boardId)
        .collection('members')
        .doc(memberId)
        .update(updatedMemberData);
      
      // Verify the document was updated
      const updatedMemberDoc = await adminDb.collection('boards')
        .doc(boardId)
        .collection('members')
        .doc(memberId)
        .get();
        
      console.log('Successfully updated member document with ID:', memberId);
      console.log('Updated document data:', updatedMemberDoc.data());
      
      // Get board details to fetch the board title and owner
      const boardDoc = await adminDb.collection('boards').doc(boardId).get();
      const boardData = boardDoc.data();
      
      if (boardData) {
        // First notify the board owner
        try {
          // Import the notification creation function
          const { createInvitationAcceptedNotification } = await import('@/utils/notifications');
          
          // Notify the board owner
          await createInvitationAcceptedNotification(
            boardData.userId, // Board owner's userId
            user.displayName || '',
            user.email || '',
            boardData.title || 'Untitled Board',
            boardId
          );
          console.log(`Sent invitation acceptance notification to board owner ${boardData.userId}`);
          
          // Also notify all admin members of the board
          const adminMembersSnapshot = await adminDb.collection('boards')
            .doc(boardId)
            .collection('members')
            .where('role', '==', 'ADMIN')
            .where('status', '==', 'ACCEPTED')
            .get();
          
          // Send notifications to all admin members (except the accepting user)
          for (const adminDoc of adminMembersSnapshot.docs) {
            const adminData = adminDoc.data();
            if (adminData.userId && adminData.userId !== user.uid) {
              await createInvitationAcceptedNotification(
                adminData.userId,
                user.displayName || '',
                user.email || '',
                boardData.title || 'Untitled Board',
                boardId
              );
              console.log(`Sent invitation acceptance notification to admin ${adminData.userId}`);
            }
          }
        } catch (notificationError) {
          // Log the error but continue with the acceptance process
          console.error('Error creating notification:', notificationError);
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Invitation accepted successfully',
        boardId
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
    }
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}