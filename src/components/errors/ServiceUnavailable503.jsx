import ErrorPage from './ErrorPage.jsx';

export default function ServiceUnavailable503() {
  return (
    <ErrorPage
      code="503"
      title="El servicio está descansando"
      message="Estamos haciendo unas mejoras. Volvé a intentarlo en unos minutos."
      accent="#B0CAD5"
    />
  );
}
