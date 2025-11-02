import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient'; // Fixed path
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Mic, Camera, Zap, Battery, Wifi, Heart, Users, Copy, Check, History,
} from 'lucide-react';
import { toast } from 'sonner';
import MapView from './components/tracker/MapView'; // Fixed path
import DistanceDisplay from './components/tracker/DistanceDisplay'; // Fixed path
import VoiceRecorder from './components/tracker/VoiceRecorder'; // Fixed path
import VoiceMessageList from './components/tracker/VoiceMessageList'; // Fixed path
import CameraCapture from './components/tracker/CameraCapture'; // Fixed path
import PhotoGallery from './components/tracker/PhotoGallery'; // Fixed path

// Generate a random 6-character pairing code
const generatePairingCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function FestivalTracker({ session }) {
  const [user, setUser] = useState(session.user);
  const existingGroupId = session.user?.user_metadata?.group_id || null;
  const existingPartnerName = session.user?.user_metadata?.partner_name || '';


  const [myName, setMyName] = useState(session.user?.user_metadata?.full_name || existingPartnerName);
  const [isSetup, setIsSetup] = useState(!!existingGroupId); // true if group exists
  const [groupId, setGroupId] = useState(existingGroupId || '');
  const [showPairingSetup, setShowPairingSetup] = useState(!existingGroupId); // false if group exists

  const [myLocation, setMyLocation] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [pairingMode, setPairingMode] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [historyPeriod, setHistoryPeriod] = useState(24); // hours
  const [activeTab, setActiveTab] = useState('map'); // State for tabs
  const queryClient = useQueryClient();

  // (All your data-fetching and helper functions remain the same)
  // ...
  // Load current user
  // useEffect(() => {
  //   const { data: authListener } = supabase.auth.onAuthStateChange(
  //     (event, session) => {
  //       const currentUser = session?.user;
  //       setUser(currentUser); 
  //       if (currentUser) {
  //         const userData = currentUser.user_metadata;
  //         if (userData.partner_name && userData.group_id) {
  //           setMyName(userData.partner_name);
  //           setGroupId(userData.group_id);
  //           setIsSetup(true);
  //           setShowPairingSetup(false);
  //         }
  //       }
  //     }
  //   );
  //   const checkUser = async () => {
  //     const { data: { user } } = await supabase.auth.getUser();
  //     setUser(user);
  //     if (user) {
  //       const userData = user.user_metadata;
  //       if (userData.partner_name && userData.group_id) {
  //         setMyName(userData.partner_name);
  //         setGroupId(userData.group_id);
  //         setIsSetup(true);
  //         setShowPairingSetup(false);
  //       }
  //     }
  //   };
  //   checkUser();
  //   return () => {
  //     authListener.subscription.unsubscribe();
  //   };
  // }, []);

  // Get battery level
  useEffect(() => {
    const getBattery = async () => {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }
    };
    getBattery();
  }, []);

  // Get location updates
  useEffect(() => {
    if (!isSetup || !isSharing) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setMyLocation(location);
      },
      (error) => {
        console.error('Location error:', error);
        toast.error('Could not get location. Please enable GPS.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isSetup, isSharing]);

  // Update location in database
  const updateLocationMutation = useMutation({
    mutationFn: async (location) => {
      const { error } = await supabase.from('LocationUpdate').insert({
        ...location,
        battery_level: batteryLevel,
        partner_name: myName,
        is_active: isSharing,
        group_id: groupId,
        created_by_email: user.email,
        created_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', groupId] });
      queryClient.invalidateQueries({ queryKey: ['locationHistory', groupId] });
    },
  });

  // Throttle location updates
  useEffect(() => {
    if (!myLocation || !isSharing || !groupId) return;
    const interval = setInterval(() => {
      updateLocationMutation.mutate(myLocation);
    }, 30000); 
    updateLocationMutation.mutate(myLocation); 
    return () => clearInterval(interval);
  }, [myLocation, isSharing, groupId, updateLocationMutation]);

  // Fetch current active locations
  const { data: allLocations = [] } = useQuery({
    queryKey: ['locations', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('LocationUpdate')
        .select()
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw new Error(error.message);
      return data;
    },
    refetchInterval: 3000,
    enabled: !!groupId,
  });

  // Fetch location history
  const { data: locationHistory = [] } = useQuery({
    queryKey: ['locationHistory', groupId, historyPeriod],
    queryFn: async () => {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - historyPeriod);
      const { data, error } = await supabase
        .from('LocationUpdate')
        .select()
        .eq('group_id', groupId)
        .gt('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    refetchInterval: 30000,
    enabled: !!groupId && showHistory,
  });

  // Fetch voice messages
  const { data: voiceMessages = [] } = useQuery({
    queryKey: ['voiceMessages', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('VoiceMessage')
        .select()
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    refetchInterval: 5000,
    enabled: !!groupId,
  });

  // Fetch photos
  const { data: photos = [] } = useQuery({
    queryKey: ['photos', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('FestivalPhoto')
        .select()
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    refetchInterval: 5000,
    enabled: !!groupId,
  });

  // Get latest location for each user
  const getLatestLocationByUser = (locations, email) => {
    const userLocations = locations
      .filter((loc) => loc.created_by_email === email)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return userLocations[0];
  };

  const myLatestLocation = user ? getLatestLocationByUser(allLocations, user.email) : null;
  const partnerLocation = allLocations.find((loc) => loc.created_by_email !== user?.email);

  // Organize history by user
  const myHistory = user ? locationHistory.filter((loc) => loc.created_by_email === user.email) : [];
  const partnerHistory = locationHistory.filter((loc) => loc.created_by_email !== user?.email);

  const handleCreateGroup = async () => {
    if (!myName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    const newGroupId = generatePairingCode();
    setGroupId(newGroupId);
    try {
      await supabase.auth.updateUser({
        data: { partner_name: myName, group_id: newGroupId },
      });
      setIsSetup(true);
      setIsSharing(true);
      setShowPairingSetup(false);
      toast.success('Group created! Share your code with your partner.');
    } catch {
      toast.error('Setup failed');
    }
  };

  const handleJoinGroup = async () => {
    if (!myName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!joinCode.trim()) {
      toast.error('Please enter the pairing code');
      return;
    }
    const codeToJoin = joinCode.toUpperCase().trim();
    setGroupId(codeToJoin);
    try {
      await supabase.auth.updateUser({
        data: { partner_name: myName, group_id: codeToJoin },
      });
      setIsSetup(true);
      setIsSharing(true);
      setShowPairingSetup(false);
      toast.success('Joined group! You are now connected.');
    } catch {
      toast.error('Failed to join group');
    }
  };

  const copyPairingCode = () => {
    navigator.clipboard.writeText(groupId);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFindMeNow = () => {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    if (myLocation) updateLocationMutation.mutate(myLocation);
    toast.success('🚨 Find Me signal sent!', {
      description: 'Your location has been updated immediately.',
    });
  };

  // Setup screen with pairing
  if (!isSetup || showPairingSetup) {
    return (
      <div className="setup-container">
        <div className="setup-card">
          <div className="setup-icon">
            <Heart size={40} color="white" />
          </div>
          <h1 className="setup-title">Festival Tracker</h1>
          <p className="setup-subtitle">Stay connected at the festival</p>

          {!pairingMode ? (
            <div className="setup-form">
              <div>
                <label className="setup-label">What's your name?</label>
                <input
                  placeholder="Enter your name"
                  value={myName}
                  onChange={(e) => setMyName(e.target.value)}
                  className="input"
                />
              </div>

              <div className="setup-button-group">
                <p style={{ fontSize: '0.875rem', color: '#555' }}>Choose an option:</p>
                <button
                  onClick={() => setPairingMode('create')}
                  disabled={!myName.trim()}
                  className="button button-primary"
                >
                  <Users size={20} />
                  Create New Group
                </button>
                <button
                  onClick={() => setPairingMode('join')}
                  disabled={!myName.trim()}
                  className="button button-outline"
                >
                  <Heart size={20} />
                  Join Partner's Group
                </button>
              </div>
            </div>
          ) : pairingMode === 'create' ? (
            <div className="setup-form">
              <div style={{ backgroundColor: '#ede7f6', padding: '1.5rem', borderRadius: '0.75rem' }}>
                <p style={{ color: '#555', margin: '0 0 0.5rem 0' }}>Your Pairing Code</p>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.1em' }}>
                  {generatePairingCode()}
                </div>
              </div>
              <button onClick={handleCreateGroup} className="button button-primary">
                Start Tracking
              </button>
              <button onClick={() => setPairingMode(null)} className="button button-outline">
                Back
              </button>
            </div>
          ) : (
            <div className="setup-form">
              <div>
                <label className="setup-label">Enter Partner's Code</label>
                <input
                  placeholder="e.g. ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="input"
                  style={{ textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                  maxLength={6}
                />
              </div>
              <button
                onClick={handleJoinGroup}
                disabled={joinCode.length < 6}
                className="button button-primary"
              >
                Join & Start Tracking
              </button>
              <button onClick={() => setPairingMode(null)} className="button button-outline">
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main App Screen
  return (
    <div className="page-wrapper">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <Heart size={32} />
            <div>
              <h1>Festival Tracker</h1>
              <p>{myName}</p>
            </div>
          </div>
          <div className="header-right">
            <button
              onClick={copyPairingCode}
              className="button button-ghost"
              style={{ color: 'white' }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span style={{marginLeft: '0.5rem'}}>{groupId}</span>
            </button>
            <div className="header-info">
              <Battery size={16} />
              <span>{batteryLevel || '?'}%</span>
            </div>
            <div className="header-info">
              <Wifi size={16} />
              <span>{isSharing ? 'Live' : 'Off'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-container">
        {/* Quick Actions */}
        <div className="actions-grid">
          <button
            onClick={() => setIsSharing(!isSharing)}
            className={`button action-button ${isSharing ? 'button-green' : 'button-outline'}`}
          >
            <MapPin size={20} />
            {isSharing ? 'Sharing Location' : 'Start Sharing'}
          </button>
          <button
            onClick={handleFindMeNow}
            className="button action-button button-red"
          >
            <Zap size={20} />
            Find Me Now!
          </button>
        </div>

        {/* Distance Card */}
        <div style={{ marginBottom: '1.5rem' }}>
          <DistanceDisplay
            myLocation={myLatestLocation}
            partnerLocation={partnerLocation}
            partnerName={partnerLocation?.partner_name}
          />
        </div>

        {/* Tabs */}
        <div className="tabs-list">
          <button 
            className="tab-trigger" 
            data-active={activeTab === 'map'} 
            onClick={() => setActiveTab('map')}
          >
            <MapPin size={16} /> Map
          </button>
          <button 
            className="tab-trigger" 
            data-active={activeTab === 'voice'} 
            onClick={() => setActiveTab('voice')}
          >
            <Mic size={16} /> Voice
          </button>
          <button 
            className="tab-trigger" 
            data-active={activeTab === 'photos'} 
            onClick={() => setActiveTab('photos')}
          >
            <Camera size={16} /> Photos
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'map' && (
            <>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* History Controls */}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="button button-outline"
                >
                  <History size={16} />
                  {showHistory ? 'Hide' : 'Show'} History
                </button>

                {/* THIS IS THE MISSING DROPDOWN */}
                {showHistory && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#555' }}>Period:</span>
                    <select
                      value={historyPeriod}
                      // THIS IS THE FIX:
                      onChange={(e) => setHistoryPeriod(Number(e.target.value))}
                      className="input"
                      style={{ padding: '0.5rem', marginTop: 0, width: 'auto' }}
                    >
                      <option value={1}>Last 1 hour</option>
                      <option value={3}>Last 3 hours</option>
                      <option value={6}>Last 6 hours</option>
                      <option value={12}>Last 12 hours</option>
                      <option value={24}>Last 24 hours</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="card" style={{ height: '500px', padding: 0, overflow: 'hidden' }}>
                <MapView
                  myLocation={myLatestLocation}
                  partnerLocation={partnerLocation}
                  myName={myName}
                  partnerName={partnerLocation?.partner_name}
                  showHistory={showHistory}
                  myHistory={myHistory}
                  partnerHistory={partnerHistory}
                />
              </div>
            </>
          )}

          {activeTab === 'voice' && (
            <>
              <div className="card">
                <VoiceRecorder
                  user={user}
                  myName={myName}
                  groupId={groupId}
                  onSent={() => queryClient.invalidateQueries({ queryKey: ['voiceMessages', groupId] })}
                />
              </div>
              <div className="card">
                <VoiceMessageList
                  messages={voiceMessages}
                  currentUserEmail={user?.email}
                />
              </div>
            </>
          )}

          {activeTab === 'photos' && (
            <>
              <div className="card">
                <CameraCapture
                  user={user}
                  myName={myName}
                  myLocation={myLatestLocation}
                  groupId={groupId}
                  onSent={() => queryClient.invalidateQueries({ queryKey: ['photos', groupId] })}
                />
              </div>
              <div className="card">
                <PhotoGallery
                  photos={photos}
                  currentUserEmail={user?.email}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}