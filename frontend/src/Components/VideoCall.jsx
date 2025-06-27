import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { FaPhone, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import "../Styles/videocall.css";

const VideoCall = ({targetEmail}) => {
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get('email');
  const [userId, setUserId] = useState('');
  const [targetUserId, setTargetUserId] = useState(emailFromQuery || '');
  const [localStream, setLocalStream] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // ICE candidate buffer for race condition handling
  const iceCandidateBuffer = useRef([]);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ]
  };

  useEffect(() => {
  socketRef.current = io('https://taskify-e5u2.onrender.com', {
    transports: ['websocket'],
    forceNew: true
  });

  socketRef.current.on('connect', () => {
    const userEmail = localStorage.email;
    if (userEmail && typeof userEmail === 'string' && userEmail.trim() !== '') {
      console.log("Registering email:", userEmail);
      socketRef.current.emit('register-email', userEmail);
      setUserId(userEmail);
    } else {
      alert("Your email is not set. Please login again.");
      console.error("User email missing, can't register-email");
    }
  });


    socketRef.current.on('incoming-call', async ({ from, offer }) => {
      setIncomingCall({ from, offer });
      setCurrentCallId(from);
    });

    socketRef.current.on('call-accepted', async (answer) => {
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    });

    socketRef.current.on('candidate', async (candidate) => {
      try {
        if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    socketRef.current.on('call-ended', () => {
      cleanupCall();
    });

    return () => {
      cleanupCall();
      socketRef.current?.disconnect();
    };
  }, []);

  // Helper: send any buffered ICE candidates after currentCallId is set
  const sendBufferedCandidates = (callId) => {
    if (callId && iceCandidateBuffer.current.length > 0) {
      iceCandidateBuffer.current.forEach(candidate => {
        socketRef.current.emit('candidate', {
          to: callId,
          candidate
        });
      });
      iceCandidateBuffer.current = [];
    }
  };

  // Always create a new peer connection for each call
  const createPeerConnection = () => {
  if (peerConnectionRef.current) {
    peerConnectionRef.current.onicecandidate = null;
    peerConnectionRef.current.ontrack = null;
    peerConnectionRef.current.oniceconnectionstatechange = null;
    peerConnectionRef.current.close();
    peerConnectionRef.current = null;
  }

  const pc = new RTCPeerConnection(iceServers);
  peerConnectionRef.current = pc;

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('Generated ICE candidate:', event.candidate);
      if (currentCallId) {
        socketRef.current.emit('candidate', {
          to: currentCallId,
          candidate: event.candidate
        });
      } else {
        iceCandidateBuffer.current.push(event.candidate);
      }
    }
  };

 pc.ontrack = (event) => {
  console.log('ontrack fired. Remote stream:', event.streams[0]);
  if (remoteVideoRef.current && event.streams[0]) {
    remoteVideoRef.current.srcObject = event.streams[0];
    remoteVideoRef.current.play().catch(e => console.error("Can't autoplay remote video:", e));
  }
};

  pc.oniceconnectionstatechange = () => {
    console.log('ICE connection state:', pc.iceConnectionState);
  };

  return pc;
};
  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      alert('Cannot access camera or microphone');
    }
  };

  const initiateCall = async () => {
    if (!targetUserId.trim()) {
      alert('Please enter a user ID to call');
      return;
    }

    try {
      setCurrentCallId(targetUserId);
      setIsInCall(true);

      const stream = await startLocalStream();
      const pc = createPeerConnection();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);

      // Send any buffered ICE candidates now that currentCallId is set
      sendBufferedCandidates(targetUserId);

      socketRef.current.emit('initiate-call', {
        toEmail: targetUserId,
        offer: pc.localDescription
      });
    } catch (error) {
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      setIsInCall(true);
      setCurrentCallId(incomingCall.from);

      const stream = await startLocalStream();
      const pc = createPeerConnection();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send any buffered ICE candidates now that currentCallId is set
      sendBufferedCandidates(incomingCall.from);

      socketRef.current.emit('accept-call', {
        to: incomingCall.from,
        answer: pc.localDescription
      });

      setIncomingCall(null);
    } catch (error) {
      cleanupCall();
    }
  };

  // Robust cleanup
  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    iceCandidateBuffer.current = [];
    setLocalStream(null);
    setIsInCall(false);
    setIncomingCall(null);
    setCurrentCallId(null);
    setIsAudioMuted(false);
    setIsVideoOff(false);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const endCall = () => {
    socketRef.current.emit('end-call', { to: currentCallId });
    cleanupCall();
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="video-call-container">
      <h2 className="user-id">Your ID: {userId}</h2>
      <div className="call-controls">
        {!emailFromQuery && (
          <input
            type="text"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            placeholder="Enter email ID to call"
            className="input-field"
          />
        )}

        <button
          onClick={initiateCall}
          disabled={isInCall}
          className="btn btn-primary"
        >
          <FaPhone /> Call
        </button>
      </div>

      {incomingCall && (
        <div className="incoming-call">
          <p>Incoming call from: {incomingCall.from}</p>
          <div className="call-actions">
            <button onClick={acceptCall} className="btn btn-primary">
              <FaPhone /> Accept
            </button>
            <button onClick={() => setIncomingCall(null)} className="btn btn-danger">
              <FaPhoneSlash /> Reject
            </button>
          </div>
        </div>
      )}

      {isInCall && (
        <div className="video-grid">
          <div className="video-container">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="video"
            />
            <p className="video-label">Local</p>
          </div>
          <div className="video-container">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="video"
            />
            <p className="video-label">Remote</p>
          </div>
          <div className="call-actions">
            <button onClick={toggleAudio} className={`action-btn ${isAudioMuted ? 'active' : ''}`}>
              {isAudioMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
            <button onClick={toggleVideo} className={`action-btn ${isVideoOff ? 'active' : ''}`}>
              {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
            </button>
            <button onClick={endCall} className="action-btn end-call-btn">
              <FaPhoneSlash />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;