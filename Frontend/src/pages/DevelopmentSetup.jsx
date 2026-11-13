import ApiConnection from '../components/ApiConnection/ApiConnection.jsx';
import './DevelopmentSetup.css';

export default function DevelopmentSetup({ mainRef }) {
  return (
    <main ref={mainRef} id="main-content" tabIndex={-1} className="development-setup">
      <p className="development-setup__eyebrow">Internal development</p>
      <h1>NourishNet</h1>
      <p>The foundation for tracking daily food, Calories, Protein, Fat, and Carbohydrates.</p>
      <p>Check your local services here, or open the food diary demo without signing in.</p>
      <div className="design-actions">
        <a className="design-action" href="?demo=1#/app/dashboard">
          Open local demo
        </a>
        <a className="design-action" href="?demo=0#/app/login">
          Open account testing
        </a>
      </div>
      <ApiConnection />
      <p className="development-setup__note">Use synthetic data only during development.</p>
    </main>
  );
}
