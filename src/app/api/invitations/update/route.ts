import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';
import { db } from '@/lib/firebase';

// Initialize admin Firestore
const adminDb = admin.firestore();

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

    // Get request body
    const body = await request.json();
    const { boardId, memberId } = body;
    
    if (!boardId || !memberId) {
      return NextResponse.json({ error: 'Board ID and Member ID are required' }, { status: 400 });
    }

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
      
      // Verify the email matches
      if (inviteData.email !== user.email) {
        return NextResponse.json({ 
          error: `This invitation was sent to ${inviteData.email}, but you're signed in as ${user.email}.` 
        }, { status: 403 });
      }
      
      // Update the invitation status
      await adminDb.collection('boards')
        .doc(boardId)
        .collection('members')
        .doc(memberId)
        .update({
          status: 'ACCEPTED',
          userId: user.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      
      console.log('Successfully updated invitation status');
      
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
