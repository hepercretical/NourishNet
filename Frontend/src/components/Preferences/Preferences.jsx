export default function Preferences({ account }) {
  return (
    <>
      <h1>Preferences</h1>
      <nav className="personal-menu" aria-label="Preferences">
        <a href="#/app/settings/profile">My profile</a>
        <a href="#/app/settings/goals">Daily calorie preferences</a>
        <a href="#/app/settings/notifications">Notifications</a>
        <a href="#/app/settings/password">Change password</a>
        <a href="#/app/settings/appearance">Appearance</a>
      </nav>
      <h2>Your account</h2>
      <dl>
        <dt>Display name</dt>
        <dd>{account.displayName}</dd>
        <dt>Diary time zone</dt>
        <dd>{account.timeZone}</dd>
      </dl>
      <p>Your diary uses this account's time zone when choosing a day. Sharing is off.</p>
      <a className="design-action" href="#/app/submissions">
        My submissions
      </a>
      <a className="design-action" href="#/app/dashboard">
        Open your diary
      </a>
      <p>To use account recovery, sign out and choose Forgot password on the sign-in screen.</p>
    </>
  );
}
