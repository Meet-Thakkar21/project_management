import React, { useState, useRef, useEffect } from 'react';
import './chat.css';

// Sample data
const initialChannels = [
  {
    id: 1,
    name: 'QnA',
    members: ['Kuldeep', 'Yash', 'Meet', 'Priya'],
    unread: 3
  },
  {
    id: 2,
    name: 'Frontend',
    members: ['Kuldeep', 'Meet', 'Rahul'],
    unread: 0
  },
  {
    id: 3,
    name: 'Backend',
    members: ['Yash', 'Meet', 'Ankit'],
    unread: 5
  },
  {
    id: 4,
    name: 'General',
    members: ['Kuldeep', 'Yash', 'Meet', 'Priya', 'Rahul', 'Ankit'],
    unread: 0
  },
  {
    id: 5,
    name: 'Random',
    members: ['Kuldeep', 'Yash', 'Meet'],
    unread: 0
  }
];

const allMembers = [
  { id: 1, name: 'Kuldeep', avatar: 'https://via.placeholder.com/40' },
  { id: 2, name: 'Yash', avatar: 'https://via.placeholder.com/40' },
  { id: 3, name: 'Meet', avatar: 'https://via.placeholder.com/40' },
  { id: 4, name: 'Priya', avatar: 'https://via.placeholder.com/40' },
  { id: 5, name: 'Rahul', avatar: 'https://via.placeholder.com/40' },
  { id: 6, name: 'Ankit', avatar: 'https://via.placeholder.com/40' }
];

const initialMessages = {
  1: [
    { id: 1, sender: 'Kuldeep', content: 'How do I create a React component?', timestamp: '10:30 AM', isSelf: false },
    { id: 2, sender: 'Yash', content: 'You can use the function or class syntax to create a component.', timestamp: '10:32 AM', isSelf: false },
    { id: 3, sender: 'Meet', content: 'Here\'s an example: function MyComponent() { return <div>Hello World</div> }', timestamp: '10:35 AM', isSelf: false },
    { id: 4, sender: 'You', content: 'Thanks for the help! 👍', timestamp: '10:40 AM', isSelf: true }
  ],
  2: [
    { id: 1, sender: 'Kuldeep', content: 'Has anyone tried the new React 18 features?', timestamp: '09:15 AM', isSelf: false },
    { id: 2, sender: 'Meet', content: 'Yes, the concurrent rendering is amazing!', timestamp: '09:20 AM', isSelf: false },
    { id: 3, sender: 'You', content: 'I\'m still learning about it. Any resources you recommend?', timestamp: '09:25 AM', isSelf: true },
    { id: 4, sender: 'Kuldeep', content: 'Check out the official React docs, they have great examples.', timestamp: '09:30 AM', isSelf: false }
  ],
  3: [
    { id: 1, sender: 'Yash', content: 'We need to optimize our database queries.', timestamp: '11:05 AM', isSelf: false },
    { id: 2, sender: 'Meet', content: 'I agree. The current implementation is too slow.', timestamp: '11:10 AM', isSelf: false },
    { id: 3, sender: 'Ankit', content: 'Let\'s use indexing and caching to improve performance.', timestamp: '11:15 AM', isSelf: false },
    { id: 4, sender: 'You', content: 'I can help with implementing Redis for caching.', timestamp: '11:20 AM', isSelf: true },
    { id: 5, sender: 'Yash', content: 'That would be great! Let\'s discuss the details tomorrow.', timestamp: '11:25 AM', isSelf: false }
  ],
  4: [
    { id: 1, sender: 'Kuldeep', content: 'Good morning everyone!', timestamp: '08:00 AM', isSelf: false },
    { id: 2, sender: 'Yash', content: 'Morning! How\'s everyone doing?', timestamp: '08:05 AM', isSelf: false },
    { id: 3, sender: 'You', content: 'Doing well, thanks! Ready for the sprint planning.', timestamp: '08:10 AM', isSelf: true },
    { id: 4, sender: 'Priya', content: 'I\'ll be a few minutes late to the meeting.', timestamp: '08:15 AM', isSelf: false }
  ],
  5: [
    { id: 1, sender: 'Kuldeep', content: 'Check out this meme 😂', timestamp: '12:30 PM', isSelf: false },
    { id: 2, sender: 'Yash', content: 'Haha, that\'s hilarious!', timestamp: '12:35 PM', isSelf: false },
    { id: 3, sender: 'You', content: 'LOL 🤣', timestamp: '12:40 PM', isSelf: true },
    { id: 4, sender: 'Meet', content: 'I\'m saving this one!', timestamp: '12:45 PM', isSelf: false }
  ]
};

