import ErrorPage from './ErrorPage.jsx';

export default function ServerError500() {
  return (
    <ErrorPage
      code="500"
      title="Tuvimos un inconveniente"
      message="Estamos trabajando para solucionarlo. Esperá unos instantes y probá de nuevo."
      accent="#536875"
    />
  );
}
