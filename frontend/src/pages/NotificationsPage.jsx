import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { errorMessage } from "../api/client";
import { notificationsApi } from "../api/notifications";
import { useSocket } from "../context/SocketContext";
import { Button, EmptyState, Notice, PageHeading, Panel, SelectField, Spinner, formatDate } from "../components/UI";

const notificationTypes = [
  "booking_requested",
  "booking_confirmed",
  "booking_rejected",
  "booking_cancelled_by_passenger",
  "booking_cancelled_by_driver",
  "ride_started",
  "ride_completed",
  "ride_cancelled",
  "driver_application_approved",
  "driver_application_rejected",
  "identity_verification_approved",
  "identity_verification_rejected",
  "account_security",
];

const isToday = (value) => {
  const date = new Date(value);
  const now = new Date();
  return !Number.isNaN(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
};

const notificationIcon = (type) => {
  if (type?.startsWith("booking_")) return "↗";
  if (type?.startsWith("ride_")) return "⌁";
  if (type?.startsWith("driver_application_")) return "✓";
  if (type?.startsWith("identity_verification_")) return "◇";
  return "•";
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { setUnreadCount, refreshUnreadCount, clearNotificationError } = useSocket();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [readFilter, setReadFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (pageNumber = page) => {
    const result = await notificationsApi.list({
      page: pageNumber,
      limit: 20,
      read: readFilter,
      ...(typeFilter ? { type: typeFilter } : {}),
    });
    clearNotificationError();
    setItems(result.notifications);
    setPage(result.page);
    setTotalPages(result.totalPages);
    setUnreadCount(result.unreadCount);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    notificationsApi.list({
      page: 1,
      limit: 20,
      read: readFilter,
      ...(typeFilter ? { type: typeFilter } : {}),
    })
      .then((result) => {
        if (!active) return;
        clearNotificationError();
        setItems(result.notifications);
        setPage(result.page);
        setTotalPages(result.totalPages);
        setUnreadCount(result.unreadCount);
      })
      .catch((requestError) => { if (active) setError(errorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [readFilter, typeFilter]);

  useEffect(() => {
    const refreshOnSocket = () => {
      refreshUnreadCount().catch((requestError) => setError(errorMessage(requestError)));
      if (page === 1) load(1).catch((requestError) => setError(errorMessage(requestError)));
    };
    window.addEventListener("avonex:notification", refreshOnSocket);
    return () => window.removeEventListener("avonex:notification", refreshOnSocket);
  }, [page, readFilter, typeFilter]);

  const markRead = async (notificationId) => {
    try {
      const result = await notificationsApi.markRead(notificationId);
      if (readFilter === "unread") {
        setItems((current) => current.filter((item) => item._id !== notificationId));
        if (items.length === 1 && page > 1) setPage((current) => current - 1);
        else await load(page);
      } else {
        setItems((current) => current.map((item) => item._id === notificationId ? result.notification : item));
      }
      await refreshUnreadCount();
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };
  const markAll = async () => {
    try {
      await notificationsApi.markAllRead();
      if (readFilter === "unread") {
        setItems([]);
        setPage(1);
        setTotalPages(1);
      } else {
        setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      }
      setUnreadCount(0);
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };
  const remove = async (notificationId) => {
    if (!window.confirm("Delete this notification?")) return;
    const wasUnread = items.some((item) => item._id === notificationId && !item.isRead);
    try {
      await notificationsApi.remove(notificationId);
      setItems((current) => current.filter((item) => item._id !== notificationId));
      if (wasUnread) await refreshUnreadCount();
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };
  const open = async (item) => {
    if (!item.isRead) await markRead(item._id);
    if (item.relatedBooking && ["booking_requested", "booking_cancelled_by_passenger"].includes(item.type)) {
      navigate("/driver/bookings");
    } else if (item.relatedBooking) navigate("/bookings");
    else if (item.relatedRide) navigate(`/rides/${item.relatedRide}`);
    else if (item.type?.startsWith("driver_application_")) navigate("/driver-application");
    else if (item.type?.startsWith("identity_verification_")) navigate("/profile");
  };
  const todayItems = items.filter((item) => isToday(item.createdAt));
  const earlierItems = items.filter((item) => !isToday(item.createdAt));

  return (
    <div className="page">
      <PageHeading eyebrow="YOUR UPDATES" title="Notifications" description="Booking and ride updates from your AVONEX community." action={items.some((item) => !item.isRead) && <Button variant="outline" onClick={markAll}>Mark all read</Button>} />
      {error && <Notice>{error}</Notice>}
      <div className="notification-filters">
        <SelectField
          label="Read status"
          value={readFilter}
          onChange={(event) => {
            setReadFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All notifications</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </SelectField>
        <SelectField
          label="Notification type"
          value={typeFilter}
          onChange={(event) => {
            setTypeFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All types</option>
          {notificationTypes.map((type) => (
            <option key={type} value={type}>{type.replaceAll("_", " ")}</option>
          ))}
        </SelectField>
      </div>
      <Panel>
        {loading ? <Spinner label="Loading notifications..." /> : items.length ? (
          <div className="notification-list">
            {[
              { title: "Today", notifications: todayItems },
              { title: "Earlier", notifications: earlierItems },
            ].filter((group) => group.notifications.length > 0).map((group) => (
              <section className="notification-group" key={group.title} aria-label={`${group.title} notifications`}>
                <h2 className="notification-group-title">{group.title}</h2>
                {group.notifications.map((item) => (
                  <article className={`notification-row ${item.isRead ? "" : "notification-unread"}`} key={item._id}>
                    <span className="notification-icon" aria-hidden="true">{notificationIcon(item.type)}</span>
                    <button className="notification-copy" type="button" onClick={() => open(item)}>
                      <span className="notification-type">{item.type?.replaceAll("_", " ")}</span>
                      <strong>{item.title}</strong>
                      <span>{item.message}</span>
                      <small>{formatDate(item.createdAt)}</small>
                    </button>
                    <div className="notification-actions">
                      {!item.isRead && <button className="text-button" type="button" onClick={() => markRead(item._id)}>Mark read</button>}
                      <button className="text-button danger-text" type="button" onClick={() => remove(item._id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </section>
            ))}
            {totalPages > 1 && <div className="pagination"><Button variant="outline" disabled={page <= 1} onClick={() => load(page - 1)}>← Previous</Button><span>Page {page} of {totalPages}</span><Button variant="outline" disabled={page >= totalPages} onClick={() => load(page + 1)}>Next →</Button></div>}
          </div>
        ) : <EmptyState title="No notifications found" description={readFilter === "unread" ? "You're all caught up for this filter." : "Important ride and booking updates will show up here."} />}
      </Panel>
    </div>
  );
};

export default NotificationsPage;
