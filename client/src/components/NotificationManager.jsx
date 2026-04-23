import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

// Supabase logo for notifications
const BUCKET_NAME = "assets";
const logoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/logo.png`;

/**
 * NotificationManager — Handles native push notifications for the PWA.
 * 
 * Admin gets notified about:
 *   - New complaints from users
 *   - New support tickets
 *   - New messages from other admins (Meeting Hub)
 * 
 * User gets notified about:
 *   - Payment confirmations
 *   - New notices published by admin
 *   - Support ticket status updates
 */
export default function NotificationManager() {
  const { user, isAdmin } = useAuth();
  const permissionGranted = useRef(false);
  const channelsRef = useRef([]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'granted') {
      permissionGranted.current = true;
      return true;
    }
    
    if (Notification.permission === 'denied') return false;

    // Ask for permission
    const result = await Notification.requestPermission();
    permissionGranted.current = result === 'granted';
    return permissionGranted.current;
  }, []);

  // Show a native notification
  const showNotification = useCallback((title, body, tag) => {
    if (!permissionGranted.current) return;

    // Use Service Worker notification if available (works in background too)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body,
          icon: logoUrl,
          badge: logoUrl,
          tag: tag || 'etaxpay-notification',
          vibrate: [100, 50, 100],
          renotify: true,
          requireInteraction: false,
          silent: false,
          data: { url: window.location.origin }
        });
      });
    } else {
      // Fallback to regular Notification API
      new Notification(title, {
        body,
        icon: logoUrl,
        tag: tag || 'etaxpay-notification',
      });
    }
  }, []);

  // Setup realtime listeners based on user role
  useEffect(() => {
    if (!user) return;

    // Request permission on login
    requestPermission();

    // Cleanup function
    const cleanup = () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    };

    // Clean any existing channels
    cleanup();

    if (isAdmin()) {
      // =============================================
      // ADMIN NOTIFICATIONS
      // =============================================

      // 1. New Complaints
      const complaintsChannel = supabase
        .channel('notif-complaints')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'complaints'
        }, (payload) => {
          const complaint = payload.new;
          showNotification(
            '📋 New Complaint Received',
            `Subject: ${complaint.subject || 'New complaint from user'}`,
            `complaint-${complaint.id}`
          );
        })
        .subscribe();
      channelsRef.current.push(complaintsChannel);

      // 2. New Support Tickets
      const supportChannel = supabase
        .channel('notif-support')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'support_tickets'
        }, (payload) => {
          const ticket = payload.new;
          showNotification(
            '🎫 New Support Ticket',
            `${ticket.subject || 'A user needs assistance'}`,
            `support-${ticket.id}`
          );
        })
        .subscribe();
      channelsRef.current.push(supportChannel);

      // 3. New Admin Messages (Meeting Hub)
      const messagesChannel = supabase
        .channel('notif-admin-messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_messages',
          filter: `receiver_id=eq.${user.id}`
        }, (payload) => {
          const msg = payload.new;
          showNotification(
            '💬 New Admin Message',
            `${msg.content?.substring(0, 80) || 'You have a new message'}`,
            `msg-${msg.id}`
          );
        })
        .subscribe();
      channelsRef.current.push(messagesChannel);

      // 4. New User Registrations
      const usersChannel = supabase
        .channel('notif-new-users')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'users'
        }, (payload) => {
          const newUser = payload.new;
          showNotification(
            '👤 New User Registered',
            `${newUser.username || 'A new user'} has joined the platform`,
            `user-${newUser.id}`
          );
        })
        .subscribe();
      channelsRef.current.push(usersChannel);

    } else {
      // =============================================
      // USER NOTIFICATIONS
      // =============================================

      // 1. Payment Confirmations
      const paymentsChannel = supabase
        .channel('notif-payments')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const payment = payload.new;
          showNotification(
            '✅ Payment Successful!',
            `₹${payment.amount || ''} payment has been confirmed`,
            `payment-${payment.id}`
          );
        })
        .subscribe();
      channelsRef.current.push(paymentsChannel);

      // 2. New Notices from Admin
      const noticesChannel = supabase
        .channel('notif-notices')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notices'
        }, (payload) => {
          const notice = payload.new;
          showNotification(
            '📢 New Notice',
            `${notice.title || 'A new notice has been published'}`,
            `notice-${notice.id}`
          );
        })
        .subscribe();
      channelsRef.current.push(noticesChannel);

      // 3. Support Ticket Updates
      const ticketUpdatesChannel = supabase
        .channel('notif-ticket-updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const ticket = payload.new;
          const statusMsg = ticket.status === 'resolved' 
            ? '✅ Your complaint has been resolved!' 
            : `Status updated: ${ticket.status}`;
          showNotification(
            '🔔 Ticket Update',
            `${ticket.subject}: ${statusMsg}`,
            `ticket-update-${ticket.id}`
          );
        })
        .subscribe();
      channelsRef.current.push(ticketUpdatesChannel);

      // 4. Monthly Tax Reminders (when admin creates new tax entry)
      const taxChannel = supabase
        .channel('notif-tax')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'monthly_taxes',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const tax = payload.new;
          showNotification(
            '💰 Tax Payment Due',
            `Your monthly tax of ₹${tax.amount || ''} is pending`,
            `tax-${tax.id}`
          );
        })
        .subscribe();
      channelsRef.current.push(taxChannel);
    }

    return cleanup;
  }, [user, isAdmin, requestPermission, showNotification]);

  // This component doesn't render anything visible
  return null;
}
