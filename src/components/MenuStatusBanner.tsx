interface MenuStatusBannerProps {
  message: string;
  reason?: string;
}

export function MenuStatusBanner({ message, reason }: MenuStatusBannerProps) {
  return (
    <div className="menu-status-banner" role="status">
      <p className="menu-status-banner__message">{message}</p>
      {reason && <p className="menu-status-banner__reason">{reason}</p>}
    </div>
  );
}
