import ApiConnection from '../components/ApiConnection.jsx';
import './DevelopmentSetup.css';

export default function DevelopmentSetup() {
  return (
    <main className="development-setup">
      <p className="development-setup__eyebrow">Internal development</p>
      <h1>NourishNet</h1>
      <p>The foundation for tracking daily food, Calories, Protein, Fat, and Carbohydrates.</p>
      <p>
        This setup page checks your local services. Food tracking and accounts are not available
        yet.
      </p>
      <ApiConnection />
      <p className="development-setup__note">Use synthetic data only during development.</p>
    </main>
  );
}