function ChatApp() {
  const [channels, setChannels] = useState(initialChannels);
  const [selectedChannel, setSelectedChannel] = useState(channels[0]);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isMembersDropdownOpen, setIsMembersDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChannelMembersOpen, setIsChannelMembersOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChannel]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg = {
      id: messages[selectedChannel.id].length + 1,
      sender: 'You',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true
    };

    setMessages(prev => ({
      ...prev,
      [selectedChannel.id]: [...prev[selectedChannel.id], newMsg]
    }));
    setNewMessage('');
  };

  const handleAddChannel = () => {
    if (!newChannelName.trim() || selectedMembers.length === 0) return;

    const newChannel = {
      id: channels.length + 1,
      name: newChannelName,
      members: selectedMembers,
      unread: 0
    };

    setChannels(prev => [...prev, newChannel]);
    setMessages(prev => ({
      ...prev,
      [newChannel.id]: []
    }));
    setNewChannelName('');
    setSelectedMembers([]);
    setIsAddChannelOpen(false);
  };

  const toggleMemberSelection = (memberName) => {
    if (selectedMembers.includes(memberName)) {
      setSelectedMembers(prev => prev.filter(name => name !== memberName));
    } else {
      setSelectedMembers(prev => [...prev, memberName]);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="chat-app">
      <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>Channels</h2>
          <button className="icon-button" onClick={() => setIsAddChannelOpen(true)}>
            <i className="icon-plus">+</i>
          </button>
        </div>

        <div className="sidebar-content">
          <div className="channel-group">
            <ul className="channel-list">
              {channels.map(channel => (
                <li
                  key={channel.id}
                  className={`channel-item ${selectedChannel.id === channel.id ? 'active' : ''}`}
                  onClick={() => setSelectedChannel(channel)}
                >
                  <div className="channel-item-content">
                    <i className="icon-hash">#</i>
                    <span>{channel.name}</span>
                  </div>
                  {channel.unread > 0 && (
                    <span className="unread-badge">{channel.unread}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="member-group">
            <h3>Members</h3>
            <div className="member-dropdown">
              <button
                className="member-dropdown-button"
                onClick={() => setIsMembersDropdownOpen(!isMembersDropdownOpen)}
              >
                <i className="icon-users">👥</i>
                <span>Select Member</span>
                <i className="icon-chevron-down">▼</i>
              </button>

              {isMembersDropdownOpen && (
                <div className="dropdown-content">
                  {allMembers.map(member => (
                    <div key={member.id} className="dropdown-item">
                      <img src={member.avatar || "/placeholder.svg"} alt={member.name} className="avatar-small" />
                      <span>{member.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="chat-container">
        <header className="chat-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <i className="icon-menu">☰</i>
          </button>
          <div className="channel-info">
            <i className="icon-hash">#</i>
            <h2>{selectedChannel.name}</h2>
          </div>
          <div className="channel-actions">
            <button className="icon-button">
              <i className="icon-users">👥</i>
            </button>
            <div className="members-dropdown">
              <button
                className="members-dropdown-button"
                onClick={() => setIsChannelMembersOpen(!isChannelMembersOpen)}
              >
                <span>{selectedChannel.members.length} members</span>
                <i className="icon-chevron-down">▼</i>
              </button>

              {isChannelMembersOpen && (
                <div className="dropdown-content">
                  {selectedChannel.members.map((member, index) => (
                    <div key={index} className="dropdown-item">
                      <i className="icon-user">👤</i>
                      <span>{member}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="messages-container">
          <div className="messages">
            {messages[selectedChannel.id]?.map((message) => (
              <div
                key={message.id}
                className={`message ${message.isSelf ? 'message-self' : 'message-other'}`}
              >
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-sender">{message.sender}</span>
                    <span className="message-time">{message.timestamp}</span>
                  </div>
                  <p className="message-text">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <footer className="chat-footer">
          <form onSubmit={handleSendMessage} className="message-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message #${selectedChannel.name}`}
              className="message-input"
            />
            <button type="button" className="emoji-button">
              <i className="icon-smile">😊</i>
            </button>
            <button type="submit" className="send-button">
              <i className="icon-send">➤</i>
              <span>Send</span>
            </button>
          </form>
        </footer>
      </div>

      {isAddChannelOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Channel</h3>
              <button className="close-button" onClick={() => setIsAddChannelOpen(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label htmlFor="channel-name">Channel Name</label>
                <input
                  id="channel-name"
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="Enter channel name"
                />
              </div>
              <div className="form-group">
                <label>Select Members</label>
                <div className="member-grid">
                  {allMembers.map(member => (
                    <div
                      key={member.id}
                      className={`member-item ${selectedMembers.includes(member.name) ? 'selected' : ''}`}
                      onClick={() => toggleMemberSelection(member.name)}
                    >
                      <img src={member.avatar || "/placeholder.svg"} alt={member.name} className="avatar-small" />
                      <span>{member.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setIsAddChannelOpen(false)}>Cancel</button>
              <button className="add-button" onClick={handleAddChannel}>Add Channel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatApp;
