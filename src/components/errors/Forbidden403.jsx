import ErrorPage from './ErrorPage.jsx';

export default function Forbidden403() {
  return (
    <ErrorPage
      code="403"
      title="No tenés permiso para entrar"
      message="Tu cuenta no tiene acceso a esta sección. Si creés que es un error, contactá a soporte."
      accent="#8299C8"
    />
  );
}
