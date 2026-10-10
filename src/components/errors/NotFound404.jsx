import ErrorPage from './ErrorPage.jsx';

export default function NotFound404() {
  return (
    <ErrorPage
      code="404"
      title="No encontramos esa página"
      message="Puede que la dirección haya cambiado o que el contenido ya no esté disponible."
      accent="#57A2BC"
    />
  );
}
