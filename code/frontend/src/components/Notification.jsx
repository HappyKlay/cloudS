import { Bell, Check, X, Trash, Calendar, MessageSquare, UserPlus, Clock } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const NotificationsMenu = () => {
  const [notifications, setNotifications] = useState([

    { 
      id: 2, 
      message: "Jane Smith wants to share files with you", 
      time: "1h ago", 
      read: false,
      type: "request",
      action: "file_share",
      sender: "Jane Smith",
      avatar: "/api/placeholder/40/40"
    },
    { 
      id: 4, 
      message: "Marketing team declined your file sharing request", 
      time: "2d ago", 
      read: true,
      type: "reject",
      sender: "Marketing",
      avatar: "/api/placeholder/40/40"
    }
  ]);

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const dropdownRef = useRef(null);
  
  const unreadCount = notifications.filter(note => !note.read).length;
  const hasNotifications = notifications.length > 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const markAsRead = (id) => {
    setNotifications(
      notifications.map(note => 
        note.id === id ? { ...note, read: true } : note
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map(note => ({ ...note, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(
      notifications.filter(note => note.id !== id)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const filteredNotifications = filter === "all" 
    ? notifications 
    : filter === "unread" 
      ? notifications.filter(note => !note.read)
      : notifications.filter(note => note.type === filter);

  const getNotificationIcon = (type, action) => {
    switch(type) {
      case "request":
        if (action === "file_access") {
          return <div className="bg-blue-100 p-2 rounded-full"><UserPlus size={16} className="text-blue-500" /></div>;
        } else if (action === "file_share") {
          return <div className="bg-green-100 p-2 rounded-full"><MessageSquare size={16} className="text-green-500" /></div>;
        } else {
          return <div className="bg-purple-100 p-2 rounded-full"><UserPlus size={16} className="text-purple-500" /></div>;
        }
      case "reject":
        return <div className="bg-red-100 p-2 rounded-full"><X size={16} className="text-red-500" /></div>;
      default:
        return <div className="bg-gray-100 p-2 rounded-full"><Bell size={16} className="text-gray-500" /></div>;
    }
  };

  return (
    <div className="relative inline-block text-left">
      {/* Notification Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div 
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-700">Notifications</h3>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
              {hasNotifications && (
                <button 
                  onClick={clearAllNotifications}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm">No notifications to display</p>
                {filter !== "all" && (
                  <button 
                    onClick={() => setFilter("all")}
                    className="mt-2 text-xs text-blue-600 hover:underline"
                  >
                    View all notifications
                  </button>
                )}
              </div>
            ) : (
              <div>
                {filteredNotifications.map((note) => (
                  <div 
                    key={note.id} 
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition duration-150 flex ${!note.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="mr-3 mt-1">
                      {note.avatar ? (
                        <img src={note.avatar} alt={note.sender} className="w-8 h-8 rounded-full" />
                      ) : (
                        getNotificationIcon(note.type, note.action)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <p className={`text-sm ${!note.read ? 'font-medium' : ''}`}>
                          {note.message}
                        </p>
                        <div className="flex items-center ml-2">
                          {!note.read && (
                            <button 
                              onClick={() => markAsRead(note.id)}
                              className="p-1 hover:bg-gray-200 rounded-full"
                              title="Mark as read"
                            >
                              <Check size={14} className="text-gray-500" />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(note.id)}
                            className="p-1 hover:bg-gray-200 rounded-full"
                            title="Delete notification"
                          >
                            <X size={14} className="text-gray-500" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">{note.time}</span>
                        {note.type === "request" && (
                          <div className="flex space-x-1">
                            {note.action === "file_share" ? (
                              <>
                                <button className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
                                  Accept
                                </button>
                                <button className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                                  Reject
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                                  Accept
                                </button>
                                <button className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                                  Decline
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        {note.type === "reject" && (
                          <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsMenu;