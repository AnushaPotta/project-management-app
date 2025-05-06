import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';

// Initialize admin Firestore
const adminDb = admin.firestore();

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const boardId = request.nextUrl.searchParams.get('boardId');
    const memberId = request.nextUrl.searchParams.get('memberId');
    
    if (!boardId || !memberId) {
      return NextResponse.json({ error: 'Board ID and Member ID are required' }, { status: 400 });
    }

    console.log(`Fetching invitation details for boardId: ${boardId}, memberId: ${memberId}`);
    
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
      
      // Get board details
      const boardDoc = await adminDb.collection('boards').doc(boardId).get();
      const boardName = boardDoc.exists ? boardDoc.data().title : 'Untitled Board';
      
      return NextResponse.json({ 
        success: true, 
        invitation: inviteData,
        boardName: boardName
      });
    } catch (error) {
      console.error('Error fetching invitation details:', error);
      return NextResponse.json({ error: 'Failed to fetch invitation details' }, { status: 500 });
    }
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
